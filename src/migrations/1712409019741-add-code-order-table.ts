import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCodeOrderTable1712409019741 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'code_vnpay',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'orders',
      new TableColumn({
        name: 'code_vnpay',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
