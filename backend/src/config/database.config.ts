import { APP_TIME_ZONE } from './timezone.config';

type PostgresConnectionOptions = {
  type: 'postgres';
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean | object;
  extra?: {
    options: string;
    max: number;
    connectionTimeoutMillis: number;
    idleTimeoutMillis: number;
    keepAlive: boolean;
  };
};

const positiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const databaseSslOption = (host: string) => {
  const configured = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (configured === 'true') return { rejectUnauthorized: false };
  if (configured === 'false') return false;

  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(
    host.toLowerCase(),
  );
  return isLocalHost && process.env.NODE_ENV !== 'production'
    ? false
    : { rejectUnauthorized: false };
};

const statementTimeoutMs = positiveNumber(
  process.env.DATABASE_STATEMENT_TIMEOUT_MS,
  30_000,
);
const lockTimeoutMs = positiveNumber(
  process.env.DATABASE_LOCK_TIMEOUT_MS,
  5_000,
);

const timezoneConnectionOptions = {
  options: `-c timezone=${APP_TIME_ZONE} -c statement_timeout=${statementTimeoutMs} -c lock_timeout=${lockTimeoutMs}`,
  max: positiveNumber(process.env.DATABASE_POOL_MAX, 10),
  connectionTimeoutMillis: positiveNumber(
    process.env.DATABASE_CONNECTION_TIMEOUT_MS,
    5_000,
  ),
  idleTimeoutMillis: positiveNumber(
    process.env.DATABASE_IDLE_TIMEOUT_MS,
    30_000,
  ),
  keepAlive: true,
};

const requireProductionDatabaseConfig = () => {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.DATABASE_URL || process.env.DATABASE_INTERNAL_URL) return;

  const missing = [
    'DATABASE_HOST',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
  ].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required production database variables: ${missing.join(', ')}`,
    );
  }
};

export const getDatabaseConnectionOptions = (
  options: { migrations?: boolean } = {},
): PostgresConnectionOptions => {
  requireProductionDatabaseConfig();

  const databaseUrl =
    process.env.DATABASE_URL || process.env.DATABASE_INTERNAL_URL;

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      extra: options.migrations
        ? {
            ...timezoneConnectionOptions,
            options: `-c timezone=${APP_TIME_ZONE}`,
          }
        : timezoneConnectionOptions,
    };
  }

  const databaseHost = process.env.DATABASE_HOST || 'localhost';

  return {
    type: 'postgres',
    host: databaseHost,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'admin',
    password: process.env.DATABASE_PASSWORD || 'admin123',
    ssl: databaseSslOption(databaseHost),
    database: process.env.DATABASE_NAME || 'proyecto_materias',
    extra: options.migrations
      ? {
          ...timezoneConnectionOptions,
          options: `-c timezone=${APP_TIME_ZONE}`,
        }
      : timezoneConnectionOptions,
  };
};
