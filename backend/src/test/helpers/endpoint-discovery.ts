import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { dirname, join, relative } from 'path';

export type EndpointDefinition = {
  controller: string;
  file: string;
  method: string;
  path: string;
  handler: string;
  roles: string[];
  isPublic: boolean;
  hasBody: boolean;
  hasIdParam: boolean;
};

const httpDecoratorToMethod: Record<string, string> = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
};

function listControllerFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return listControllerFiles(fullPath);
    return entry.name.endsWith('.controller.ts') ? [fullPath] : [];
  });
}

function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

function readControllerBase(source: string): string {
  const match = source.match(/@Controller\((?:'|")([^'"]*)(?:'|")\)/);
  return match?.[1] || '';
}

function readRoles(block: string): string[] {
  const match = block.match(/@Roles\(([^)]*)\)/s);
  if (!match) return [];

  return [...match[1].matchAll(/USER_ROLES\.([A-Z_]+)/g)].map(
    (role) => role[1],
  );
}

function readClassDecorators(source: string): string {
  const controllerIndex = source.indexOf('@Controller');
  if (controllerIndex < 0) return '';
  const exportIndex = source.indexOf('export class', controllerIndex);
  if (exportIndex < 0) return '';
  return source.slice(0, exportIndex);
}

export function discoverEndpoints(rootDir = join(__dirname, '..', '..')) {
  const files = [
    ...listControllerFiles(join(rootDir, 'modules')),
    join(rootDir, 'app.controller.ts'),
  ].filter(existsSync);

  const endpoints: EndpointDefinition[] = [];

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const controller = readControllerBase(source);
    const classDecorators = readClassDecorators(source);
    const classRoles = readRoles(classDecorators);
    const classIsPublic = classDecorators.includes('@Public()');
    const methodRegex =
      /((?:\s*@(?:Api\w+|UseGuards|Roles|Public|Get|Post|Put|Patch|Delete)[^\n]*\n)+)\s*(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/g;

    for (const match of source.matchAll(methodRegex)) {
      const decorators = match[1];
      const handler = match[2];
      const http = decorators.match(
        /@(Get|Post|Put|Patch|Delete)\((?:'([^']*)'|"([^"]*)")?\)/,
      );
      if (!http) continue;

      const method = httpDecoratorToMethod[http[1]];
      const route = http[2] ?? http[3] ?? '';
      const path = normalizePath(`/${controller}/${route}`);

      endpoints.push({
        controller,
        file: relative(rootDir, file),
        method,
        path,
        handler,
        roles: [...new Set([...classRoles, ...readRoles(decorators)])],
        isPublic: classIsPublic || decorators.includes('@Public()'),
        hasBody: decorators.includes('@Body'),
        hasIdParam: /:\w*id\b/i.test(path),
      });
    }
  }

  return endpoints.sort((a, b) =>
    `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`),
  );
}

export function writeEndpointReport(
  endpoints: EndpointDefinition[],
  reportPath = join(
    process.cwd(),
    '..',
    'test-reports',
    'backend-endpoints.json',
  ),
) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), endpoints },
      null,
      2,
    ),
  );
}
