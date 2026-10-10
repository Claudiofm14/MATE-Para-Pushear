import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContenidoToInicio1779548265135 implements MigrationInterface {
  name = 'AddContenidoToInicio1779548265135';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inicio" ADD "contenido" json`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inicio" DROP COLUMN "contenido"`);
  }
}
