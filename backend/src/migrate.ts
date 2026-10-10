import dataSource from './data-source';

const MIGRATION_LOCK_ID = 1_904_202_026;

async function runMigrationsWithLock() {
  await dataSource.initialize();
  const lockConnection = dataSource.createQueryRunner();
  let lockAcquired = false;

  try {
    await lockConnection.connect();
    await lockConnection.query('SELECT pg_advisory_lock($1)', [
      MIGRATION_LOCK_ID,
    ]);
    lockAcquired = true;
    await dataSource.runMigrations({ transaction: 'all' });
  } finally {
    if (lockAcquired) {
      try {
        await lockConnection.query('SELECT pg_advisory_unlock($1)', [
          MIGRATION_LOCK_ID,
        ]);
      } catch (error) {
        console.warn('No se pudo liberar explicitamente el lock:', error);
      } finally {
        lockAcquired = false;
      }
    }
    if (!lockConnection.isReleased) await lockConnection.release();
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

runMigrationsWithLock().catch((error) => {
  console.error('No se pudieron ejecutar las migraciones:', error);
  process.exitCode = 1;
});
