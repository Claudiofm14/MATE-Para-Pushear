import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExerciseResourceTypes1779548265144 implements MigrationInterface {
  name = 'AddExerciseResourceTypes1779548265144';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD "tipoActividad" character varying(32) NOT NULL DEFAULT 'programacion'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD "recursoTipo" character varying(32)`,
    );
    await queryRunner.query(`ALTER TABLE "ejercicio" ADD "recursoUrl" text`);
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD "recursoTitulo" character varying(120)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "recursoTitulo"`,
    );
    await queryRunner.query(`ALTER TABLE "ejercicio" DROP COLUMN "recursoUrl"`);
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "recursoTipo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "tipoActividad"`,
    );
  }
}
