import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BranchEntity } from '@entities/branch.entity';
import { Repository } from 'typeorm';
import { ListBranchQuery } from './dto/list-branch-query.dto';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
  ) {}

  async create(request: CreateBranchDto) {
    const branch = new BranchEntity();
    branch.name = request.name;
    //@TODO logo

    const branchExisted = await this.getBranchByName(request.name);
    if (branchExisted) {
      throw new NotFoundException(ResponseMessageEnum.BRANCH_ALREADY_EXISTED);
    }
    const result = await this.branchRepository.save(branch).catch((error) => {
      console.log('🚀 ~ BranchService ~ create ~ error:', error);
      throw new Error(error.message);
    });

    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
      .build();
  }

  async findAll(request: ListBranchQuery) {
    const { page, take, skip } = request;
    const [branches, number] = await this.branchRepository.findAndCount({
      take,
      skip,
    });

    const pages = Math.ceil(number / take) || 1;

    const result = {
      branches,
      total: number,
      page,
      pages,
      limit: take,
    };

    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async findOne(id: number) {
    const branch = await this.getBranchById(id);
    if (!branch) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    return new ResponseBuilder()
      .withData(branch)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async update(id: number, request: UpdateBranchDto) {
    const branch = await this.getBranchById(id);
    if (!branch) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    for (const key in request) {
      if (key !== 'id') branch[key] = request[key];
    }
    const result = await this.branchRepository.save(branch);
    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.UPDATE_SUCCESS)
      .build();
  }

  async remove(id: number) {
    const branch = await this.getBranchById(id);
    if (!branch) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    await this.branchRepository.delete(id);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.DELETE_SUCCESS)
      .build();
  }

  private async getBranchById(id: number) {
    return this.branchRepository.findOne({
      where: {
        id,
      },
    });
  }

  private async getBranchByName(name: string) {
    return this.branchRepository.findOne({
      where: {
        name,
      },
    });
  }
}
