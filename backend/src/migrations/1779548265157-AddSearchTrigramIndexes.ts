import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * search.service.ts busca con `ILIKE '%termino%'` sobre estas columnas.
 * Un patron con comodin al inicio nunca puede usar un indice B-tree normal;
 * pg_trgm + GIN es la forma estandar de indexar ese patron en Postgres.
 *
 * Requiere que el usuario de la base pueda crear extensiones (el usuario que
 * inicializa el contenedor de Postgres lo tiene por defecto).
 */
export class AddSearchTrigramIndexes1779548265157 implements MigrationInterface {
  name = 'AddSearchTrigramIndexes1779548265157';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_materia_nombre_trgm" ON "materia" USING gin ("nombre" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_material_academico_titulo_trgm" ON "material_academico" USING gin ("titulo" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_semana_titulo_trgm" ON "semana" USING gin ("titulo" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ejercicio_titulo_trgm" ON "ejercicio" USING gin ("titulo" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_video_titulo_trgm" ON "video" USING gin ("titulo" gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_video_titulo_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ejercicio_titulo_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_semana_titulo_trgm"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_material_academico_titulo_trgm"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_materia_nombre_trgm"`);
    // No se dropea la extension pg_trgm por si otro objeto de la base la usa.
  }
}
