import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterProductTable1742235743514 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('products', [
      new TableColumn({
        name: 'sold',
        type: 'decimal',
        length: '100',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('products', [
      new TableColumn({
        name: 'sold',
        type: 'decimal',
        length: '100',
        isNullable: true,
      }),
    ]);
  }
}
