import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import {
  createOrganization,
  getGiteaPublicBaseUrl,
  getOrganization,
  listOrgTemplateRepos,
  listOrgRepos,
  listOrganizations,
  mapGiteaError,
  normalizeGiteaSlug,
} from '../../lib/gitea';
import { CursadaService } from '../cursada/cursada.service';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';

type TemplatesCacheEntry = {
  value: { templates: any[]; hasRepos: boolean };
  expiresAt: number;
};

@Controller('api/gitea')
export class GiteaIntegrationController {
  // El listado de plantillas de una organizacion cambia muy poco y el docente
  // abre y cierra el modal de ejercicio varias veces seguidas. Un TTL corto
  // evita repetir el recorrido de la organizacion en Gitea sin que las
  // plantillas nuevas tarden en aparecer (ademas el front puede pedir
  // refresh=true para saltear el cache).
  private readonly templatesCache = new Map<string, TemplatesCacheEntry>();

  constructor(
    private readonly cursadaService: CursadaService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
  ) {}

  private getTemplatesCacheTtlMs() {
    const configured = Number(process.env.GITEA_TEMPLATES_CACHE_TTL_MS);
    return Number.isFinite(configured) && configured >= 0 ? configured : 60_000;
  }

  private async loadOrgTemplates(orgName: string, refresh: boolean) {
    const now = Date.now();
    const ttl = this.getTemplatesCacheTtlMs();

    if (!refresh) {
      const cached = this.templatesCache.get(orgName);
      if (cached && cached.expiresAt > now) return cached.value;
    }

    const repos = await listOrgRepos(orgName);
    const value = {
      templates: await listOrgTemplateRepos(orgName, repos),
      hasRepos: repos.length > 0,
    };

    if (ttl > 0) {
      this.templatesCache.set(orgName, { value, expiresAt: now + ttl });
    }

    return value;
  }

  private async assertCanManageMateria(req: any, materiaId: number) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    if (usuario.rol === USER_ROLES.ADMIN) return;

    const tieneAcceso =
      await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      );

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }
  }

  @Get('orgs')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async listOrgs() {
    try {
      return await listOrganizations();
    } catch (error) {
      const mapped = mapGiteaError(error);
      throw new BadRequestException(mapped.message);
    }
  }

  @Post('orgs')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async createOrg(
    @Body()
    body: {
      name: string;
      fullName?: string;
      description?: string;
    },
  ) {
    const username = normalizeGiteaSlug(body.name || body.fullName || '');
    if (!username)
      throw new BadRequestException('Nombre de organizacion invalido');

    try {
      const existing = await getOrganization(username);
      if (existing) return existing;

      return await createOrganization({
        username,
        fullName: body.fullName,
        description: body.description,
      });
    } catch (error) {
      const mapped = mapGiteaError(error);
      throw new BadRequestException(mapped.message);
    }
  }

  @Get('cursadas/:cursadaId/templates')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async listTemplates(
    @Request() req,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
    @Query('refresh') refresh?: string,
  ) {
    const cursada = await this.cursadaService.findOne(cursadaId);
    await this.assertCanManageMateria(req, cursada.materia.id);
    if (!cursada.giteaIntegrationEnabled || !cursada.giteaOrgName) {
      return {
        organization: null,
        templates: [],
        message: 'La cursada no tiene organizacion de Gitea vinculada',
      };
    }

    try {
      const { templates, hasRepos } = await this.loadOrgTemplates(
        cursada.giteaOrgName,
        refresh === 'true',
      );
      return {
        organization: {
          name: cursada.giteaOrgName,
          url:
            cursada.giteaOrgUrl ||
            `${getGiteaPublicBaseUrl()}/${cursada.giteaOrgName}`,
        },
        templates,
        message:
          hasRepos && templates.length === 0
            ? 'La organizacion tiene repositorios, pero ninguno esta marcado como plantilla ni termina con -template o -plantilla'
            : undefined,
      };
    } catch (error) {
      const mapped = mapGiteaError(error);
      throw new BadRequestException(mapped.message);
    }
  }
}
