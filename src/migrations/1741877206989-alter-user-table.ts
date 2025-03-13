import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterUserTable1741877206989 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'avatar',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'birth',
        type: 'timestamptz',
        default: 'now()',
        isNullable: true,
      }),
      new TableColumn({
        name: 'gender',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'address',
        type: 'text',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', [
      new TableColumn({
        name: 'avatar',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'birth',
        type: 'timestamptz',
        default: 'now()',
        isNullable: true,
      }),
      new TableColumn({
        name: 'gender',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'address',
        type: 'text',
        isNullable: true,
      }),
    ]);
  }
}
