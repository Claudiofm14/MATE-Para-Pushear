import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvanceEjercicio1779548265162 implements MigrationInterface {
  name = 'AddAvanceEjercicio1779548265162';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "avance_ejercicio" (
        "id" SERIAL NOT NULL,
        "alumnoId" integer NOT NULL,
        "cursadaId" integer NOT NULL,
        "ejercicioId" integer NOT NULL,
        "completadoEn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_avance_ejercicio" PRIMARY KEY ("id"),
        CONSTRAINT "FK_avance_alumno" FOREIGN KEY ("alumnoId") REFERENCES "usuario"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_avance_cursada" FOREIGN KEY ("cursadaId") REFERENCES "cursada"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_avance_ejercicio" FOREIGN KEY ("ejercicioId") REFERENCES "ejercicio"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_avance_alumno_cursada_ejercicio"
      ON "avance_ejercicio" ("alumnoId", "cursadaId", "ejercicioId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "avance_ejercicio"');
  }
}
