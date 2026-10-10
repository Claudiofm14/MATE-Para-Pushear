import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddGroupExercises1779548265150 implements MigrationInterface {
  name = 'AddGroupExercises1779548265150';
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE "ejercicio" ADD "assignmentMode" varchar(16) NOT NULL DEFAULT 'individual', ADD "minGroupSize" integer, ADD "maxGroupSize" integer, ADD "groupsLockedAt" TIMESTAMP, ADD "allowStudentGroupCreation" boolean NOT NULL DEFAULT true, ADD "allowLeaveAfterRepositoryCreation" boolean NOT NULL DEFAULT false`,
    );
    await q.query(
      `CREATE TABLE "exercise_group" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "exerciseId" integer NOT NULL, "name" varchar(100) NOT NULL, "normalizedName" varchar(100) NOT NULL, "createdByStudentId" integer NOT NULL, "modificationsLocked" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_exercise_group" PRIMARY KEY ("id"), CONSTRAINT "UQ_exercise_group_name" UNIQUE ("exerciseId", "normalizedName"))`,
    );
    await q.query(
      `CREATE TABLE "exercise_group_member" ("id" SERIAL NOT NULL, "groupId" integer NOT NULL, "exerciseId" integer NOT NULL, "studentId" integer NOT NULL, "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_exercise_group_member" PRIMARY KEY ("id"), CONSTRAINT "UQ_exercise_group_member_student_exercise" UNIQUE ("exerciseId", "studentId"))`,
    );
    await q.query(
      `CREATE TABLE "group_exercise_repository" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "exerciseId" integer NOT NULL, "groupId" integer NOT NULL, "giteaRepositoryId" varchar(255), "repositoryOwner" varchar(255) NOT NULL, "repositoryName" varchar(255) NOT NULL, "repositoryUrl" text NOT NULL DEFAULT '', "syncStatus" varchar(16) NOT NULL DEFAULT 'pending', "sanitizedError" text, CONSTRAINT "PK_group_exercise_repository" PRIMARY KEY ("id"), CONSTRAINT "UQ_group_exercise_repository" UNIQUE ("exerciseId", "groupId"))`,
    );
    await q.query(
      `ALTER TABLE "exercise_group" ADD CONSTRAINT "FK_group_exercise" FOREIGN KEY ("exerciseId") REFERENCES "ejercicio"("id") ON DELETE CASCADE, ADD CONSTRAINT "FK_group_creator" FOREIGN KEY ("createdByStudentId") REFERENCES "usuario"("id") ON DELETE RESTRICT`,
    );
    await q.query(
      `ALTER TABLE "exercise_group_member" ADD CONSTRAINT "FK_member_group" FOREIGN KEY ("groupId") REFERENCES "exercise_group"("id") ON DELETE CASCADE, ADD CONSTRAINT "FK_member_student" FOREIGN KEY ("studentId") REFERENCES "usuario"("id") ON DELETE CASCADE`,
    );
    await q.query(
      `ALTER TABLE "group_exercise_repository" ADD CONSTRAINT "FK_group_repo_exercise" FOREIGN KEY ("exerciseId") REFERENCES "ejercicio"("id") ON DELETE CASCADE, ADD CONSTRAINT "FK_group_repo_group" FOREIGN KEY ("groupId") REFERENCES "exercise_group"("id") ON DELETE CASCADE`,
    );
    await q.query(
      `CREATE INDEX "IDX_exercise_group_exercise" ON "exercise_group" ("exerciseId"); CREATE INDEX "IDX_group_member_group" ON "exercise_group_member" ("groupId"); CREATE INDEX "IDX_group_member_student" ON "exercise_group_member" ("studentId")`,
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(
      `DROP TABLE "group_exercise_repository"; DROP TABLE "exercise_group_member"; DROP TABLE "exercise_group"`,
    );
    await q.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "allowLeaveAfterRepositoryCreation", DROP COLUMN "allowStudentGroupCreation", DROP COLUMN "groupsLockedAt", DROP COLUMN "maxGroupSize", DROP COLUMN "minGroupSize", DROP COLUMN "assignmentMode"`,
    );
  }
}
