import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandAdminAuditActions1779548265146 implements MigrationInterface {
  name = 'ExpandAdminAuditActions1779548265146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = [
      'user_teacher_assigned',
      'user_teacher_removed',
      'materia_created',
      'materia_updated',
      'materia_deleted',
      'materia_restored',
      'student_enrollment_updated',
      'delivery_updated',
      'gitea_import_executed',
      'maintenance_updated',
    ];

    for (const value of values) {
      await queryRunner.query(
        `ALTER TYPE "public"."admin_audit_log_action_enum" ADD VALUE IF NOT EXISTS '${value}'`,
      );
    }
  }

  public async down(): Promise<void> {
    // PostgreSQL no permite quitar valores de un enum sin recrear el tipo.
  }
}
