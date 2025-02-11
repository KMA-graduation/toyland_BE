import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ListBranchQuery } from './dto/list-branch-query.dto';
import { Auth } from '@decorators/auth.decorator';
import { AuthType } from '@enums/auth.enum';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Roles(RoleEnum.ADMIN)
  @Post()
  create(@Body() request: CreateBranchDto) {
    return this.branchService.create(request);
  }

  @Get()
  @Auth(AuthType.Public)
  findAll(@Query() request: ListBranchQuery) {
    return this.branchService.findAll(request);
  }

  @Get('/:id')
  @Auth(AuthType.Public)
  findOne(@Param('id') id: number) {
    return this.branchService.findOne(id);
  }

  @Roles(RoleEnum.ADMIN)
  @Patch('/:id')
  update(@Param('id') id: number, @Body() request: UpdateBranchDto) {
    return this.branchService.update(id, request);
  }

  @Roles(RoleEnum.ADMIN)
  @Delete('/:id')
  remove(@Param('id') id: number) {
    return this.branchService.remove(id);
  }
}
