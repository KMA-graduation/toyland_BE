import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AlterUserTable1744098256271 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('users', [
            new TableColumn({
                name:"phone_number",
                type: "varchar",
                length: '255',
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('users', [
            new TableColumn({
                name:"phone_number",
                type: "varchar",
                length: '255',
                isNullable: true,
            }),
        ]);
    }

}
