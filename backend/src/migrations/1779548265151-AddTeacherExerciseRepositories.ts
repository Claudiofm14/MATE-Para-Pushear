import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherExerciseRepositories1779548265151 implements MigrationInterface {
  name = 'AddTeacherExerciseRepositories1779548265151';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "teacher_exercise_repository" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "exerciseId" integer NOT NULL, "teacherId" integer NOT NULL, "giteaOwnerOrg" character varying(255) NOT NULL, "giteaRepoName" character varying(255) NOT NULL, "giteaRepoFullName" character varying(255) NOT NULL, "giteaRepoUrl" text NOT NULL DEFAULT '', "giteaCloneUrlHttp" text, "giteaCloneUrlSsh" text, "status" character varying(32) NOT NULL DEFAULT 'pending', "errorMessage" text, CONSTRAINT "UQ_teacher_exercise_repository_exercise_teacher" UNIQUE ("exerciseId", "teacherId"), CONSTRAINT "PK_teacher_exercise_repository" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_exercise_repository" ADD CONSTRAINT "FK_teacher_repo_exercise" FOREIGN KEY ("exerciseId") REFERENCES "ejercicio"("id") ON DELETE CASCADE, ADD CONSTRAINT "FK_teacher_repo_teacher" FOREIGN KEY ("teacherId") REFERENCES "usuario"("id") ON DELETE CASCADE`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "teacher_exercise_repository"`);
  }
}
