import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  IsNull,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import {
  deleteGiteaUser,
  getGiteaUserByUsername,
  listGiteaUsers,
  mapGiteaError,
  updateGiteaUserPassword,
} from '../../lib/gitea';
import { Usuario } from '../../entities/usuario.entity';
import {
  AdminAuditAction,
  AdminAuditLog,
} from '../../entities/admin-audit-log.entity';
import {
  Cursada,
  EntregaActividad,
  Materia,
  MateriaLog,
  MaintenanceSetting,
  ProfesorMateria,
  SolicitudAccesoMateria,
  UserActivity,
} from '../../entities/index.entity';
import { AdminUsuariosQueryDto } from './dto/admin-usuarios-query.dto';

const VALID_ROLES = ['alumno', 'docente', 'admin'] as const;
type UsuarioRol = (typeof VALID_ROLES)[number];

export type GiteaAccountSummary = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  htmlUrl: string;
  active: boolean;
  prohibitLogin: boolean;
  restricted: boolean;
  isAdmin: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
};

export type UnifiedAdminUserRow = {
  key: string;
  platformUser?: Usuario;
  giteaUser?: GiteaAccountSummary;
};

export type AdminUsuariosPagina = {
  items: UnifiedAdminUserRow[];
  total: number;
  page: number;
  limit: number;
  gitea: {
    total: number;
    syncedAt: string | null;
    error: string | null;
  };
};

type AdminGiteaDirectory = {
  users: any[];
  syncedAt: string | null;
  error: string | null;
  expiresAt: number;
};

@Injectable()
export class UsuarioService {
  private adminGiteaDirectory?: AdminGiteaDirectory;
  private adminGiteaRequest?: Promise<AdminGiteaDirectory>;

  private loadAdminGiteaDirectory(
    refresh = false,
  ): Promise<AdminGiteaDirectory> {
    if (this.adminGiteaRequest) return this.adminGiteaRequest;
    if (
      !refresh &&
      this.adminGiteaDirectory &&
      this.adminGiteaDirectory.expiresAt > Date.now()
    ) {
      return Promise.resolve(this.adminGiteaDirectory);
    }

    // El presupuesto cubre todas las paginas de Gitea, para que una falla
    // externa no impida responder con los usuarios del campus.
    this.adminGiteaRequest = listGiteaUsers({
      signal: AbortSignal.timeout(5_000),
    })
      .then((users) => {
        this.adminGiteaDirectory = {
          users,
          syncedAt: new Date().toISOString(),
          error: null,
          expiresAt: Date.now() + 60_000,
        };
        return this.adminGiteaDirectory;
      })
      .catch((error) => {
        this.adminGiteaDirectory = {
          users: this.adminGiteaDirectory?.users || [],
          syncedAt: this.adminGiteaDirectory?.syncedAt || null,
          error:
            error?.name === 'TimeoutError' || error?.name === 'AbortError'
              ? 'Gitea demoro demasiado en responder'
              : mapGiteaError(error).message,
          expiresAt: Date.now() + 5_000,
        };
        return this.adminGiteaDirectory;
      })
      .finally(() => {
        this.adminGiteaRequest = undefined;
      });
    return this.adminGiteaRequest;
  }

  private maintenanceStatusCache: {
    value: Awaited<ReturnType<UsuarioService['loadMaintenanceStatus']>>;
    expiresAt: number;
  } | null = null;

