import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizePlanillaIndexes1779548265153 implements MigrationInterface {
  name = 'OptimizePlanillaIndexes1779548265153';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_student_exercise_repository_student" ON "student_exercise_repository" ("studentId") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_student_exercise_repository_student"`,
    );
  }
}
