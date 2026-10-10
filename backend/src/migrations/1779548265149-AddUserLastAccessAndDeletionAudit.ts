import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLastAccessAndDeletionAudit1779548265149 implements MigrationInterface {
  name = 'AddUserLastAccessAndDeletionAudit1779548265149';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "ultimoAccesoAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."admin_audit_log_action_enum" ADD VALUE IF NOT EXISTS 'user_deleted'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP COLUMN IF EXISTS "ultimoAccesoAt"`,
    );
    // PostgreSQL no permite quitar un valor de un enum sin recrear el tipo.
  }
}