  // AuthSessionGuard llama a obtenerOCrearUsuarioDesdeAuthJs() en cada request
  // autenticada (no solo en el login). Sin este cache, cada una de las ~10
  // llamadas que dispara una sola carga de pantalla (dashboard, activity
  // tracker, etc.) vuelve a golpear la tabla "usuario". Un TTL corto es
  // suficiente: reduce el grueso de las consultas redundantes de una misma
  // rafaga de requests sin retrasar de forma perceptible cambios de rol o
  // suspensiones (mismo criterio que maintenanceStatusCache).
  private readonly sessionUserCache = new Map<
    string,
    { usuario: Usuario; expiresAt: number }
  >();
  private readonly sessionUserCacheTtlMs = Math.max(
    0,
    Number(process.env.SESSION_USER_CACHE_TTL_MS ?? 10_000) || 10_000,
  );

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(AdminAuditLog)
    private readonly adminAuditRepository: Repository<AdminAuditLog>,
    @InjectRepository(ProfesorMateria)
    private readonly profesorMateriaRepository: Repository<ProfesorMateria>,
    @InjectRepository(Materia)
    private readonly materiaRepository: Repository<Materia>,
    @InjectRepository(Cursada)
    private readonly cursadaRepository: Repository<Cursada>,
    @InjectRepository(EntregaActividad)
    private readonly entregaRepository: Repository<EntregaActividad>,
    @InjectRepository(SolicitudAccesoMateria)
    private readonly solicitudAccesoRepository: Repository<SolicitudAccesoMateria>,
    @InjectRepository(MateriaLog)
    private readonly materiaLogRepository: Repository<MateriaLog>,
    @InjectRepository(MaintenanceSetting)
    private readonly maintenanceRepository: Repository<MaintenanceSetting>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
    private readonly dataSource: DataSource,
  ) {}

  private isConfiguredAdminEmail(email?: string): boolean {
    const normalizeList = (value?: string) =>
      (value || '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    const adminEmails = normalizeList(process.env.AUTH_ADMIN_EMAILS);
    const normalizedEmail = email?.toLowerCase();

    if (normalizedEmail) {
      for (const entry of adminEmails) {
        if (!entry) continue;
        // entradas que empiezan con @ se interpretan como dominio (p.e. @unahur.edu.ar)
        if (entry.startsWith('@')) {
          if (normalizedEmail.endsWith(entry)) return true;
        } else if (entry.includes('@')) {
          // entrada con @: comparar correo exacto
          if (normalizedEmail === entry) return true;
        } else {
          // entrada sin @: interpretarla como dominio corto (p.e. unahur.edu.ar)
          if (normalizedEmail.endsWith(`@${entry}`)) return true;
        }
      }
    }

    return false;
  }

  private getRoleForAuthUser(email?: string): string {
    return this.isConfiguredAdminEmail(email) ? 'admin' : 'alumno';
  }

  async obtenerOCrearUsuarioDesdeAuthJs(authUser: any): Promise<Usuario> {
    const cacheKey = String(authUser.id || authUser.email || '');
    const cached = cacheKey ? this.sessionUserCache.get(cacheKey) : undefined;
    if (cached && cached.expiresAt > Date.now()) {
      // Copia superficial como instancia real de la entidad: cada request
      // debe poder mutar/guardar su propia copia sin afectar la entrada
      // compartida en el cache ni perder el tipo esperado por TypeORM.
      return this.usuarioRepository.create({ ...cached.usuario });
    }

    const usuario = await this.resolveUsuarioDesdeAuthJs(authUser);

    if (cacheKey && this.sessionUserCacheTtlMs > 0) {
      this.sessionUserCache.set(cacheKey, {
        usuario,
        expiresAt: Date.now() + this.sessionUserCacheTtlMs,
      });
    }

    return usuario;
  }

  private async resolveUsuarioDesdeAuthJs(authUser: any): Promise<Usuario> {
    const authProviderId = authUser.id || authUser.email;
    const email = authUser.email;
    const fullName = authUser.name || '';
    const [nombre, ...apellidoParts] = fullName.split(' ').filter(Boolean);
    const githubUser =
      authUser.giteaUser ||
      authUser.providerUsername ||
      authUser.githubUser ||
      null;
    const configuredRole = this.getRoleForAuthUser(email);

    let usuario = await this.usuarioRepository.findOne({
      where: { authProviderId },
    });

    if (usuario) {
      let shouldSave = false;
      if (githubUser && usuario.githubUser !== githubUser) {
        usuario.githubUser = githubUser;
        shouldSave = true;
      }
      if (usuario.activo === false) {
        return usuario;
      }
      const now = new Date();
      const configuredLastAccessInterval = Number(
        process.env.USER_LAST_ACCESS_WRITE_INTERVAL_MS || 15 * 60 * 1000,
      );
      const lastAccessIntervalMs = Number.isFinite(configuredLastAccessInterval)
        ? Math.max(60_000, configuredLastAccessInterval)
        : 15 * 60 * 1000;
      if (
        !usuario.ultimoAccesoAt ||
        now.getTime() - usuario.ultimoAccesoAt.getTime() >= lastAccessIntervalMs
      ) {
        usuario.ultimoAccesoAt = now;
        shouldSave = true;
      }
      if (configuredRole === 'admin' && usuario.rol !== 'admin') {
        usuario.rol = configuredRole;
        shouldSave = true;
      }
      return shouldSave ? await this.usuarioRepository.save(usuario) : usuario;
    }

    if (email) {
      usuario = await this.usuarioRepository.findOne({
        where: { email },
      });

      if (usuario) {
        usuario.authProviderId = authProviderId;
        usuario.nombre = nombre || usuario.nombre;
        usuario.apellido = apellidoParts.join(' ') || usuario.apellido;
        usuario.githubUser = githubUser || usuario.githubUser;
        usuario.ultimoAccesoAt = new Date();
        if (configuredRole === 'admin') {
          usuario.rol = configuredRole;
        }

        return await this.usuarioRepository.save(usuario);
      }
    }

    usuario = this.usuarioRepository.create({
      authProviderId,
      email: email || '',
      nombre: nombre || fullName || githubUser || '',
      apellido: apellidoParts.join(' ') || '',
      rol: configuredRole,
      githubUser,
      ultimoAccesoAt: new Date(),
    });

    return await this.usuarioRepository.save(usuario);
  }

  async obtenerOCrearUsuario(authUser: any): Promise<Usuario> {
    if (authUser?.localUsuario?.id) {
      return authUser.localUsuario as Usuario;
    }

    return this.obtenerOCrearUsuarioDesdeAuthJs({
      id: authUser.sub,
      email: authUser.email,
      name: authUser.name || authUser.given_name,
      githubUser: authUser.preferred_username,
    });
  }

  async obtenerPorAuthProviderId(authProviderId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { authProviderId },
      relations: ['materiasAlumno', 'materiasProfesor'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async obtenerPorId(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: ['materiasAlumno', 'materiasProfesor'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Listado combinado de usuarios de la plataforma + cuentas de Gitea para
   * /admin/usuarios, paginado en el servidor.
   *
   * La pantalla mezcla y ordena en una sola tabla los usuarios de la
   * plataforma con las cuentas de Gitea que todavia no tienen usuario local
   * (para poder importarlas), asi que no alcanza con un simple
   * skip/take sobre la tabla "usuario": Gitea es una fuente externa que no
   * se puede paginar en el mismo orden. Para no volver a pagar el costo de
   * antes (traer TODOS los usuarios con sus inscripciones/docencias
   * completas en cada carga), esto se resuelve en dos pasadas:
   *   1. Se trae cada usuario de la plataforma sin relaciones (liviano,
   *      incluso con miles de filas) + la lista de Gitea, se combinan,
   *      filtran, ordenan y pagina en memoria.
   *   2. Recien ahi se busca materiasAlumno/materiasProfesor, y solo para
   *      los ~10 usuarios que van a mostrarse en esa pagina.
   */
  async listarUsuariosAdminPaginado(
    query: AdminUsuariosQueryDto,
  ): Promise<AdminUsuariosPagina> {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));

    const where: Partial<Pick<Usuario, 'rol' | 'activo'>> = {};
    if (query.rol !== 'todos') where.rol = query.rol;
    if (query.estado !== 'todos') where.activo = query.estado === 'activo';

    const [platformUsers, giteaDirectory] = await Promise.all([
      this.usuarioRepository.find({
        where,
        select: [
          'id',
          'nombre',
          'apellido',
          'email',
          'rol',
          'activo',
          'githubUser',
          'ultimoAccesoAt',
          'suspendidoAt',
          'suspensionMotivo',
        ],
      }),
      this.loadAdminGiteaDirectory(query.refreshGitea),
    ]);

    const usuariosParaPromover = platformUsers.filter(
      (usuario) =>
        usuario.rol !== 'admin' && this.isConfiguredAdminEmail(usuario.email),
    );
    if (usuariosParaPromover.length > 0) {
      for (const usuario of usuariosParaPromover) usuario.rol = 'admin';
      await this.usuarioRepository.save(usuariosParaPromover);
    }

    const giteaUsersRaw = giteaDirectory.users;

    const mapGiteaUser = (raw: any): GiteaAccountSummary => ({
      id: Number(raw.id),
      username: String(raw.login || '').trim(),
      fullName: String(raw.full_name || ''),
      email: String(raw.email || ''),
      avatarUrl: String(raw.avatar_url || ''),
      htmlUrl: String(raw.html_url || ''),
      active: raw.active !== false,
      prohibitLogin: Boolean(raw.prohibit_login),
      restricted: Boolean(raw.restricted),
      isAdmin: Boolean(raw.is_admin),
      createdAt: raw.created || null,
      lastLoginAt: raw.last_login || null,
    });

    const giteaByUsername = new Map<string, any>(
      giteaUsersRaw
        .map((raw): [string, any] => [
          String(raw.login || '')
            .trim()
            .toLowerCase(),
          raw,
        ])
        .filter(([username]) => username),
    );

    const linkedUsernames = new Set<string>();
    let rows: UnifiedAdminUserRow[] = platformUsers.map((platformUser) => {
      const usernameKey = platformUser.githubUser?.trim().toLowerCase();
      const giteaRaw = usernameKey
        ? giteaByUsername.get(usernameKey)
        : undefined;
      if (giteaRaw && usernameKey) linkedUsernames.add(usernameKey);
      return {
        key: `platform-${platformUser.id}`,
        platformUser,
        giteaUser: giteaRaw ? mapGiteaUser(giteaRaw) : undefined,
      };
    });

    // Las cuentas de Gitea sin usuario local solo tienen sentido cuando no
    // se filtra por rol: ese filtro es un dato de la plataforma que estas
    // cuentas no tienen.
    if (query.rol === 'todos') {
      for (const [username, raw] of giteaByUsername) {
        if (linkedUsernames.has(username)) continue;
        rows.push({ key: `gitea-${raw.id}`, giteaUser: mapGiteaUser(raw) });
      }
    }

    if (query.estado !== 'todos') {
      rows = rows.filter((row) => {
        if (row.platformUser) return true; // ya filtrado por SQL arriba
        const active = Boolean(
          row.giteaUser?.active && !row.giteaUser?.prohibitLogin,
        );
        return query.estado === 'activo' ? active : !active;
      });
    }

    const term = query.search.trim().toLowerCase();
    if (term) {
      rows = rows.filter((row) => {
        const usuario = row.platformUser;
        const giteaUser = row.giteaUser;
        return [
          usuario?.nombre,
          usuario?.apellido,
          usuario?.email,
          usuario?.githubUser,
          giteaUser?.username,
          giteaUser?.fullName,
          giteaUser?.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(term);
      });
    }

    rows.sort((a, b) => {
      const aName =
        `${a.platformUser?.apellido || ''} ${a.platformUser?.nombre || ''}`.trim() ||
        a.giteaUser?.username ||
        '';
      const bName =
        `${b.platformUser?.apellido || ''} ${b.platformUser?.nombre || ''}`.trim() ||
        b.giteaUser?.username ||
        '';
      return aName.localeCompare(bName, 'es');
    });

    const total = rows.length;
    const start = (page - 1) * limit;
    const pageRows = rows.slice(start, start + limit);

    const pageUserIds = pageRows
      .map((row) => row.platformUser?.id)
      .filter((id): id is number => Boolean(id));

    if (pageUserIds.length > 0) {
      const withRelations = await this.usuarioRepository.find({
        where: { id: In(pageUserIds) },
        relations: [
          'materiasAlumno',
          'materiasAlumno.materia',
          'materiasAlumno.comision',
          'materiasProfesor',
          'materiasProfesor.materia',
        ],
      });
      const byId = new Map(withRelations.map((u) => [u.id, u]));
      for (const row of pageRows) {
        if (row.platformUser) {
          row.platformUser = byId.get(row.platformUser.id) || row.platformUser;
        }
      }
    }

    return {
      items: pageRows,
      total,
      page,
      limit,
      gitea: {
        total: giteaUsersRaw.length,
        syncedAt: giteaDirectory.syncedAt,
        error: giteaDirectory.error,
      },
    };
  }

  async listarUsuariosGitea() {
    try {
      const [directory, platformUsers] = await Promise.all([
        this.loadAdminGiteaDirectory(),
        // Solo se necesitan estas columnas para cruzar por githubUser; traer
        // la entidad completa de cada usuario de la plataforma es
        // desperdicio de payload en un endpoint que ya hace un fetch externo.
        this.usuarioRepository.find({
          where: { githubUser: Not(IsNull()) },
          select: ['id', 'email', 'nombre', 'apellido', 'rol', 'githubUser'],
        }),
      ]);
      if (directory.error) {
        throw new BadRequestException(
          `No se pudo consultar las cuentas de Gitea: ${directory.error}`,
        );
      }
      const giteaUsers = directory.users;
      const platformByUsername = new Map(
        platformUsers
          .filter((user) => user.githubUser?.trim())
          .map((user) => [user.githubUser.trim().toLowerCase(), user]),
      );

      const users = giteaUsers
        .map((giteaUser) => {
          const username = String(giteaUser.login || '').trim();
          const platformUser = platformByUsername.get(username.toLowerCase());

          return {
            id: Number(giteaUser.id),
            username,
            fullName: String(giteaUser.full_name || ''),
            email: String(giteaUser.email || ''),
            avatarUrl: String(giteaUser.avatar_url || ''),
            htmlUrl: String(giteaUser.html_url || ''),
            active: giteaUser.active !== false,
            prohibitLogin: Boolean(giteaUser.prohibit_login),
            restricted: Boolean(giteaUser.restricted),
            isAdmin: Boolean(giteaUser.is_admin),
            createdAt: giteaUser.created || null,
            lastLoginAt: giteaUser.last_login || null,
            platformUser: platformUser
              ? {
                  id: platformUser.id,
                  email: platformUser.email,
                  nombre: platformUser.nombre,
                  apellido: platformUser.apellido,
                  rol: platformUser.rol,
                }
              : null,
          };
        })
        .filter((user) => user.username)
        .sort((a, b) => a.username.localeCompare(b.username, 'es'));

      return {
        users,
        total: users.length,
        syncedAt: directory.syncedAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const mapped = mapGiteaError(error);
      throw new BadRequestException(
        `No se pudo consultar las cuentas de Gitea: ${mapped.message}`,
      );
    }
  }

  async actualizarPasswordGitea(
    actor: Usuario,
    username: string,
    password: string,
    mustChangePassword: boolean,
    correlationId?: string,
  ) {
    const normalizedUsername = username?.trim();
    if (!normalizedUsername) {
      throw new BadRequestException('Debe indicar el usuario de Gitea');
    }
    if (typeof password !== 'string' || password.length < 8) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres',
      );
    }
    if (password.length > 128) {
      throw new BadRequestException(
        'La contraseña no puede superar los 128 caracteres',
      );
    }

    try {
      const updated = await updateGiteaUserPassword(
        normalizedUsername,
        password,
        mustChangePassword,
      );
      if (!updated) {
        throw new NotFoundException('La cuenta no existe en Gitea');
      }

      const target = await this.usuarioRepository.findOne({
        where: { githubUser: normalizedUsername },
      });
      await this.registrarAdminAudit({
        actor,
        target: target || undefined,
        targetEmail: target?.email || updated.email || undefined,
        action: AdminAuditAction.GITEA_PASSWORD_UPDATED,
        title: 'Contraseña de Gitea actualizada',
        detail: `${this.formatUser(actor)} actualizo la contraseña de la cuenta Gitea ${normalizedUsername}.`,
        newValues: {
          giteaUser: normalizedUsername,
          mustChangePassword,
        },
        correlationId,
      });

      return {
        username: normalizedUsername,
        mustChangePassword,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const mapped = mapGiteaError(error);
      throw new BadRequestException(
        `No se pudo actualizar la contraseña de Gitea: ${mapped.message}`,
      );
    }
  }

  async actualizarGithubUser(
    usuarioId: number,
    githubUser: string,
  ): Promise<Usuario> {
    const usuario = await this.obtenerPorId(usuarioId);
    usuario.githubUser = githubUser || null;
    return await this.usuarioRepository.save(usuario);
  }

  async actualizarRolUsuario(
    actor: Usuario,
    usuarioId: number,
    rol: string,
    correlationId?: string,
  ): Promise<Usuario> {
    const normalizedRole = rol?.trim().toLowerCase() as UsuarioRol;
    if (!VALID_ROLES.includes(normalizedRole)) {
      throw new BadRequestException('Rol invalido');
    }

    const usuario = await this.obtenerPorId(usuarioId);
    const previousRole = usuario.rol;
    if (previousRole === normalizedRole) return usuario;

    usuario.rol = normalizedRole;
    const updated = await this.usuarioRepository.save(usuario);

    await this.registrarAdminAudit({
      actor,
      target: updated,
      action: AdminAuditAction.USER_ROLE_UPDATED,
      title: 'Rol de usuario actualizado',
      detail: `${this.formatUser(actor)} cambio el rol de ${this.formatUser(updated)} de ${previousRole} a ${normalizedRole}.`,
      previousValues: { rol: previousRole },
      newValues: { rol: normalizedRole },
      correlationId,
    });

    return updated;
  }

  async suspenderUsuario(
    actor: Usuario,
    usuarioId: number,
    motivo?: string,
    correlationId?: string,
  ): Promise<Usuario> {
    if (actor.id === usuarioId) {
      throw new ForbiddenException('No puedes suspender tu propio usuario');
    }

    const usuario = await this.obtenerPorId(usuarioId);
    if (usuario.activo === false) return usuario;

    const previousValues = {
      activo: usuario.activo,
      suspendidoAt: usuario.suspendidoAt,
      suspendidoPorId: usuario.suspendidoPorId,
      suspensionMotivo: usuario.suspensionMotivo,
    };

    usuario.activo = false;
    usuario.suspendidoAt = new Date();
    usuario.suspendidoPorId = actor.id;
    usuario.suspensionMotivo = motivo?.trim() || null;
    const updated = await this.usuarioRepository.save(usuario);

    await this.registrarAdminAudit({
      actor,
      target: updated,
      action: AdminAuditAction.USER_SUSPENDED,
      title: 'Usuario suspendido',
      detail: `${this.formatUser(actor)} suspendio a ${this.formatUser(updated)}.`,
      previousValues,
      newValues: {
        activo: updated.activo,
        suspendidoAt: updated.suspendidoAt,
        suspendidoPorId: updated.suspendidoPorId,
        suspensionMotivo: updated.suspensionMotivo,
      },
      correlationId,
    });

    return updated;
  }

  async reactivarUsuario(
    actor: Usuario,
    usuarioId: number,
    correlationId?: string,
  ): Promise<Usuario> {
    const usuario = await this.obtenerPorId(usuarioId);
    if (usuario.activo === true) return usuario;

    const previousValues = {
      activo: usuario.activo,
      suspendidoAt: usuario.suspendidoAt,
      suspendidoPorId: usuario.suspendidoPorId,
      suspensionMotivo: usuario.suspensionMotivo,
    };

    usuario.activo = true;
    usuario.suspendidoAt = null;
    usuario.suspendidoPorId = null;
    usuario.suspensionMotivo = null;
    const updated = await this.usuarioRepository.save(usuario);

    await this.registrarAdminAudit({
      actor,
      target: updated,
      action: AdminAuditAction.USER_REACTIVATED,
      title: 'Usuario reactivado',
      detail: `${this.formatUser(actor)} reactivo a ${this.formatUser(updated)}.`,
      previousValues,
      newValues: {
        activo: updated.activo,
        suspendidoAt: updated.suspendidoAt,
        suspendidoPorId: updated.suspendidoPorId,
        suspensionMotivo: updated.suspensionMotivo,
      },
      correlationId,
    });

    return updated;
  }

  async eliminarUsuario(
    actor: Usuario,
    usuarioId: number,
    correlationId?: string,
  ) {
    if (actor.id === usuarioId) {
      throw new ForbiddenException('No puedes eliminar tu propio usuario');
    }

    const usuario = await this.obtenerPorId(usuarioId);
    const giteaUsername = usuario.githubUser?.trim() || null;

    if (giteaUsername) {
      try {
        const giteaUser = await getGiteaUserByUsername(giteaUsername);
        if (giteaUser) await deleteGiteaUser(giteaUsername);
        this.adminGiteaDirectory = undefined;
      } catch (error) {
        const mapped = mapGiteaError(error);
        throw new BadRequestException(
          `No se pudo eliminar la cuenta de Gitea: ${mapped.message}`,
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(SolicitudAccesoMateria, { docenteId: usuario.id });
      await manager.delete(Usuario, usuario.id);
    });

    await this.registrarAdminAudit({
      actor,
      targetEmail: usuario.email,
      action: AdminAuditAction.USER_DELETED,
      title: 'Usuario eliminado',
      detail: `${this.formatUser(actor)} elimino a ${this.formatUser(usuario)} de la plataforma${giteaUsername ? ` y de Gitea (${giteaUsername})` : ''}.`,
      previousValues: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        giteaUser: giteaUsername,
      },
      newValues: { eliminado: true, giteaEliminado: Boolean(giteaUsername) },
      correlationId,
    });

    return { message: 'Usuario eliminado de la plataforma y Gitea' };
  }

  async listarAdminAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 300);
    return this.adminAuditRepository.find({
      relations: ['actor', 'targetUser'],
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });
  }

  async obtenerMetricasAdmin() {
    const desdeEntregasRecientes = new Date();
    desdeEntregasRecientes.setDate(desdeEntregasRecientes.getDate() - 7);

    const [
      usuariosActivos,
      usuariosSuspendidos,
      docentesPendientes,
      materiasActivas,
      entregasRecientes,
    ] = await Promise.all([
      this.usuarioRepository.count({ where: { activo: true } }),
      this.usuarioRepository.count({ where: { activo: false } }),
      this.solicitudAccesoRepository.count({ where: { estado: 'pendiente' } }),
      this.cursadaRepository.count({
        where: { activa: true, materia: { archivada: false } },
      }),
      this.entregaRepository.count({
        where: { updatedAt: MoreThanOrEqual(desdeEntregasRecientes) },
      }),
    ]);

    return {
      usuariosActivos,
      usuariosSuspendidos,
      docentesPendientes,
      materiasActivas,
      entregasRecientes,
    };
  }

  private resolveActivityPath(rawPath?: string): {
    path: string;
    label: string;
  } {
    const cleanPath = String(rawPath || '/materias')
      .split('?')[0]
      .slice(0, 180);
    const routes: Array<[RegExp, string, string]> = [
      [/^\/$|^\/materias\/?$/, '/materias', 'Materias'],
      [/^\/dashboard\/?$/, '/dashboard', 'Dashboard'],
      [/^\/calendario\/?$/, '/calendario', 'Calendario'],
      [/^\/buscar\/?$/, '/buscar', 'Buscador'],
      [/^\/admin\/estadisticas\/?$/, '/admin/estadisticas', 'Estadísticas'],
      [
        /^\/admin\/usuarios\/?$/,
        '/admin/usuarios',
        'Administración de usuarios',
      ],
      [
        /^\/admin\/solicitudes\/?$/,
        '/admin/solicitudes',
        'Solicitudes docentes',
      ],
      [
        /^\/materia\/\d+\/material/,
        '/materia/:id/material',
        'Material de una materia',
      ],
      [
        /^\/materia\/\d+\/videos/,
        '/materia/:id/videos',
        'Videos de una materia',
      ],
      [
        /^\/materia\/\d+\/semanas/,
        '/materia/:id/semanas',
        'Semanas de una materia',
      ],
      [
        /^\/materia\/\d+\/cronograma/,
        '/materia/:id/cronograma',
        'Cronograma de una materia',
      ],
      [
        /^\/materia\/\d+\/mis-alumnos/,
        '/materia/:id/mis-alumnos',
        'Alumnos de una materia',
      ],
      [
        /^\/materia\/\d+\/actividades/,
        '/materia/:id/actividades',
        'Actividades de una materia',
      ],
      [
        /^\/materia\/\d+\/configuracion/,
        '/materia/:id/configuracion',
        'Configuración de una materia',
      ],
      [/^\/materia\/\d+/, '/materia/:id', 'Inicio de una materia'],
    ];
    const match = routes.find(([pattern]) => pattern.test(cleanPath));
    return match
      ? { path: match[1], label: match[2] }
      : { path: '/otra-seccion', label: 'Otra sección' };
  }

  async registrarActividadUsuario(
    usuario: Usuario,
    input: { kind?: string; path?: string },
  ) {
    const kind = input?.kind === 'page_view' ? 'page_view' : 'presence';
    const route = this.resolveActivityPath(input?.path);
    const now = new Date();

    // Este endpoint pasa por AuthSessionGuard como cualquier otro, que ya
    // actualiza usuario.ultimoAccesoAt con un margen de 15 minutos (ver
    // obtenerOCrearUsuarioDesdeAuthJs). Escribirlo tambien aca, sin
    // throttle, en cada ping de presencia (cada 60s + foco de ventana +
    // cada navegacion, por cada usuario activo) es un UPDATE redundante en
    // el camino mas caliente del sistema: no aporta nada que el guard no
    // vaya a hacer ya, y el timestamp preciso de cada evento sigue
    // disponible en user_activity.createdAt para quien lo necesite.

    const deduplicationWindow = new Date(
      now.getTime() - (kind === 'presence' ? 15 * 60_000 : 30_000),
    );
    const duplicate = await this.userActivityRepository.findOne({
      where: {
        userId: usuario.id,
        kind,
        path: route.path,
        createdAt: MoreThanOrEqual(deduplicationWindow),
      },
      order: { createdAt: 'DESC' },
    });

    if (!duplicate) {
      await this.userActivityRepository.save(
        this.userActivityRepository.create({
          userId: usuario.id,
          kind,
          path: route.path,
          label: route.label,
        }),
      );
    }

    return { ok: true, recordedAt: now.toISOString() };
  }

  private buenosAiresDateKey(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const value = (type: string) =>
      parts.find((part) => part.type === type)?.value || '';
    return `${value('year')}-${value('month')}-${value('day')}`;
  }

  async obtenerEstadisticasActividad() {
    const now = new Date();
    const todayKey = this.buenosAiresDateKey(now);
    const todayStart = new Date(`${todayKey}T00:00:00-03:00`);
    const activeSince = new Date(now.getTime() - 5 * 60_000);
    const trendStart = new Date(todayStart.getTime() - 13 * 86_400_000);
    const sectionStart = new Date(todayStart.getTime() - 29 * 86_400_000);

    const [
      summaryRows,
      activosAhora,
      usuariosConectados,
      roleRows,
      trendRows,
      sectionRows,
      hourlyRows,
      recentActivity,
    ] = await Promise.all([
      this.userActivityRepository
        .createQueryBuilder('activity')
        .select('COUNT(*)', 'events')
        .addSelect('COUNT(DISTINCT activity.userId)', 'users')
        .where('activity.createdAt >= :todayStart', { todayStart })
        .getRawOne<{ events: string; users: string }>(),
      this.usuarioRepository.count({
        where: { activo: true, ultimoAccesoAt: MoreThanOrEqual(activeSince) },
      }),
      this.usuarioRepository.find({
        select: ['id', 'nombre', 'apellido', 'email', 'rol', 'ultimoAccesoAt'],
        where: { activo: true, ultimoAccesoAt: MoreThanOrEqual(activeSince) },
        order: { ultimoAccesoAt: 'DESC' },
        take: 50,
      }),
      this.usuarioRepository
        .createQueryBuilder('user')
        .select('user.rol', 'role')
        .addSelect('COUNT(*)', 'count')
        .where('user.activo = true')
        .groupBy('user.rol')
        .getRawMany<{ role: string; count: string }>(),
      this.dataSource.query(
        `SELECT TO_CHAR(("createdAt" AT TIME ZONE 'America/Argentina/Buenos_Aires'), 'YYYY-MM-DD') AS date,
                COUNT(*) FILTER (WHERE kind = 'page_view')::int AS views,
                COUNT(DISTINCT "userId")::int AS users
           FROM user_activity
          WHERE "createdAt" >= $1
          GROUP BY 1 ORDER BY 1`,
        [trendStart],
      ),
      this.dataSource.query(
        `SELECT label, path, COUNT(*)::int AS views,
                COUNT(DISTINCT "userId")::int AS users
           FROM user_activity
          WHERE kind = 'page_view' AND "createdAt" >= $1
          GROUP BY label, path ORDER BY views DESC LIMIT 10`,
        [sectionStart],
      ),
      this.dataSource.query(
        `SELECT EXTRACT(HOUR FROM ("createdAt" AT TIME ZONE 'America/Argentina/Buenos_Aires'))::int AS hour,
                COUNT(*)::int AS events,
                COUNT(DISTINCT "userId")::int AS users
           FROM user_activity
          WHERE "createdAt" >= $1
          GROUP BY 1 ORDER BY 1`,
        [todayStart],
      ),
      this.userActivityRepository.find({
        relations: ['user'],
        where: { kind: In(['page_view', 'action']) },
        order: { createdAt: 'DESC' },
        take: 30,
      }),
    ]);

    const trendByDate = new Map(trendRows.map((row: any) => [row.date, row]));
    const tendencia = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(trendStart.getTime() + index * 86_400_000);
      const key = this.buenosAiresDateKey(date);
      const row: any = trendByDate.get(key);
      return {
        date: key,
        users: Number(row?.users || 0),
        views: Number(row?.views || 0),
      };
    });

    return {
      generatedAt: now.toISOString(),
      activeWindowMinutes: 5,
      summary: {
        activeNow: activosAhora,
        usersToday: Number(summaryRows?.users || 0),
        eventsToday: Number(summaryRows?.events || 0),
        totalUsers: await this.usuarioRepository.count(),
      },
      usersOnline: usuariosConectados,
      roles: roleRows.map((row) => ({
        role: row.role,
        count: Number(row.count),
      })),
      trend: tendencia,
      sections: sectionRows.map((row: any) => ({
        label: row.label,
        path: row.path,
        views: Number(row.views),
        users: Number(row.users),
      })),
      hourly: Array.from({ length: 24 }, (_, hour) => {
        const row = hourlyRows.find((item: any) => Number(item.hour) === hour);
        return {
          hour,
          events: Number(row?.events || 0),
          users: Number(row?.users || 0),
        };
      }),
      recent: recentActivity.map((activity) => ({
        id: activity.id,
        kind: activity.kind,
        label: activity.label,
        path: activity.path,
        createdAt: activity.createdAt,
        user: activity.user
          ? {
              id: activity.user.id,
              name: `${activity.user.nombre} ${activity.user.apellido}`.trim(),
              email: activity.user.email,
              role: activity.user.rol,
            }
          : null,
      })),
    };
  }

  async obtenerEstadoTecnico() {
    const startedAt = Date.now();
    let dbOk = false;
    let dbLatencyMs: number | null = null;

    try {
      await this.dataSource.query('SELECT 1');
      dbOk = true;
      dbLatencyMs = Date.now() - startedAt;
    } catch {
      dbOk = false;
    }

    const data = {
      materias: 0,
      auditoriaGlobal: 0,
      auditoriaMaterias: 0,
    };

    if (dbOk) {
      const [materias, auditoriaGlobal, auditoriaMaterias] = await Promise.all([
        this.materiaRepository.count(),
        this.adminAuditRepository.count(),
        this.materiaLogRepository.count(),
      ]);
      data.materias = materias;
      data.auditoriaGlobal = auditoriaGlobal;
      data.auditoriaMaterias = auditoriaMaterias;
    }

    const hasValue = (value?: string) =>
      !!value && !value.startsWith('your-') && !value.startsWith('change-this');

    return {
      status: dbOk ? 'ok' : 'degraded',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        ok: dbOk,
        latencyMs: dbLatencyMs,
        type: this.dataSource.options.type,
      },
      gitea: {
        configured:
          hasValue(process.env.GITEA_BASE_URL) &&
          hasValue(process.env.GITEA_ADMIN_TOKEN),
        baseUrl: process.env.GITEA_BASE_URL || null,
      },
      auth: {
        adminEmailsConfigured: hasValue(process.env.AUTH_ADMIN_EMAILS),
        secretConfigured: hasValue(process.env.AUTH_SECRET),
      },
      data,
    };
  }

  private async loadMaintenanceStatus() {
    const setting = await this.getOrCreateMaintenanceSetting();
    return {
      enabled: setting.enabled,
      title: setting.title || 'Campus en mantenimiento',
      message:
        setting.message ||
        'Estamos realizando tareas de mantenimiento. El acceso se restablecera cuando finalicen los trabajos.',
      scheduledAt: setting.scheduledAt,
      estimatedUntil: setting.estimatedUntil,
      updatedAt: setting.updatedAt,
    };
  }

  async obtenerMaintenanceStatus() {
    const now = Date.now();
    if (this.maintenanceStatusCache?.expiresAt > now) {
      return this.maintenanceStatusCache.value;
    }

    const value = await this.loadMaintenanceStatus();
    const configuredTtl = Number(process.env.MAINTENANCE_CACHE_TTL_MS || 5000);
    const ttl = Number.isFinite(configuredTtl)
      ? Math.max(0, configuredTtl)
      : 5000;
    this.maintenanceStatusCache = { value, expiresAt: now + ttl };
    return value;
  }

  async actualizarMaintenanceStatus(
    actor: Usuario,
    input: {
      enabled: boolean;
      title?: string;
      message?: string;
      scheduledAt?: string | null;
      estimatedUntil?: string | null;
    },
    correlationId?: string,
  ) {
    const previous = await this.getOrCreateMaintenanceSetting();
    const previousValues = {
      enabled: previous.enabled,
      title: previous.title,
      message: previous.message,
      scheduledAt: previous.scheduledAt,
      estimatedUntil: previous.estimatedUntil,
    };

    previous.enabled = Boolean(input.enabled);
    previous.title = input.title?.trim() || 'Campus en mantenimiento';
    previous.message =
      input.message?.trim() ||
      'Estamos realizando tareas de mantenimiento. El acceso se restablecera cuando finalicen los trabajos.';
    previous.scheduledAt = input.scheduledAt
      ? new Date(input.scheduledAt)
      : null;
    previous.estimatedUntil = input.estimatedUntil
      ? new Date(input.estimatedUntil)
      : null;
    previous.updatedById = actor.id;

    const saved = await this.maintenanceRepository.save(previous);
    this.maintenanceStatusCache = null;

    await this.registrarAdminAudit({
      actor,
      action: AdminAuditAction.MAINTENANCE_UPDATED,
      title: saved.enabled
        ? 'Modo mantenimiento activado'
        : 'Modo mantenimiento desactivado',
      detail: `${this.formatUser(actor)} ${saved.enabled ? 'activo' : 'desactivo'} el modo mantenimiento del campus.`,
      previousValues,
      newValues: {
        enabled: saved.enabled,
        title: saved.title,
        message: saved.message,
        scheduledAt: saved.scheduledAt,
        estimatedUntil: saved.estimatedUntil,
      },
      correlationId,
    });

    return this.obtenerMaintenanceStatus();
  }

  async isMaintenanceEnabled(): Promise<boolean> {
    const setting = await this.getOrCreateMaintenanceSetting();
    return setting.enabled;
  }

  private async getOrCreateMaintenanceSetting(): Promise<MaintenanceSetting> {
    const existing = await this.maintenanceRepository.findOne({
      where: { key: 'global' },
    });
    if (existing) return existing;

    return this.maintenanceRepository.save(
      this.maintenanceRepository.create({
        key: 'global',
        enabled: false,
        title: 'Campus en mantenimiento',
        message:
          'Estamos realizando tareas de mantenimiento. El acceso se restablecera cuando finalicen los trabajos.',
      }),
    );
  }

  async listarDocenciasUsuario(usuarioId: number): Promise<ProfesorMateria[]> {
    await this.obtenerPorId(usuarioId);
    return this.profesorMateriaRepository.find({
      where: { profesorId: usuarioId },
      relations: ['materia', 'comisiones', 'comisiones.comision'],
      order: { updatedAt: 'DESC' },
    });
  }

  async registrarAdminAudit(input: {
    actor: Usuario;
    target?: Usuario;
    targetEmail?: string;
    action: AdminAuditAction;
    title: string;
    detail: string;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    correlationId?: string;
  }) {
    const log = this.adminAuditRepository.create({
      actorId: input.actor.id,
      actorEmail: input.actor.email,
      targetUserId: input.target?.id || null,
      targetEmail: input.target?.email || input.targetEmail || null,
      action: input.action,
      title: input.title,
      detail: input.detail,
      previousValues: input.previousValues || null,
      newValues: input.newValues || null,
      correlationId: input.correlationId || null,
    });
    await this.adminAuditRepository.save(log);
  }

  private formatUser(usuario: Usuario) {
    const fullName = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
    return fullName || usuario.email || `Usuario ${usuario.id}`;
  }
}
