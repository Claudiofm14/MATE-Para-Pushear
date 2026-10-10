import { createServer, Server } from 'node:http';
import {
  addRepoCollaborator,
  addTeamMember,
  ensureOrgMember,
  GiteaApiError,
  listGiteaUsers,
  removeRepoCollaborator,
} from './gitea';

describe('Gitea renamed users', () => {
  const previousUsername = 'ernestofabrizio2006';
  const currentUsername = 'ernestoffabrizio';
  const collaboratorsPath =
    '/api/v1/repos/catedra/ejercicio-48-grupo-24/collaborators';
  const originalBaseUrl = process.env.GITEA_BASE_URL;
  const originalToken = process.env.GITEA_ADMIN_TOKEN;
  let server: Server;
  let requests: string[];
  let grantedPermission: string | undefined;
  let mutationStatus: number | undefined;
  let previousDeleteStatus: number;
  let secondPageRequested: (() => void) | undefined;

  beforeEach(async () => {
    requests = [];
    grantedPermission = undefined;
    mutationStatus = undefined;
    previousDeleteStatus = 422;
    secondPageRequested = undefined;
    server = createServer(async (request, response) => {
      const path = request.url;
      requests.push(`${request.method} ${path}`);

      const usersPath = '/api/v1/users/';
      const membersPath = '/api/v1/orgs/catedra/members/';
      if (request.method === 'GET') {
        if (path === '/api/v1/admin/users?page=1&limit=50') {
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(
            JSON.stringify(
              Array.from({ length: 50 }, (_, id) => ({
                id,
                login: `user-${id}`,
              })),
            ),
          );
          return;
        }
        if (path === '/api/v1/admin/users?page=2&limit=50') {
          secondPageRequested?.();
          return; // Simula una segunda pagina que nunca termina de responder.
        }
        if (
          [
            usersPath + previousUsername,
            membersPath + previousUsername,
          ].includes(path)
        ) {
          response.writeHead(307, {
            Location: path.replace(previousUsername, currentUsername),
          });
        } else if (path === usersPath + currentUsername) {
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ id: 101, login: currentUsername }));
          return;
        } else if (path === membersPath + currentUsername) {
          response.writeHead(204);
        } else {
          response.writeHead(404);
        }
        response.end();
        return;
      }

      if (mutationStatus) {
        response.writeHead(mutationStatus);
      } else if (path === `${collaboratorsPath}/${currentUsername}`) {
        if (request.method === 'PUT') {
          let body = '';
          for await (const chunk of request) body += chunk.toString();
          grantedPermission = JSON.parse(body).permission;
        } else {
          grantedPermission = undefined;
        }
        response.writeHead(204);
      } else if (path === `/api/v1/teams/5/members/${currentUsername}`) {
        response.writeHead(204);
      } else if (path?.startsWith(collaboratorsPath)) {
        response.writeHead(
          request.method === 'DELETE' ? previousDeleteStatus : 422,
        );
      } else {
        response.writeHead(404);
      }
      response.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address() as { port: number };
    process.env.GITEA_BASE_URL = `http://127.0.0.1:${address.port}`;
    process.env.GITEA_ADMIN_TOKEN = 'test-admin-token';
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
    if (originalBaseUrl === undefined) delete process.env.GITEA_BASE_URL;
    else process.env.GITEA_BASE_URL = originalBaseUrl;
    if (originalToken === undefined) delete process.env.GITEA_ADMIN_TOKEN;
    else process.env.GITEA_ADMIN_TOKEN = originalToken;
  });

  it('grants write access after membership redirects but the old collaborator name returns 422', async () => {
    await ensureOrgMember('catedra', previousUsername);
    await addRepoCollaborator(
      'catedra',
      'ejercicio-48-grupo-24',
      previousUsername,
    );

    expect(grantedPermission).toBe('write');
    expect(requests).toEqual([
      `GET /api/v1/orgs/catedra/members/${previousUsername}`,
      `GET /api/v1/orgs/catedra/members/${currentUsername}`,
      `PUT ${collaboratorsPath}/${previousUsername}`,
      `GET /api/v1/users/${previousUsername}`,
      `GET /api/v1/users/${currentUsername}`,
      `PUT ${collaboratorsPath}/${currentUsername}`,
    ]);
  });

  it('does not look up usernames when the mutation already succeeds', async () => {
    await addRepoCollaborator(
      'catedra',
      'ejercicio-48-grupo-24',
      currentUsername,
      'read',
    );

    expect(grantedPermission).toBe('read');
    expect(requests).toEqual([`PUT ${collaboratorsPath}/${currentUsername}`]);
  });

  it.each([404, 422])(
    'revokes the renamed account access when the old name returns %s',
    async (status) => {
      grantedPermission = 'write';
      previousDeleteStatus = status;

      await removeRepoCollaborator(
        'catedra',
        'ejercicio-48-grupo-24',
        previousUsername,
      );

      expect(grantedPermission).toBeUndefined();
      expect(requests[requests.length - 1]).toBe(
        `DELETE ${collaboratorsPath}/${currentUsername}`,
      );
    },
  );

  it('adds a renamed user to a team after resolving its old name', async () => {
    await addTeamMember(5, previousUsername);

    expect(requests[requests.length - 1]).toBe(
      `PUT /api/v1/teams/5/members/${currentUsername}`,
    );
  });

  it('preserves permission errors without retrying', async () => {
    mutationStatus = 403;

    await expect(
      addRepoCollaborator('catedra', 'ejercicio-48-grupo-24', previousUsername),
    ).rejects.toMatchObject({ status: 403 });
    expect(requests).toHaveLength(1);
  });

  it('preserves the original error if the user does not exist', async () => {
    await expect(
      addRepoCollaborator('catedra', 'ejercicio-48-grupo-24', 'missing'),
    ).rejects.toBeInstanceOf(GiteaApiError);
    expect(requests).toEqual([
      `PUT ${collaboratorsPath}/missing`,
      'GET /api/v1/users/missing',
    ]);
  });

  it('does not retry validation errors when the username has not changed', async () => {
    mutationStatus = 422;

    await expect(
      addRepoCollaborator('catedra', 'ejercicio-48-grupo-24', currentUsername),
    ).rejects.toMatchObject({ status: 422 });
    expect(requests).toHaveLength(2);
  });

  it('keeps removing an already absent collaborator idempotent', async () => {
    previousDeleteStatus = 404;

    await expect(
      removeRepoCollaborator('catedra', 'ejercicio-48-grupo-24', 'missing'),
    ).resolves.toBeUndefined();
  });

  it('cancels a pending page and does not return a partial directory when the caller aborts', async () => {
    const controller = new AbortController();
    const waitingForSecondPage = new Promise<void>((resolve) => {
      secondPageRequested = resolve;
    });
    const directory = listGiteaUsers({ signal: controller.signal });
    const rejected = expect(directory).rejects.toMatchObject({
      name: 'TimeoutError',
    });
    await waitingForSecondPage;
    controller.abort(
      new DOMException('Directory deadline exceeded', 'TimeoutError'),
    );
    await rejected;
    expect(requests).toEqual([
      'GET /api/v1/admin/users?page=1&limit=50',
      'GET /api/v1/admin/users?page=2&limit=50',
    ]);
  });
});
