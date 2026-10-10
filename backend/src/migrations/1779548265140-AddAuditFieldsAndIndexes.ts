import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditFieldsAndIndexes1779548265140 implements MigrationInterface {
  name = 'AddAuditFieldsAndIndexes1779548265140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."materia_log_action_enum" ADD VALUE IF NOT EXISTS 'read'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."materia_log_action_enum" ADD VALUE IF NOT EXISTS 'auth'`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" ADD COLUMN IF NOT EXISTS "result" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" ADD COLUMN IF NOT EXISTS "error" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" ADD COLUMN IF NOT EXISTS "ipAddress" inet`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" ADD COLUMN IF NOT EXISTS "userAgent" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" ADD COLUMN IF NOT EXISTS "correlationId" character varying(128)`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" ADD COLUMN IF NOT EXISTS "previousValues" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" ADD COLUMN IF NOT EXISTS "newValues" jsonb`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_entrega_actividad_actividad_alumno" ON "entrega_actividad" ("actividadId", "alumnoId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alumno_materia_alumno_materia_estado" ON "alumno_materia" ("alumnoId", "materiaId", "estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_actividad_materia_activo" ON "actividad" ("materiaId", "activo")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_material_academico_materia_visible" ON "material_academico" ("materiaId", "visible")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_materia_log_materia_created" ON "materia_log" ("materiaId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_materia_log_materia_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_material_academico_materia_visible"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividad_materia_activo"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_alumno_materia_alumno_materia_estado"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_entrega_actividad_actividad_alumno"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" DROP COLUMN IF EXISTS "newValues"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" DROP COLUMN IF EXISTS "previousValues"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" DROP COLUMN IF EXISTS "correlationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" DROP COLUMN IF EXISTS "userAgent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" DROP COLUMN IF EXISTS "ipAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" DROP COLUMN IF EXISTS "error"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" DROP COLUMN IF EXISTS "result"`,
    );
  }
}
