import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGiteaCourseExerciseRepos1779548265141 implements MigrationInterface {
  name = 'AddGiteaCourseExerciseRepos1779548265141';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cursada" ADD "giteaIntegrationEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "cursada" ADD "giteaOrgName" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cursada" ADD "giteaOrgId" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "cursada" ADD "giteaOrgUrl" text`);

    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD "giteaTemplateOwner" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD "giteaTemplateRepo" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD "giteaTemplateRepoId" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD "giteaTemplateCloneUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD "giteaAutoCreateRepo" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(
      `CREATE TABLE "student_exercise_repository" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "exerciseId" integer NOT NULL, "studentId" integer NOT NULL, "giteaOwnerOrg" character varying(255) NOT NULL, "giteaRepoName" character varying(255) NOT NULL, "giteaRepoFullName" character varying(255) NOT NULL, "giteaRepoUrl" text NOT NULL, "giteaCloneUrlHttp" text, "giteaCloneUrlSsh" text, "status" character varying(32) NOT NULL DEFAULT 'pending', "errorMessage" text, CONSTRAINT "UQ_student_exercise_repository_exercise_student" UNIQUE ("exerciseId", "studentId"), CONSTRAINT "PK_student_exercise_repository" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" ADD CONSTRAINT "FK_student_exercise_repository_exercise" FOREIGN KEY ("exerciseId") REFERENCES "ejercicio"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" ADD CONSTRAINT "FK_student_exercise_repository_student" FOREIGN KEY ("studentId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" DROP CONSTRAINT "FK_student_exercise_repository_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_exercise_repository" DROP CONSTRAINT "FK_student_exercise_repository_exercise"`,
    );
    await queryRunner.query(`DROP TABLE "student_exercise_repository"`);

    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "giteaAutoCreateRepo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "giteaTemplateCloneUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "giteaTemplateRepoId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "giteaTemplateRepo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "giteaTemplateOwner"`,
    );

    await queryRunner.query(`ALTER TABLE "cursada" DROP COLUMN "giteaOrgUrl"`);
    await queryRunner.query(`ALTER TABLE "cursada" DROP COLUMN "giteaOrgId"`);
    await queryRunner.query(`ALTER TABLE "cursada" DROP COLUMN "giteaOrgName"`);
    await queryRunner.query(
      `ALTER TABLE "cursada" DROP COLUMN "giteaIntegrationEnabled"`,
    );
  }
}
