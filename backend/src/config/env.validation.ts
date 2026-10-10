const production = process.env.NODE_ENV === 'production';

const isConfigured = (value?: string) =>
  !!value &&
  value.trim().length > 0 &&
  !value.startsWith('your-') &&
  !value.startsWith('change-this') &&
  !value.includes('change-me');

export function validateRuntimeEnvironment() {
  const missing: string[] = [];

  for (const key of [
    'GITEA_BASE_URL',
    'GITEA_CLIENT_ID',
    'GITEA_CLIENT_SECRET',
    'GITEA_CALLBACK_URL',
  ]) {
    if (!isConfigured(process.env[key])) missing.push(key);
  }

  if (process.env.GITEA_WEBHOOK_ENABLED === 'true') {
    for (const key of ['GITEA_WEBHOOK_SECRET', 'GITEA_WEBHOOK_PUBLIC_URL']) {
      if (!isConfigured(process.env[key])) missing.push(key);
    }
  }

  if (!production) {
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }
    return;
  }

  if (!isConfigured(process.env.AUTH_SECRET)) missing.push('AUTH_SECRET');

  if (
    !isConfigured(process.env.DATABASE_URL) &&
    !isConfigured(process.env.DATABASE_INTERNAL_URL)
  ) {
    for (const key of [
      'DATABASE_HOST',
      'DATABASE_USER',
      'DATABASE_PASSWORD',
      'DATABASE_NAME',
    ]) {
      if (!isConfigured(process.env[key])) missing.push(key);
    }
  }

  if (!isConfigured(process.env.FRONTEND_ORIGIN)) {
    missing.push('FRONTEND_ORIGIN');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}`,
    );
  }
}

export function requireProductionSecret(name: string, value?: string) {
  if (production && !isConfigured(value)) {
    throw new Error(`${name} is required in production`);
  }
}
