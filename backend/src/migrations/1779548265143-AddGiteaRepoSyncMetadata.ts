import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGiteaRepoSyncMetadata1779548265143 implements MigrationInterface {
  name = 'AddGiteaRepoSyncMetadata1779548265143';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" ADD "repoExists" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" ADD "syncStatus" character varying(32) NOT NULL DEFAULT 'never_synced'`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" ADD "lastSyncedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" ADD "lastCommitSha" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" ADD "lastCommitMessage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" ADD "lastCommitAuthor" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" ADD "lastCommitAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" DROP COLUMN "lastCommitAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" DROP COLUMN "lastCommitAuthor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" DROP COLUMN "lastCommitMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" DROP COLUMN "lastCommitSha"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" DROP COLUMN "lastSyncedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" DROP COLUMN "syncStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" DROP COLUMN "repoExists"`,
    );
  }
}
