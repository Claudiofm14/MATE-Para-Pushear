import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGiteaPasswordAuditAction1779548265151 implements MigrationInterface {
  name = 'AddGiteaPasswordAuditAction1779548265151';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."admin_audit_log_action_enum" ADD VALUE IF NOT EXISTS 'gitea_password_updated'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL no permite quitar un valor de un enum sin recrear el tipo.
  }
}
