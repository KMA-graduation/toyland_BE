import { Injectable } from '@nestjs/common';
import {
  Alignment,
  Borders,
  Fill,
  Font,
  Row,
  Workbook,
  Worksheet,
} from 'exceljs';

import { ResponseBuilder } from '@utils/response-builder';
import {
  EXCEL_STYLE,
  INVOICE_HEADERS,
  ROW,
  SHEET,
  TypeEnum,
} from './export.constant';
import { isEmpty } from 'lodash';
import * as moment from 'moment';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ExportRequestDto } from './dto/export.request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '@entities/product.entity';
import { Repository } from 'typeorm';
import { OrderEntity } from '@entities/order.entity';
import { OrderDetailEntity } from '@entities/order-detail.entity';
import { DiscountEntity } from '@entities/discount.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,

    @InjectRepository(OrderDetailEntity)
    private readonly orderDetailRepository: Repository<OrderDetailEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(DiscountEntity)
    private readonly discountRepository: Repository<DiscountEntity>,
  ) {}

  async export(request: ExportRequestDto): Promise<any> {
    const { queryIds, type } = request;
    if (!isEmpty(queryIds) && queryIds.length > ROW.LIMIT_EXPORT) {
      return new ResponseBuilder()
        .withMessage('error.LIMIT_EXPORT_ONE_SHEET_ERROR')
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .build();
    }

    let workbook;
    switch (type) {
      case TypeEnum.INVOICE:
        workbook = await this.exportInvoice(request);
        break;
      default:
        break;
    }
    if (workbook?.xlsx) {
      await workbook?.xlsx.writeFile('export.xlsx');
      const file = await workbook.xlsx.writeBuffer();
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage('error.SUCCESS')
        .withData(file)
        .build();
    } else {
      return workbook;
    }
  }

  private setTitleInvoice(worksheet: Worksheet) {
    const titleCell = worksheet.getCell('A1');

    titleCell.value = INVOICE_HEADERS.title;
    titleCell.font = <Font>EXCEL_STYLE.TITLE_FONT_18;
    titleCell.alignment = <Partial<Alignment>>(
      EXCEL_STYLE.ALIGN_LEFT_MIDDLE_NO_WRAP
    );
  }

  private setHeaderV2(row: any, headers: any) {
    row.values = headers.map((header) => header.title);

    row.eachCell(function (cell) {
      cell.font = EXCEL_STYLE.TITLE_FONT;
      cell.alignment = EXCEL_STYLE.ALIGN_CENTER;
      cell.border = EXCEL_STYLE.BORDER_ALL;
    });
  }

  async exportInvoice(request: ExportRequestDto) {
    const workbook = new Workbook();
    const sheetName = INVOICE_HEADERS.sheet;
    let worksheet = workbook.addWorksheet(sheetName);
    worksheet = workbook.getWorksheet(sheetName);

    const headerRowOne = worksheet.getRow(4);
    const headerRowTwo = worksheet.getRow(5);
    const headerOne = this.getHeaderOneInvoice();
    const headerTwo = this.getHeaderOneTwo();

    this.setTitleInvoice(worksheet);
    this.setHeaderV2(headerRowOne, headerOne);
    this.setHeaderV2(headerRowTwo, headerTwo);

    const margeRange = [
      'A4:A5',
      'B4:B5',
      'C4:C5',
      'D4:D5',
      'E4:E5',
      'F4:F5',
      'G4:G5',
      'H4:H5',
      'I4:I5',
      'J4:M4',
    ];

    margeRange.forEach((range) => {
      worksheet.mergeCells(range);
    });

    return workbook;
  }

  private getHeaderOneInvoice() {
    const headerMap = INVOICE_HEADERS.headerOne;
    const headerKeys = Object.keys(headerMap);

    const headers = headerKeys?.map((title: string) => {
      const style = {
        alignment: <Partial<Alignment>>EXCEL_STYLE.ALIGN_LEFT_MIDDLE,
      };

      return {
        key: title,
        width: 35,
        style,
        title: headerMap[title],
      };
    });

    return headers;
  }

  private getHeaderOneTwo() {
    const headerMap = INVOICE_HEADERS.headers;
    const headerKeys = Object.keys(headerMap);

    const headers = headerKeys?.map((title: string) => {
      const style = {
        alignment: <Partial<Alignment>>EXCEL_STYLE.ALIGN_LEFT_MIDDLE,
      };

      return {
        key: title,
        width: 35,
        style,
        title: headerMap[title],
      };
    });

    return headers;
  }

  async exportOneSheetUtil(
    type: number,
    data: any[],
    titles: any,
    headers: any,
    sheetName?: string,
  ) {
    const workbook = new Workbook();
    let countRowData = ROW.COUNT_START_ROW;
    let countSheet = SHEET.START_SHEET;
    let worksheet = sheetName
      ? workbook.addWorksheet(sheetName)
      : workbook.addWorksheet(SHEET.NAME + countSheet);
    sheetName = sheetName || SHEET.NAME + countSheet;
    worksheet = workbook.getWorksheet(sheetName);
    for (const element of data) {
      if (countRowData == ROW.COUNT_START_ROW) {
        await this.setHeader(type, titles, headers, worksheet);
      }
      worksheet
        .addRow({
          ...element,
        })
        .eachCell(function (cell) {
          cell.border = <Partial<Borders>>EXCEL_STYLE.BORDER_ALL;
          cell.font = <Font>EXCEL_STYLE.DEFAULT_FONT;
        });

      countRowData++;
      if (countRowData == ROW.COUNT_END_ROW) {
        countSheet++;
        countRowData = ROW.COUNT_START_ROW;
      }
    }
    return workbook;
  }

  async exportMultiSheetUtil(
    workbook: Workbook,
    items: any[],
    level: any,
    titleMap: any,
    headersMap: any,
    sheetName: string,
  ) {
    const countRowData = ROW.COUNT_START_ROW;

    for (let i = 0; i <= items.length; i++) {
      const item = items[i];
      let worksheet = sheetName
        ? workbook.getWorksheet(sheetName)
        : workbook.getWorksheet(SHEET.NAME + level);
      if (!worksheet) {
        worksheet = sheetName
          ? workbook.addWorksheet(sheetName)
          : workbook.addWorksheet(SHEET.NAME + level);

        if (countRowData == ROW.COUNT_START_ROW) {
          let titleRowCount = 1;
          const titles = titleMap.get(level);

          while (titleRowCount <= titles.length) {
            const titleRow = worksheet.getCell('A' + titleRowCount);
            titleRow.value = titles[titleRowCount - 1];
            titleRow.font = <Font>EXCEL_STYLE.TITLE_FONT;
            ++titleRowCount;
          }
          const headerRow = worksheet.getRow(titles.length + 2);
          headerRow.values = headersMap
            .get(level)
            .map((header) => header.title);
          headerRow.eachCell(function (cell) {
            cell.font = <Font>EXCEL_STYLE.TITLE_FONT;
            cell.alignment = <Partial<Alignment>>EXCEL_STYLE.ALIGN_CENTER;
            cell.border = <Partial<Borders>>EXCEL_STYLE.BORDER_ALL;
          });
        }
        worksheet.columns = headersMap.get(level);
      }

      worksheet
        .addRow({
          ...item,
        })
        .eachCell(function (cell) {
          cell.border = <Partial<Borders>>EXCEL_STYLE.BORDER_ALL;
          cell.font = <Font>EXCEL_STYLE.DEFAULT_FONT;
        });
      if (item?.subItem?.length > 0) {
        workbook = await this.exportMultiSheetUtil(
          workbook,
          item.subItem,
          level + 1,
          titleMap,
          headersMap,
          '',
        );
      }
    }

    return workbook;
  }

  private async setHeader(type, titles, headers, worksheet) {
    let titleRowCount = 1;
    if (titles) {
      for (const title of titles) {
        const titleRow = worksheet.getCell('A' + titleRowCount);
        titleRow.value = title;
        titleRow.font = <Font>EXCEL_STYLE.TITLE_FONT;
        ++titleRowCount;
      }
    }
    let headerRowCount = titleRowCount + 1;
    let headerRow;
    for (const headerItem of headers) {
      headerRow = worksheet.getRow(headerRowCount);
      headerRow.values = headerItem.map((header) => header.title);
      headerRow.eachCell(function (cell) {
        cell.font = <Font>EXCEL_STYLE.TITLE_FONT;
        cell.alignment = <Partial<Alignment>>EXCEL_STYLE.ALIGN_CENTER;
        cell.border = <Partial<Borders>>EXCEL_STYLE.BORDER_ALL;
      });
      ++headerRowCount;
    }
  }

  private formatDateExport(date: Date, format?: string) {
    const formatDate = format || 'DD/MM/YYYY';
    return date
      ? moment(new Date(date), formatDate)
          .utc()
          .utcOffset('+07:00')
          .format(formatDate)
      : '';
  }
}
