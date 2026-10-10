import {
  Injectable,
  Logger,
  Optional,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { listGiteaUsers } from '../../lib/gitea';

export type GiteaUserSyncResult = {
  total: number;
  valid: number;
  created: number;
  updated: number;
  unchanged: number;
  syncedAt: string;
  skipped?: boolean;
};

const GITEA_SYNC_LOCK_ID = 1_904_202_027;

type NormalizedGiteaUser = {
  authProviderId: string | null;
  email: string;
  username: string;
  nombre: string;
  apellido: string;
};

@Injectable()
export class GiteaUserSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GiteaUserSyncService.name);
  private readonly intervalMs = this.getIntervalMs();
  private interval?: ReturnType<typeof setInterval>;
  private startupTimer?: ReturnType<typeof setTimeout>;
  private syncInProgress?: Promise<GiteaUserSyncResult>;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @Optional() private readonly dataSource?: DataSource,
  ) {}

  onModuleInit() {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.GITEA_USER_SYNC_ENABLED === 'false'
    ) {
      return;
    }

    this.startupTimer = setTimeout(() => {
      void this.syncUsers().catch((error) => this.logSyncError(error));
    }, 5_000);
    this.startupTimer.unref?.();

    this.interval = setInterval(() => {
      void this.syncUsers().catch((error) => this.logSyncError(error));
    }, this.intervalMs);
    this.interval.unref?.();
  }

  onModuleDestroy() {
    if (this.startupTimer) clearTimeout(this.startupTimer);
    if (this.interval) clearInterval(this.interval);
  }

  syncUsers(): Promise<GiteaUserSyncResult> {
    if (this.syncInProgress) return this.syncInProgress;

    this.syncInProgress = this.performSyncWithDistributedLock().finally(() => {
      this.syncInProgress = undefined;
    });

    return this.syncInProgress;
  }

  private async performSyncWithDistributedLock(): Promise<GiteaUserSyncResult> {
    if (!this.dataSource?.isInitialized) return this.performSync();

    const runner = this.dataSource.createQueryRunner();
    let acquired = false;
    try {
      await runner.connect();
      const rows = await runner.query(
        'SELECT pg_try_advisory_lock($1) AS acquired',
        [GITEA_SYNC_LOCK_ID],
      );
      acquired = rows[0]?.acquired === true;
      if (!acquired) {
        this.logger.debug(
          'Sincronizacion Gitea omitida: otra replica ya la esta ejecutando',
        );
        return {
          total: 0,
          valid: 0,
          created: 0,
          updated: 0,
          unchanged: 0,
          syncedAt: new Date().toISOString(),
          skipped: true,
        };
      }

      return await this.performSync();
    } finally {
      if (acquired) {
        try {
          await runner.query('SELECT pg_advisory_unlock($1)', [
            GITEA_SYNC_LOCK_ID,
          ]);
        } catch (error) {
          this.logSyncError(error);
        }
      }
      if (!runner.isReleased) await runner.release();
    }
  }

  private async performSync(): Promise<GiteaUserSyncResult> {
    const giteaUsers = await listGiteaUsers();
    const normalized = this.normalizeUsers(giteaUsers);
    const emails = normalized.map((user) => user.email);
    const providerIds = normalized
      .map((user) => user.authProviderId)
      .filter((id): id is string => Boolean(id));

    const [byEmail, byProvider] = await Promise.all([
      emails.length
        ? this.usuarioRepository.find({ where: { email: In(emails) } })
        : [],
      providerIds.length
        ? this.usuarioRepository.find({
            where: { authProviderId: In(providerIds) },
          })
        : [],
    ]);

    const existingByEmail = new Map(
      byEmail.map((usuario) => [usuario.email.toLowerCase(), usuario] as const),
    );
    const existingByProvider = new Map(
      byProvider
        .filter((usuario) => usuario.authProviderId)
        .map((usuario) => [usuario.authProviderId, usuario] as const),
    );
    const toCreate: Usuario[] = [];
    const toUpdate = new Map<number, Usuario>();
    let unchanged = 0;

    for (const giteaUser of normalized) {
      const usuario =
        existingByEmail.get(giteaUser.email) ||
        (giteaUser.authProviderId
          ? existingByProvider.get(giteaUser.authProviderId)
          : undefined);

      if (!usuario) {
        toCreate.push(
          this.usuarioRepository.create({
            authProviderId: giteaUser.authProviderId,
            email: giteaUser.email,
            githubUser: giteaUser.username,
            nombre: giteaUser.nombre,
            apellido: giteaUser.apellido,
            rol: 'alumno',
          }),
        );
        continue;
      }

      let changed = false;
      if (usuario.githubUser !== giteaUser.username) {
        usuario.githubUser = giteaUser.username;
        changed = true;
      }
      if (!usuario.authProviderId && giteaUser.authProviderId) {
        usuario.authProviderId = giteaUser.authProviderId;
        changed = true;
      }

      if (changed) toUpdate.set(usuario.id, usuario);
      else unchanged += 1;
    }

    if (toCreate.length) {
      for (let offset = 0; offset < toCreate.length; offset += 500) {
        await this.usuarioRepository
          .createQueryBuilder()
          .insert()
          .into(Usuario)
          .values(toCreate.slice(offset, offset + 500))
          .orIgnore()
          .execute();
      }
    }

    if (toUpdate.size) {
      await this.usuarioRepository.save([...toUpdate.values()], {
        chunk: 500,
        reload: false,
      });
    }

    const result: GiteaUserSyncResult = {
      total: giteaUsers.length,
      valid: normalized.length,
      created: toCreate.length,
      updated: toUpdate.size,
      unchanged,
      syncedAt: new Date().toISOString(),
    };
    this.logger.log(
      `Sincronizacion Gitea completada: ${result.created} creados, ${result.updated} actualizados, ${result.unchanged} sin cambios`,
    );
    return result;
  }

  private normalizeUsers(giteaUsers: any[]): NormalizedGiteaUser[] {
    const uniqueUsers = new Map<string, NormalizedGiteaUser>();

    for (const giteaUser of giteaUsers) {
      const email = String(giteaUser.email || '')
        .trim()
        .toLowerCase();
      const username = String(
        giteaUser.login || giteaUser.username || giteaUser.name || '',
      ).trim();

      if (
        !email ||
        !username ||
        giteaUser.is_admin ||
        giteaUser.prohibit_login
      ) {
        continue;
      }

      const authProviderId =
        giteaUser.id !== undefined && giteaUser.id !== null
          ? String(giteaUser.id)
          : null;
      const { nombre, apellido } = this.splitFullName(
        String(giteaUser.full_name || giteaUser.fullName || '').trim(),
        username,
      );
      uniqueUsers.set(authProviderId || email, {
        authProviderId,
        email,
        username,
        nombre,
        apellido,
      });
    }

    return [...uniqueUsers.values()];
  }

  private splitFullName(fullName: string, username: string) {
    const normalized = fullName.replace(/\s+/g, ' ').trim();
    if (!normalized) return { nombre: username, apellido: '' };

    if (normalized.includes(',')) {
      const [apellido, nombre] = normalized.split(',', 2);
      return {
        nombre: (nombre || '').trim() || username,
        apellido: (apellido || '').trim(),
      };
    }

    const parts = normalized.split(' ').filter(Boolean);
    if (parts.length === 1) return { nombre: parts[0], apellido: '' };

    return {
      nombre: parts.slice(0, -1).join(' '),
      apellido: parts.slice(-1).join(' '),
    };
  }

  private logSyncError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(
      `No se pudieron sincronizar usuarios de Gitea: ${message}`,
    );
  }

  private getIntervalMs() {
    const rawInterval = process.env.GITEA_USER_SYNC_INTERVAL_MS;
    const configured = rawInterval ? Number(rawInterval) : Number.NaN;
    return Number.isFinite(configured)
      ? Math.max(60_000, configured)
      : 10 * 60_000;
  }
}
