import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCronogramaCursada1779548265154 implements MigrationInterface {
  name = 'AddCronogramaCursada1779548265154';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."cronograma_fila_comision_modalidad_enum" AS ENUM('presencial', 'virtual')`,
    );
    await queryRunner.query(`CREATE TABLE "cronograma_fila" (
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "cursadaId" integer NOT NULL,
      "numeroSemana" integer NOT NULL, "fecha" date NOT NULL, "hora" time,
      "actividades" character varying(4000) NOT NULL DEFAULT '',
      "temas" character varying(4000) NOT NULL DEFAULT '', "tareas" character varying(4000) NOT NULL DEFAULT '',
      CONSTRAINT "CHK_cronograma_numero_semana" CHECK ("numeroSemana" > 0),
      CONSTRAINT "PK_cronograma_fila" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "cronograma_fila_comision" (
      "id" SERIAL NOT NULL, "cronogramaFilaId" integer NOT NULL, "comisionId" integer NOT NULL,
      "modalidad" "public"."cronograma_fila_comision_modalidad_enum" NOT NULL,
      CONSTRAINT "UQ_cronograma_fila_comision" UNIQUE ("cronogramaFilaId", "comisionId"),
      CONSTRAINT "PK_cronograma_fila_comision" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE INDEX "IDX_cronograma_fila_cursada_semana_fecha" ON "cronograma_fila" ("cursadaId", "numeroSemana", "fecha")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cronograma_fila_comision_comision" ON "cronograma_fila_comision" ("comisionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cronograma_fila" ADD CONSTRAINT "FK_cronograma_fila_cursada" FOREIGN KEY ("cursadaId") REFERENCES "cursada"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "cronograma_fila_comision" ADD CONSTRAINT "FK_cronograma_rel_fila" FOREIGN KEY ("cronogramaFilaId") REFERENCES "cronograma_fila"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "cronograma_fila_comision" ADD CONSTRAINT "FK_cronograma_rel_comision" FOREIGN KEY ("comisionId") REFERENCES "comision"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cronograma_fila_comision" DROP CONSTRAINT "FK_cronograma_rel_comision"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cronograma_fila_comision" DROP CONSTRAINT "FK_cronograma_rel_fila"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cronograma_fila" DROP CONSTRAINT "FK_cronograma_fila_cursada"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cronograma_fila_comision_comision"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cronograma_fila_cursada_semana_fecha"`,
    );
    await queryRunner.query(`DROP TABLE "cronograma_fila_comision"`);
    await queryRunner.query(`DROP TABLE "cronograma_fila"`);
    await queryRunner.query(
      `DROP TYPE "public"."cronograma_fila_comision_modalidad_enum"`,
    );
  }
}
