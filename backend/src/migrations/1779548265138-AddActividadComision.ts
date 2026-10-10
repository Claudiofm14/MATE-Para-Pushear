import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActividadComision1779548265138 implements MigrationInterface {
  name = 'AddActividadComision1779548265138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "actividad_comision" ("actividad_id" integer NOT NULL, "comision_id" integer NOT NULL, CONSTRAINT "PK_actividad_comision" PRIMARY KEY ("actividad_id", "comision_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actividad_comision_actividad" ON "actividad_comision" ("actividad_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actividad_comision_comision" ON "actividad_comision" ("comision_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividad_comision" ADD CONSTRAINT "FK_actividad_comision_actividad" FOREIGN KEY ("actividad_id") REFERENCES "actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividad_comision" ADD CONSTRAINT "FK_actividad_comision_comision" FOREIGN KEY ("comision_id") REFERENCES "comision"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actividad_comision" DROP CONSTRAINT "FK_actividad_comision_comision"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividad_comision" DROP CONSTRAINT "FK_actividad_comision_actividad"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_actividad_comision_comision"`);
    await queryRunner.query(`DROP INDEX "IDX_actividad_comision_actividad"`);
    await queryRunner.query(`DROP TABLE "actividad_comision"`);
  }
}
