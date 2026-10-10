import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAdminControls1779548265145 implements MigrationInterface {
  name = 'AddUserAdminControls1779548265145';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "activo" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "suspendidoAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "suspendidoPorId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "suspensionMotivo" text`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_usuario_suspendido_por'
        ) THEN
          ALTER TABLE "usuario"
          ADD CONSTRAINT "FK_usuario_suspendido_por"
          FOREIGN KEY ("suspendidoPorId") REFERENCES "usuario"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_audit_log_action_enum') THEN
          CREATE TYPE "public"."admin_audit_log_action_enum" AS ENUM (
            'user_role_updated',
            'user_suspended',
            'user_reactivated'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_audit_log" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "id" SERIAL NOT NULL,
        "actorId" integer,
        "actorEmail" character varying(255),
        "targetUserId" integer,
        "targetEmail" character varying(255),
        "action" "public"."admin_audit_log_action_enum" NOT NULL,
        "title" character varying(255) NOT NULL,
        "detail" text,
        "previousValues" jsonb,
        "newValues" jsonb,
        "result" character varying(64) NOT NULL DEFAULT 'success',
        "correlationId" character varying(128),
        CONSTRAINT "PK_admin_audit_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_admin_audit_actor'
        ) THEN
          ALTER TABLE "admin_audit_log"
          ADD CONSTRAINT "FK_admin_audit_actor"
          FOREIGN KEY ("actorId") REFERENCES "usuario"("id")
          ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_admin_audit_target'
        ) THEN
          ALTER TABLE "admin_audit_log"
          ADD CONSTRAINT "FK_admin_audit_target"
          FOREIGN KEY ("targetUserId") REFERENCES "usuario"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_admin_audit_actor" ON "admin_audit_log" ("actorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_admin_audit_target" ON "admin_audit_log" ("targetUserId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_usuario_activo_rol" ON "usuario" ("activo", "rol")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usuario_activo_rol"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_audit_target"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_audit_actor"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_audit_log"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."admin_audit_log_action_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP CONSTRAINT IF EXISTS "FK_usuario_suspendido_por"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP COLUMN IF EXISTS "suspensionMotivo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP COLUMN IF EXISTS "suspendidoPorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP COLUMN IF EXISTS "suspendidoAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP COLUMN IF EXISTS "activo"`,
    );
  }
}
