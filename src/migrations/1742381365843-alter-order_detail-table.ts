import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AlterOrderDetailTable1742381365843 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('order_details', [
            new TableColumn({
                name:"is_rating",
                type: "boolean",
                default: false
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('order_details', [
            new TableColumn({
                name:"is_rating",
                type: "boolean",
                default: false
            }),
        ]);
    }

}
