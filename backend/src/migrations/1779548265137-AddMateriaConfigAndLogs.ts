import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMateriaConfigAndLogs1779548265137 implements MigrationInterface {
  name = 'AddMateriaConfigAndLogs1779548265137';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "materia"
      ADD COLUMN "configuracion" jsonb NOT NULL DEFAULT '{
        "tabs": {
          "inicio": true,
          "material": true,
          "videos": true,
          "semanas": true,
          "misAlumnos": true,
          "planilla": true,
          "logs": true,
          "configuracion": true
        },
        "pages": {
          "inicio": { "titulo": "", "descripcion": "" },
          "material": { "titulo": "Material Académico", "descripcion": "Recursos y contenidos para acompañar la cursada." },
          "videos": { "titulo": "Videos", "descripcion": "Videotutoriales y guías paso a paso para complementar tu aprendizaje." },
          "semanas": { "titulo": "Semanas", "descripcion": "Gestiona las semanas de la cursada" },
          "misAlumnos": { "titulo": "Mis Alumnos", "descripcion": "Solicitudes, comisiones y estudiantes de la materia." },
          "planilla": { "titulo": "Planilla de Seguimiento", "descripcion": "Actividades y entregas de la cursada." }
        }
      }'::jsonb
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."materia_log_action_enum" AS ENUM (
        'created',
        'updated',
        'deleted',
        'restored',
        'finalized',
        'config_updated'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "materia_log" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "id" SERIAL NOT NULL,
        "materiaId" integer NOT NULL,
        "usuarioId" integer,
        "actorNombre" character varying(100),
        "actorEmail" character varying(255),
        "action" "public"."materia_log_action_enum" NOT NULL,
        "resourceType" character varying(80) NOT NULL,
        "resourceId" character varying(80),
        "title" character varying(255) NOT NULL,
        "detail" text,
        "metadata" jsonb,
        CONSTRAINT "PK_materia_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_materia_log_materiaId" ON "materia_log" ("materiaId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "materia_log"
      ADD CONSTRAINT "FK_materia_log_materia"
      FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "materia_log"
      ADD CONSTRAINT "FK_materia_log_usuario"
      FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "materia_log" DROP CONSTRAINT "FK_materia_log_usuario"`,
    );
    await queryRunner.query(
      `ALTER TABLE "materia_log" DROP CONSTRAINT "FK_materia_log_materia"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_materia_log_materiaId"`);
    await queryRunner.query(`DROP TABLE "materia_log"`);
    await queryRunner.query(`DROP TYPE "public"."materia_log_action_enum"`);
    await queryRunner.query(
      `ALTER TABLE "materia" DROP COLUMN "configuracion"`,
    );
  }
}
