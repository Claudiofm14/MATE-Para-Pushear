import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaintenanceSetting1779548265147 implements MigrationInterface {
  name = 'AddMaintenanceSetting1779548265147';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "maintenance_setting" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "key" character varying(64) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "title" character varying(255),
        "message" text,
        "scheduledAt" TIMESTAMP,
        "estimatedUntil" TIMESTAMP,
        "updatedById" integer,
        CONSTRAINT "PK_maintenance_setting" PRIMARY KEY ("key")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "maintenance_setting"
        ("key", "enabled", "title", "message")
      VALUES
        ('global', false, 'Campus en mantenimiento', 'Estamos realizando tareas de mantenimiento. El acceso se restablecera cuando finalicen los trabajos.')
      ON CONFLICT ("key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "maintenance_setting"`);
  }
}
