import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities/index.entity';
import { getDatabaseConnectionOptions } from './config/database.config';

export default new DataSource({
  // Las migraciones pueden tardar más que una consulta HTTP normal y no deben
  // heredar statement_timeout/lock_timeout del pool de la aplicación.
  ...getDatabaseConnectionOptions({ migrations: true }),
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
