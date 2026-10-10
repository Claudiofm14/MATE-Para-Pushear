type GiteaRequestOptions = {
  method?: string;
  token?: string;
  admin?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type CreateGiteaUserInput = {
  email: string;
  fullName: string;
  username: string;
  temporaryPassword: string;
};

export type CreateGiteaOrgInput = {
  username: string;
  fullName?: string;
  description?: string;
};

export type GenerateRepoFromTemplateInput = {
  templateOwner: string;
  templateRepo: string;
  owner: string;
  name: string;
  description?: string;
  private?: boolean;
};

export class GiteaApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
  ) {
    super(message);
  }
}

function getGiteaBaseUrl() {
  const baseUrl = process.env.GITEA_BASE_URL;
  if (!baseUrl) {
    throw new Error('GITEA_BASE_URL is required');
  }
  return baseUrl.replace(/\/$/, '');
}

export function getGiteaPublicBaseUrl() {
  return getGiteaBaseUrl();
}

function getAuthorizationToken(options: GiteaRequestOptions) {
  if (options.admin) {
    if (!process.env.GITEA_ADMIN_TOKEN) {
      throw new Error('GITEA_ADMIN_TOKEN is required for admin Gitea calls');
    }
    return process.env.GITEA_ADMIN_TOKEN;
  }

  return options.token;
}

