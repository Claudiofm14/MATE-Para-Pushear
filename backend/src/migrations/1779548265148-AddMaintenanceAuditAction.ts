import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaintenanceAuditAction1779548265148 implements MigrationInterface {
  name = 'AddMaintenanceAuditAction1779548265148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."admin_audit_log_action_enum" ADD VALUE IF NOT EXISTS 'maintenance_updated'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL no permite quitar valores de un enum sin recrear el tipo.
  }
}
