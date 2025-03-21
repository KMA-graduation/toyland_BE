import { IsNotEmpty, IsString } from "class-validator";

export class UpdateCronJobDto {
    @IsString()
    @IsNotEmpty()
    job: string

    @IsString()
    @IsNotEmpty()
    cronExpression: string
}