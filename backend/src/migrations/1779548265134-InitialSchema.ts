import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1779548265134 implements MigrationInterface {
  name = 'InitialSchema1779548265134';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contenedor" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "titulo" character varying(255) NOT NULL, "subtitulo" text, "tipo" character varying(50) NOT NULL, "padreId" integer, CONSTRAINT "PK_1f75e9b3e781063dcfa45ddb36b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inicio_contenedor" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "inicio_id" integer NOT NULL, "contenedor_id" integer NOT NULL, CONSTRAINT "PK_bb2db0a7b8d97891b236f0b5184" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contrato_pedagogico_contenedor" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "contrato_pedagogico_id" integer NOT NULL, "contenedor_id" integer NOT NULL, CONSTRAINT "PK_90d7b6834ee40ef107d0e346399" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contrato_pedagogico" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "titulo" character varying(100) NOT NULL, "materiaId" integer, CONSTRAINT "PK_f0f3a6c91084af9376375127cf6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "material_contenedor" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "material_id" integer NOT NULL, "contenedor_id" integer NOT NULL, CONSTRAINT "PK_49f5fc2440095c87e8e7e82ff76" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "material" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "titulo" character varying(255) NOT NULL, "materiaId" integer, CONSTRAINT "PK_0343d0d577f3effc2054cbaca7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "video" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "titulo" character varying(100) NOT NULL, "url" text NOT NULL, "subtitulo" character varying(255), "orden" integer NOT NULL DEFAULT '0', "semanaId" integer, "materiaId" integer, CONSTRAINT "PK_1a2f3856250765d72e7e1636c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ejercicio" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "titulo" character varying(100) NOT NULL, "descripcion" text NOT NULL, "url" text, "repositorioEjemplo" text, "readmeUrl" text, "classroomUrl" text, "fechaEntrega" date, "semanaId" integer, CONSTRAINT "PK_09160ab0efc6c5440304e762d2c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."horario_tipo_enum" AS ENUM('presencial', 'virtual')`,
    );
    await queryRunner.query(
      `CREATE TABLE "horario" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "titulo" character varying(100) NOT NULL, "tipo" "public"."horario_tipo_enum" NOT NULL DEFAULT 'presencial', "detalle" text NOT NULL, "url" text, "semanaId" integer, CONSTRAINT "PK_3c89ff4250bf835ce1f861313c7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "semana" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "titulo" character varying(100) NOT NULL, "descripcion" text NOT NULL, "numeroSemana" integer NOT NULL, "fechaInicio" date NOT NULL, "horaInicio" TIME NOT NULL DEFAULT '00:00', "importante" text, "avisos" text, "contenido" json, "cursadaId" integer, CONSTRAINT "PK_3c9f61b5dcbe6df67f30770ef7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "comision" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "descripcion" text, "cursadaId" integer, CONSTRAINT "PK_b131d9949148c5aa6d80795652a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cursada" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "titulo" character varying(100) NOT NULL, "descripcion" text, "activa" boolean NOT NULL DEFAULT true, "materiaId" integer, CONSTRAINT "PK_50d12c31efb9c16c41a7f749ae0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "material_academico" ("id" SERIAL NOT NULL, "titulo" character varying NOT NULL, "descripcion" text, "tipo" character varying, "categoria" character varying, "url" text, "textoBoton" character varying, "contenido" json, "icono" character varying, "color" character varying, "orden" integer NOT NULL DEFAULT '0', "visible" boolean NOT NULL DEFAULT true, "materiaId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_78008ef09d6014752241304d6b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "materia" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "nombre" character varying(255) NOT NULL, "codigo" character varying(50), CONSTRAINT "UQ_6d62d7f6267ed4a3175b9aabd2a" UNIQUE ("codigo"), CONSTRAINT "PK_a8b21a045c6a7d9cfffc3a2ab26" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inicio" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "titulo" character varying(255) NOT NULL, "materiaId" integer, CONSTRAINT "PK_7208133e3e61a210a4437a46248" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alumno_materia_estado_enum" AS ENUM('pendiente', 'aprobado', 'rechazado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alumno_materia" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "alumnoId" integer NOT NULL, "materiaId" integer NOT NULL, "comisionId" integer NOT NULL, "fechaInscripcion" TIMESTAMP NOT NULL DEFAULT now(), "estado" "public"."alumno_materia_estado_enum" NOT NULL DEFAULT 'pendiente', "mensaje" text, CONSTRAINT "PK_0961715b44e51accddf5a63a8de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profesor_comision" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "profesorMateriaId" integer NOT NULL, "comisionId" integer NOT NULL, CONSTRAINT "PK_0c79f4e17a5a8529b844c03014f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profesor_materia" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "profesorId" integer NOT NULL, "materiaId" integer NOT NULL, CONSTRAINT "PK_1e650f835c8680f9f60bf958de1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."usuario_rol_enum" AS ENUM('alumno', 'docente', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuario" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "authProviderId" character varying(255), "email" character varying(255) NOT NULL, "githubUser" character varying(255), "nombre" character varying(100) NOT NULL, "apellido" character varying(100) NOT NULL, "rol" "public"."usuario_rol_enum" NOT NULL, CONSTRAINT "UQ_b674add53ef375eba0a74937e3a" UNIQUE ("authProviderId"), CONSTRAINT "UQ_2863682842e688ca198eb25c124" UNIQUE ("email"), CONSTRAINT "PK_a56c58e5cabaa04fb2c98d2d7e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitud_acceso_materia_estado_enum" AS ENUM('pendiente', 'aprobado', 'rechazado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "solicitud_acceso_materia" ("id" SERIAL NOT NULL, "docente_id" integer NOT NULL, "materia_id" integer NOT NULL, "comisionIds" text, "estado" "public"."solicitud_acceso_materia_estado_enum" NOT NULL DEFAULT 'pendiente', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9161833fff0de7ed48fa2bb1578" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."actividad_tipocalificacion_enum" AS ENUM('numerico', 'conceptual')`,
    );
    await queryRunner.query(
      `CREATE TABLE "actividad" ("id" SERIAL NOT NULL, "nombre" character varying NOT NULL, "descripcion" text, "repositorioBase" character varying NOT NULL, "tipoCalificacion" "public"."actividad_tipocalificacion_enum" NOT NULL DEFAULT 'numerico', "materiaId" integer NOT NULL, "activo" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ae34007f8c81abaf44d8992662d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "entrega_actividad" ("id" SERIAL NOT NULL, "actividadId" integer NOT NULL, "alumnoId" integer NOT NULL, "notaNumerica" numeric(5,2), "notaConceptual" character varying(50), "comentario" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dafea6d3aeb7fe30761a2314b57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "semana_comision" ("semana_id" integer NOT NULL, "comision_id" integer NOT NULL, CONSTRAINT "PK_4e39a02990c9a2ff1885f91bd3f" PRIMARY KEY ("semana_id", "comision_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_47f599974145a1843270aeeae6" ON "semana_comision" ("semana_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c7457c25652beeb1e1d36197c4" ON "semana_comision" ("comision_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "contenedor" ADD CONSTRAINT "FK_9188348ec36e82f9aa9c2a0d8c1" FOREIGN KEY ("padreId") REFERENCES "contenedor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inicio_contenedor" ADD CONSTRAINT "FK_441b9646a456f50c49b00e20144" FOREIGN KEY ("inicio_id") REFERENCES "inicio"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inicio_contenedor" ADD CONSTRAINT "FK_f05dd0cf20847d523e9d4066dfc" FOREIGN KEY ("contenedor_id") REFERENCES "contenedor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pedagogico_contenedor" ADD CONSTRAINT "FK_bb81189d74beb767e91f493f68f" FOREIGN KEY ("contrato_pedagogico_id") REFERENCES "contrato_pedagogico"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pedagogico_contenedor" ADD CONSTRAINT "FK_892490f7d72f3a8a7e34956eb44" FOREIGN KEY ("contenedor_id") REFERENCES "contenedor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pedagogico" ADD CONSTRAINT "FK_70dfc54f8dce0b6c64fbba353ee" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_contenedor" ADD CONSTRAINT "FK_55f172f5feb685cdb5dccd6b1dd" FOREIGN KEY ("material_id") REFERENCES "material"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_contenedor" ADD CONSTRAINT "FK_7f444eb8988ac2134ab712c0da1" FOREIGN KEY ("contenedor_id") REFERENCES "contenedor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_3798a5d00af5d7c6657b4de56a4" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "video" ADD CONSTRAINT "FK_5bdc8b262fef9864dd6c077ebba" FOREIGN KEY ("semanaId") REFERENCES "semana"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "video" ADD CONSTRAINT "FK_28ea7916d883b0e9268e6bcc97f" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD CONSTRAINT "FK_e5550e97b35f4967718cc0bb646" FOREIGN KEY ("semanaId") REFERENCES "semana"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "horario" ADD CONSTRAINT "FK_6ed9fc76792fc5a598e0ca2aef7" FOREIGN KEY ("semanaId") REFERENCES "semana"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "semana" ADD CONSTRAINT "FK_f95f0abae31055bcc29451bf953" FOREIGN KEY ("cursadaId") REFERENCES "cursada"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comision" ADD CONSTRAINT "FK_c8407f9392c47402b1475a5306a" FOREIGN KEY ("cursadaId") REFERENCES "cursada"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cursada" ADD CONSTRAINT "FK_bab199ed7f2080e6f4119c361dc" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_academico" ADD CONSTRAINT "FK_0fae3ee92f8563c8931b695897b" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inicio" ADD CONSTRAINT "FK_06a825604ae8eaccc50db6f31e2" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alumno_materia" ADD CONSTRAINT "FK_6fa3afe24eb292a19ccd8dd99da" FOREIGN KEY ("alumnoId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alumno_materia" ADD CONSTRAINT "FK_390306fd9349817bd182269ffa5" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alumno_materia" ADD CONSTRAINT "FK_d815d1e251f2147f7d76b6b7475" FOREIGN KEY ("comisionId") REFERENCES "comision"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profesor_comision" ADD CONSTRAINT "FK_cee4da37959e7edf6eac60e4783" FOREIGN KEY ("profesorMateriaId") REFERENCES "profesor_materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profesor_comision" ADD CONSTRAINT "FK_31d47f0dc90679406520f761a6a" FOREIGN KEY ("comisionId") REFERENCES "comision"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profesor_materia" ADD CONSTRAINT "FK_7c1213482bad2245fbc8651b188" FOREIGN KEY ("profesorId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profesor_materia" ADD CONSTRAINT "FK_6634d1dc517b523daa732dcdd3b" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitud_acceso_materia" ADD CONSTRAINT "FK_ed00e876ee0e215976123a7ecfe" FOREIGN KEY ("docente_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitud_acceso_materia" ADD CONSTRAINT "FK_c17fa28aa407cc598a3709fafed" FOREIGN KEY ("materia_id") REFERENCES "materia"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividad" ADD CONSTRAINT "FK_0ae8b55a199b1c5a78d27b49bbc" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entrega_actividad" ADD CONSTRAINT "FK_954d8bbefd60e52a7bd683db371" FOREIGN KEY ("actividadId") REFERENCES "actividad"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entrega_actividad" ADD CONSTRAINT "FK_27a7c66fd2f19175d82424e51fd" FOREIGN KEY ("alumnoId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "semana_comision" ADD CONSTRAINT "FK_47f599974145a1843270aeeae6c" FOREIGN KEY ("semana_id") REFERENCES "semana"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "semana_comision" ADD CONSTRAINT "FK_c7457c25652beeb1e1d36197c47" FOREIGN KEY ("comision_id") REFERENCES "comision"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "semana_comision" DROP CONSTRAINT "FK_c7457c25652beeb1e1d36197c47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "semana_comision" DROP CONSTRAINT "FK_47f599974145a1843270aeeae6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entrega_actividad" DROP CONSTRAINT "FK_27a7c66fd2f19175d82424e51fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entrega_actividad" DROP CONSTRAINT "FK_954d8bbefd60e52a7bd683db371"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividad" DROP CONSTRAINT "FK_0ae8b55a199b1c5a78d27b49bbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitud_acceso_materia" DROP CONSTRAINT "FK_c17fa28aa407cc598a3709fafed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitud_acceso_materia" DROP CONSTRAINT "FK_ed00e876ee0e215976123a7ecfe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profesor_materia" DROP CONSTRAINT "FK_6634d1dc517b523daa732dcdd3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profesor_materia" DROP CONSTRAINT "FK_7c1213482bad2245fbc8651b188"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profesor_comision" DROP CONSTRAINT "FK_31d47f0dc90679406520f761a6a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profesor_comision" DROP CONSTRAINT "FK_cee4da37959e7edf6eac60e4783"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alumno_materia" DROP CONSTRAINT "FK_d815d1e251f2147f7d76b6b7475"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alumno_materia" DROP CONSTRAINT "FK_390306fd9349817bd182269ffa5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alumno_materia" DROP CONSTRAINT "FK_6fa3afe24eb292a19ccd8dd99da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inicio" DROP CONSTRAINT "FK_06a825604ae8eaccc50db6f31e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_academico" DROP CONSTRAINT "FK_0fae3ee92f8563c8931b695897b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cursada" DROP CONSTRAINT "FK_bab199ed7f2080e6f4119c361dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comision" DROP CONSTRAINT "FK_c8407f9392c47402b1475a5306a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "semana" DROP CONSTRAINT "FK_f95f0abae31055bcc29451bf953"`,
    );
    await queryRunner.query(
      `ALTER TABLE "horario" DROP CONSTRAINT "FK_6ed9fc76792fc5a598e0ca2aef7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP CONSTRAINT "FK_e5550e97b35f4967718cc0bb646"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video" DROP CONSTRAINT "FK_28ea7916d883b0e9268e6bcc97f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video" DROP CONSTRAINT "FK_5bdc8b262fef9864dd6c077ebba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" DROP CONSTRAINT "FK_3798a5d00af5d7c6657b4de56a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_contenedor" DROP CONSTRAINT "FK_7f444eb8988ac2134ab712c0da1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_contenedor" DROP CONSTRAINT "FK_55f172f5feb685cdb5dccd6b1dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pedagogico" DROP CONSTRAINT "FK_70dfc54f8dce0b6c64fbba353ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pedagogico_contenedor" DROP CONSTRAINT "FK_892490f7d72f3a8a7e34956eb44"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pedagogico_contenedor" DROP CONSTRAINT "FK_bb81189d74beb767e91f493f68f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inicio_contenedor" DROP CONSTRAINT "FK_f05dd0cf20847d523e9d4066dfc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inicio_contenedor" DROP CONSTRAINT "FK_441b9646a456f50c49b00e20144"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contenedor" DROP CONSTRAINT "FK_9188348ec36e82f9aa9c2a0d8c1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c7457c25652beeb1e1d36197c4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47f599974145a1843270aeeae6"`,
    );
    await queryRunner.query(`DROP TABLE "semana_comision"`);
    await queryRunner.query(`DROP TABLE "entrega_actividad"`);
    await queryRunner.query(`DROP TABLE "actividad"`);
    await queryRunner.query(
      `DROP TYPE "public"."actividad_tipocalificacion_enum"`,
    );
    await queryRunner.query(`DROP TABLE "solicitud_acceso_materia"`);
    await queryRunner.query(
      `DROP TYPE "public"."solicitud_acceso_materia_estado_enum"`,
    );
    await queryRunner.query(`DROP TABLE "usuario"`);
    await queryRunner.query(`DROP TYPE "public"."usuario_rol_enum"`);
    await queryRunner.query(`DROP TABLE "profesor_materia"`);
    await queryRunner.query(`DROP TABLE "profesor_comision"`);
    await queryRunner.query(`DROP TABLE "alumno_materia"`);
    await queryRunner.query(`DROP TYPE "public"."alumno_materia_estado_enum"`);
    await queryRunner.query(`DROP TABLE "inicio"`);
    await queryRunner.query(`DROP TABLE "materia"`);
    await queryRunner.query(`DROP TABLE "material_academico"`);
    await queryRunner.query(`DROP TABLE "cursada"`);
    await queryRunner.query(`DROP TABLE "comision"`);
    await queryRunner.query(`DROP TABLE "semana"`);
    await queryRunner.query(`DROP TABLE "horario"`);
    await queryRunner.query(`DROP TYPE "public"."horario_tipo_enum"`);
    await queryRunner.query(`DROP TABLE "ejercicio"`);
    await queryRunner.query(`DROP TABLE "video"`);
    await queryRunner.query(`DROP TABLE "material"`);
    await queryRunner.query(`DROP TABLE "material_contenedor"`);
    await queryRunner.query(`DROP TABLE "contrato_pedagogico"`);
    await queryRunner.query(`DROP TABLE "contrato_pedagogico_contenedor"`);
    await queryRunner.query(`DROP TABLE "inicio_contenedor"`);
    await queryRunner.query(`DROP TABLE "contenedor"`);
  }
}
