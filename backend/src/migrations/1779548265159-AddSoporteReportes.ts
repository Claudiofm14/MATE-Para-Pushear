import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reportes de soporte: hilo de conversacion entre un usuario y los admins
 * para reportar bugs, pedir funcionalidades o senalar detalles esteticos.
 *
 * El indice unico parcial `UQ_reporte_soporte_abierto_por_usuario` es el que
 * garantiza la regla de negocio central: un usuario no puede tener mas de un
 * hilo abierto a la vez.
 */
export class AddSoporteReportes1779548265159 implements MigrationInterface {
  name = 'AddSoporteReportes1779548265159';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reporte_soporte_categoria_enum') THEN
          CREATE TYPE "public"."reporte_soporte_categoria_enum" AS ENUM (
            'bug',
            'funcionalidad',
            'estetico',
            'otro'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reporte_soporte_estado_enum') THEN
          CREATE TYPE "public"."reporte_soporte_estado_enum" AS ENUM (
            'abierto',
            'cerrado'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reporte_soporte" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "usuarioId" integer NOT NULL,
        "categoria" "public"."reporte_soporte_categoria_enum" NOT NULL,
        "asunto" character varying(140) NOT NULL,
        "estado" "public"."reporte_soporte_estado_enum" NOT NULL DEFAULT 'abierto',
        "paginaOrigen" character varying(255),
        "userAgent" character varying(400),
        "ultimoMensajeEn" TIMESTAMP NOT NULL DEFAULT now(),
        "ultimaLecturaUsuario" TIMESTAMP,
        "ultimaLecturaAdmin" TIMESTAMP,
        "cerradoEn" TIMESTAMP,
        "cerradoPorId" integer,
        CONSTRAINT "PK_reporte_soporte" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mensaje_soporte" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "reporteId" integer NOT NULL,
        "autorId" integer,
        "autorNombre" character varying(160) NOT NULL,
        "esAdmin" boolean NOT NULL DEFAULT false,
        "cuerpo" text NOT NULL,
        CONSTRAINT "PK_mensaje_soporte" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "adjunto_soporte" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "mensajeId" integer NOT NULL,
        "nombre" character varying(255) NOT NULL,
        "mimeType" character varying(100) NOT NULL,
        "tamanio" integer NOT NULL,
        "contenido" bytea NOT NULL,
        CONSTRAINT "PK_adjunto_soporte" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "reporte_soporte"
      DROP CONSTRAINT IF EXISTS "FK_reporte_soporte_usuario"
    `);
    await queryRunner.query(`
      ALTER TABLE "reporte_soporte"
      ADD CONSTRAINT "FK_reporte_soporte_usuario"
      FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "reporte_soporte"
      DROP CONSTRAINT IF EXISTS "FK_reporte_soporte_cerrado_por"
    `);
    await queryRunner.query(`
      ALTER TABLE "reporte_soporte"
      ADD CONSTRAINT "FK_reporte_soporte_cerrado_por"
      FOREIGN KEY ("cerradoPorId") REFERENCES "usuario"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "mensaje_soporte"
      DROP CONSTRAINT IF EXISTS "FK_mensaje_soporte_reporte"
    `);
    await queryRunner.query(`
      ALTER TABLE "mensaje_soporte"
      ADD CONSTRAINT "FK_mensaje_soporte_reporte"
      FOREIGN KEY ("reporteId") REFERENCES "reporte_soporte"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "mensaje_soporte"
      DROP CONSTRAINT IF EXISTS "FK_mensaje_soporte_autor"
    `);
    await queryRunner.query(`
      ALTER TABLE "mensaje_soporte"
      ADD CONSTRAINT "FK_mensaje_soporte_autor"
      FOREIGN KEY ("autorId") REFERENCES "usuario"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "adjunto_soporte"
      DROP CONSTRAINT IF EXISTS "FK_adjunto_soporte_mensaje"
    `);
    await queryRunner.query(`
      ALTER TABLE "adjunto_soporte"
      ADD CONSTRAINT "FK_adjunto_soporte_mensaje"
      FOREIGN KEY ("mensajeId") REFERENCES "mensaje_soporte"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reporte_soporte_usuario" ON "reporte_soporte" ("usuarioId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reporte_soporte_estado" ON "reporte_soporte" ("estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mensaje_soporte_reporte" ON "mensaje_soporte" ("reporteId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_adjunto_soporte_mensaje" ON "adjunto_soporte" ("mensajeId")`,
    );

    // Un solo hilo abierto por usuario, garantizado por la base.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_reporte_soporte_abierto_por_usuario"
      ON "reporte_soporte" ("usuarioId")
      WHERE "estado" = 'abierto' AND "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "adjunto_soporte"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mensaje_soporte"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reporte_soporte"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."reporte_soporte_estado_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."reporte_soporte_categoria_enum"`,
    );
  }
}
