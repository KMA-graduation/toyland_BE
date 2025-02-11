import { Controller, Get, Query } from '@nestjs/common';
import { ExportRequestDto } from './dto/export.request.dto';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('/')
  public async export(@Query() request: ExportRequestDto): Promise<any> {
    return await this.exportService.export(request);
  }
}
