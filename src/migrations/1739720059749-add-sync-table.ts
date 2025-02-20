import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSyncTable1739720059749 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('orders', [
      new TableColumn({
        name: 'source',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'shopify_order_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'shopbase_order_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fulfillment_status',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'financial_status',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    ]);

    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'source',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'shopify_customer_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'shopbase_customer_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('orders', [
      new TableColumn({
        name: 'source',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'shopify_order_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'shopbase_order_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fulfillment_status',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'financial_status',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    ]);

    await queryRunner.dropColumns('users', [
      new TableColumn({
        name: 'source',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'shopify_customer_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'shopbase_customer_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    ]);
  }
}
