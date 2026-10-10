import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Archivado de materias: una materia archivada conserva intacto todo su
 * contenido (cursadas, semanas, videos, ejercicios, entregas, materiales)
 * pero queda fuera de circulacion y solo la ve un admin, que puede
 * desarchivarla para volver a usarla.
 *
 * Es un estado distinto del soft delete (`deletedAt`): archivar no elimina.
 */
export class AddMateriaArchivado1779548265158 implements MigrationInterface {
  name = 'AddMateriaArchivado1779548265158';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "materia" ADD COLUMN IF NOT EXISTS "archivada" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia" ADD COLUMN IF NOT EXISTS "archivadaEn" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia" ADD COLUMN IF NOT EXISTS "archivadaPor" character varying(255)`,
    );

    // El listado publico filtra por `archivada = false` en cada request.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_materia_archivada" ON "materia" ("archivada")`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."materia_log_action_enum" ADD VALUE IF NOT EXISTS 'archived'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."materia_log_action_enum" ADD VALUE IF NOT EXISTS 'unarchived'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."admin_audit_log_action_enum" ADD VALUE IF NOT EXISTS 'materia_archived'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."admin_audit_log_action_enum" ADD VALUE IF NOT EXISTS 'materia_unarchived'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres no permite quitar valores de un enum; solo se revierten columnas.
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_materia_archivada"`);
    await queryRunner.query(
      `ALTER TABLE "materia" DROP COLUMN IF EXISTS "archivadaPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia" DROP COLUMN IF EXISTS "archivadaEn"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia" DROP COLUMN IF EXISTS "archivada"`,
    );
  }
}
