import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserActivity1779548265155 implements MigrationInterface {
  name = 'AddUserActivity1779548265155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_activity" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "kind" character varying(32) NOT NULL,
        "path" character varying(180) NOT NULL,
        "label" character varying(100) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_activity" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_activity_user" FOREIGN KEY ("userId")
          REFERENCES "usuario"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_activity_user_created" ON "user_activity" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_activity_kind_created" ON "user_activity" ("kind", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_activity"`);
  }
}
