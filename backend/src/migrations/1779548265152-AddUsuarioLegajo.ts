import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsuarioLegajo1779548265152 implements MigrationInterface {
  name = 'AddUsuarioLegajo1779548265152';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "legajo" VARCHAR(64)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_usuario_legajo_unique" ON "usuario" ("legajo") WHERE "legajo" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."admin_audit_log_action_enum" ADD VALUE IF NOT EXISTS 'student_list_exported'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usuario_legajo_unique"`);
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP COLUMN IF EXISTS "legajo"`,
    );
    // PostgreSQL no permite quitar un valor de un enum sin recrear el tipo.
  }
}