export async function giteaRequest<T>(
  path: string,
  options: GiteaRequestOptions = {},
): Promise<T> {
  const token = getAuthorizationToken(options);
  const rawTimeout = process.env.GITEA_REQUEST_TIMEOUT_MS;
  const configuredTimeout = rawTimeout ? Number(rawTimeout) : Number.NaN;
  const timeoutMs = Number.isFinite(configuredTimeout)
    ? Math.max(1_000, configuredTimeout)
    : 15_000;
  const response = await fetch(`${getGiteaBaseUrl()}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `token ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)])
      : AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new GiteaApiError(
      response.status,
      response.statusText,
      detail || response.statusText,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function giteaAdminRequest<T>(
  path: string,
  options: Omit<GiteaRequestOptions, 'admin'> = {},
) {
  return giteaRequest<T>(path, { ...options, admin: true });
}

export async function getGiteaUserByUsername(username: string) {
  try {
    return await giteaAdminRequest<any>(
      `/api/v1/users/${encodeURIComponent(username)}`,
    );
  } catch (error) {
    if (error instanceof GiteaApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function giteaUserMutation<T>(
  username: string,
  pathForUsername: (username: string) => string,
  options: Omit<GiteaRequestOptions, 'admin'>,
): Promise<T> {
  try {
    return await giteaAdminRequest<T>(pathForUsername(username), options);
  } catch (error) {
    if (
      !(error instanceof GiteaApiError) ||
      ![404, 422].includes(error.status)
    ) {
      throw error;
    }

    // Las consultas GET siguen la redireccion de un usuario renombrado,
    // pero los endpoints de colaboradores pueden rechazar el nombre anterior.
    const user = await getGiteaUserByUsername(username);
    const currentUsername = String(user?.login || user?.username || '').trim();
    if (!currentUsername || currentUsername === username) throw error;

    return await giteaAdminRequest<T>(
      pathForUsername(currentUsername),
      options,
    );
  }
}

export async function createGiteaUser(input: CreateGiteaUserInput) {
  const mustChangePassword =
    process.env.GITEA_IMPORT_MUST_CHANGE_PASSWORD !== 'false';

  return await giteaAdminRequest<any>('/api/v1/admin/users', {
    method: 'POST',
    body: {
      email: input.email,
      full_name: input.fullName,
      login_name: input.username,
      must_change_password: mustChangePassword,
      password: input.temporaryPassword,
      restricted: false,
      send_notify: false,
      username: input.username,
      visibility: 'limited',
    },
  });
}

export async function deleteGiteaUser(username: string) {
  return await giteaAdminRequest<void>(
    `/api/v1/admin/users/${encodeURIComponent(username)}?purge=true`,
    { method: 'DELETE' },
  );
}

export async function listGiteaUsers(options: { signal?: AbortSignal } = {}) {
  const users: any[] = [];
  // Gitea limita este endpoint a 50 resultados por pagina aunque se solicite
  // un limite mayor. Debemos recorrer todas las paginas para no truncar la lista.
  const limit = 50;

  for (let page = 1; page <= 200; page++) {
    const pageUsers = await giteaAdminRequest<any[]>(
      `/api/v1/admin/users?page=${page}&limit=${limit}`,
      { signal: options.signal },
    );

    users.push(...pageUsers);
    if (pageUsers.length < limit) break;
  }

  return users;
}

export async function updateGiteaUserPassword(
  username: string,
  password: string,
  mustChangePassword: boolean,
) {
  const currentUser = await getGiteaUserByUsername(username);
  if (!currentUser) return null;

  return await giteaAdminRequest<any>(
    `/api/v1/admin/users/${encodeURIComponent(username)}`,
    {
      method: 'PATCH',
      body: {
        login_name: currentUser.login_name || currentUser.login || username,
        source_id: Number(currentUser.source_id || 0),
        password,
        must_change_password: mustChangePassword,
      },
    },
  );
}

export async function listOrganizations() {
  return await giteaAdminRequest<any[]>('/api/v1/admin/orgs?limit=1000');
}

export async function getOrganization(orgName: string) {
  try {
    return await giteaAdminRequest<any>(
      `/api/v1/orgs/${encodeURIComponent(orgName)}`,
    );
  } catch (error) {
    if (error instanceof GiteaApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createOrganization(input: CreateGiteaOrgInput) {
  return await giteaAdminRequest<any>('/api/v1/orgs', {
    method: 'POST',
    body: {
      username: normalizeGiteaSlug(input.username),
      full_name: input.fullName || input.username,
      description: input.description || '',
      visibility: 'private',
    },
  });
}

export async function listOrgTeams(orgName: string) {
  return await giteaAdminRequest<any[]>(
    `/api/v1/orgs/${encodeURIComponent(orgName)}/teams`,
  );
}

export async function createOrgTeam(
  orgName: string,
  input: {
    name: string;
    description?: string;
    permission?: 'read' | 'write' | 'admin';
    includesAllRepositories?: boolean;
  },
) {
  return await giteaAdminRequest<any>(
    `/api/v1/orgs/${encodeURIComponent(orgName)}/teams`,
    {
      method: 'POST',
      body: {
        name: input.name,
        description: input.description || '',
        permission: input.permission || 'read',
        includes_all_repositories: input.includesAllRepositories ?? false,
        can_create_org_repo: false,
        units: ['repo.code'],
      },
    },
  );
}

export async function isOrgMember(orgName: string, username: string) {
  try {
    await giteaAdminRequest<any>(
      `/api/v1/orgs/${encodeURIComponent(orgName)}/members/${encodeURIComponent(username)}`,
    );
    return true;
  } catch (error) {
    if (error instanceof GiteaApiError && error.status === 404) return false;
    throw error;
  }
}

export async function addTeamMember(teamId: number, username: string) {
  return await giteaUserMutation<void>(
    username,
    (currentUsername) =>
      `/api/v1/teams/${teamId}/members/${encodeURIComponent(currentUsername)}`,
    { method: 'PUT' },
  );
}

export async function ensureOrgMember(orgName: string, username: string) {
  if (await isOrgMember(orgName, username)) return;

  const teams = await listOrgTeams(orgName);
  let team = teams.find((item) =>
    ['alumnos', 'students', 'estudiantes'].includes(
      String(item.name || '').toLowerCase(),
    ),
  );

  if (!team) {
    team = await createOrgTeam(orgName, {
      name: 'Alumnos',
      description: 'Alumnos incorporados automaticamente desde META UNAHUR',
      permission: 'read',
      includesAllRepositories: false,
    });
  }

  await addTeamMember(Number(team.id), username);
}

export async function listOrgRepos(orgName: string) {
  const repos: any[] = [];
  // Gitea aplica su limite maximo de pagina aunque se solicite un valor mayor.
  // Recorremos todas las paginas para incluir repositorios creados recientemente.
  const limit = 50;

  for (let page = 1; page <= 200; page++) {
    const pageRepos = await giteaAdminRequest<any[]>(
      `/api/v1/orgs/${encodeURIComponent(orgName)}/repos?page=${page}&limit=${limit}`,
    );

    repos.push(...pageRepos);
    if (pageRepos.length < limit) break;
  }

  return repos;
}

/**
 * Gitea expone el flag de plantilla con distintos nombres segun la version
 * de la API. Devuelve undefined cuando ninguno viene en la respuesta, que es
 * la senal de que hace falta consultar el detalle del repositorio.
 */
function readTemplateFlag(repo: any): boolean | undefined {
  for (const key of [
    'template',
    'is_template',
    'template_repo',
    'isTemplate',
  ]) {
    if (typeof repo?.[key] === 'boolean') return repo[key];
  }
  return undefined;
}

export async function listOrgTemplateRepos(
  orgName: string,
  knownRepos?: any[],
) {
  const suffixes = (process.env.GITEA_TEMPLATE_REPO_SUFFIX || '-template')
    .split(',')
    .map((suffix) => suffix.trim().toLowerCase())
    .filter(Boolean);
  const fallbackSuffixes = Array.from(new Set([...suffixes, '-plantilla']));
  const matchesSuffix = (repo: any) => {
    const name = String(repo?.name || '').toLowerCase();
    return fallbackSuffixes.some((suffix) => name.endsWith(suffix));
  };

  const repos = knownRepos ?? (await listOrgRepos(orgName));

  // El listado de la organizacion ya trae el flag de plantilla, asi que no
  // hace falta pedir el detalle de cada repositorio: los repos de los alumnos
  // viven en la misma organizacion, y una cursada con 60 inscriptos disparaba
  // 60+ llamadas a Gitea cada vez que un docente abria el modal de ejercicio.
  // Solo se consulta el detalle de los repos donde el flag no viene y el
  // nombre tampoco alcanza para decidir.
  const resolved = await Promise.all(
    repos.map(async (repo) => {
      if (readTemplateFlag(repo) !== undefined) return repo;
      if (matchesSuffix(repo)) return repo;
      try {
        return (await getRepo(orgName, repo.name)) || repo;
      } catch {
        return repo;
      }
    }),
  );

  return resolved.filter(
    (repo) => readTemplateFlag(repo) === true || matchesSuffix(repo),
  );
}

export async function getRepo(owner: string, repo: string) {
  try {
    return await giteaAdminRequest<any>(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    );
  } catch (error) {
    if (error instanceof GiteaApiError && error.status === 404) return null;
    throw error;
  }
}

export async function listRepoCommits(owner: string, repo: string, limit = 1) {
  try {
    return await giteaAdminRequest<any[]>(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?limit=${limit}`,
    );
  } catch (error) {
    if (error instanceof GiteaApiError && error.status === 404) return [];
    throw error;
  }
}

export async function generateRepoFromTemplate(
  input: GenerateRepoFromTemplateInput,
) {
  return await giteaAdminRequest<any>(
    `/api/v1/repos/${encodeURIComponent(input.templateOwner)}/${encodeURIComponent(input.templateRepo)}/generate`,
    {
      method: 'POST',
      body: {
        owner: input.owner,
        name: input.name,
        description: input.description || '',
        private:
          input.private ??
          (process.env.GITEA_DEFAULT_REPO_VISIBILITY || 'private') ===
            'private',
        git_content: true,
        topics: true,
        git_hooks: false,
        webhooks: false,
        avatar: false,
        labels: false,
      },
    },
  );
}

export async function addRepoCollaborator(
  owner: string,
  repo: string,
  username: string,
  permission: 'read' | 'write' | 'admin' = 'write',
) {
  return await giteaUserMutation<void>(
    username,
    (currentUsername) =>
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators/${encodeURIComponent(currentUsername)}`,
    {
      method: 'PUT',
      body: { permission },
    },
  );
}

export async function removeRepoCollaborator(
  owner: string,
  repo: string,
  username: string,
) {
  try {
    return await giteaUserMutation<void>(
      username,
      (currentUsername) =>
        `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators/${encodeURIComponent(currentUsername)}`,
      { method: 'DELETE' },
    );
  } catch (error) {
    // La ausencia del colaborador ya representa el estado final esperado.
    if (error instanceof GiteaApiError && error.status === 404) return;
    throw error;
  }
}

export function normalizeGiteaSlug(value: string, fallback = 'repo') {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

  return slug || fallback;
}

export function mapGiteaError(error: unknown) {
  if (!(error instanceof GiteaApiError)) {
    return {
      status: 500,
      message: 'Error inesperado al comunicarse con Gitea',
    };
  }

  switch (error.status) {
    case 401:
    case 403:
      return {
        status: error.status,
        message: 'Token administrativo de Gitea invalido o sin permisos',
      };
    case 409:
      return { status: error.status, message: 'El recurso ya existe en Gitea' };
    case 404:
      return {
        status: error.status,
        message:
          'No se encontro en Gitea la organizacion, el usuario o el repositorio configurado',
      };
    case 422:
      return {
        status: error.status,
        message: 'Gitea rechazo los datos del usuario',
      };
    case 429:
    case 502:
    case 503:
    case 504:
      return {
        status: error.status,
        message: 'Gitea no pudo procesar temporalmente la solicitud',
      };
    default:
      return {
        status: error.status,
        message: 'Error de Gitea',
      };
  }
}
