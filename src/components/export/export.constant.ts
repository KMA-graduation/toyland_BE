export const EXCEL_STYLE = {
  SHEET_FONT: {
    size: 13,
    color: { argb: '000000' },
    bold: false,
    name: 'Times New Roman',
  },
  TOTAL_FONT: {
    color: { argb: 'FF0000' },
    size: 13,
    bold: true,
  },
  TITLE_FONT_18: {
    size: 18,
    bold: true,
    name: 'Times New Roman',
  },
  TITLE_FONT: {
    size: 13,
    bold: true,
    name: 'Times New Roman',
  },
  DEFAULT_FONT: {
    size: 12,
    bold: false,
    name: 'Times New Roman',
  },
  HEADER_FILL: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'c0c0c0' },
  },
  HIGHT_LIGHT: {
    color: { argb: 'FF0000' },
    name: 'Times New Roman',
    size: 13,
  },
  ALIGN_CENTER: {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true,
  },
  ALIGN_LEFT_MIDDLE: {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: true,
  },
  ALIGN_LEFT_MIDDLE_NO_WRAP: {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: false,
  },
  ALIGN_RIGHT_MIDDLE: {
    vertical: 'middle',
    horizontal: 'right',
    wrapText: true,
  },
  ALIGN_BOTTOM: {
    vertical: 'bottom',
    horizontal: 'center',
    wrapText: true,
  },
  BORDER_ALL: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  },
  DDMMYYYYHHMMSS: 'dd-mm-yyyy HH:MM:SS',
};

export const ROW = {
  COUNT_START_ROW: 1,
  COUNT_END_ROW: 1001,
  LIMIT_EXPORT: 10000,
  LIMIT_EXPORT_ON_SHEET: 1000,
};

export const COLUMN_FORMAT = {
  DATE: 'dd/mm/yyyy',
  DATE_SHORT: 'dd/mmm/yyyy', // 01/Jan/2021
  DATE_TO_DATE_FROM: 'dd/mm/yyyy - dd/mm/yyyy',
  NUMBER: '#,##0', // 1,000,000,
  NUMBER_5_FIXED: '#,##0.#####', // 1,123,456.89012
};
export const SHEET = {
  START_SHEET: 1,
  NAME: 'Sheet',
};

export enum ExportTypeEnum {
  ONE_SHEET = 1,
  MULTI_SHEET = 2,
}

export enum TypeEnum {
  INVOICE = 1,
  DASHBOARD = 2,
}

export const MAX_NUMBER_PAGE = 100;

export const INVOICE_HEADERS = {
  sheet: 'Danh sách hóa đơn',
  title: 'DANH SÁCH HÓA ĐƠN',
  headerOne: {
    1: 'Mã hóa đơn',
    2: 'Tên khách hàng',
    3: 'Người nhận',
    4: 'Địa chỉ',
    5: 'Số điện thoại',
    6: 'Ghi chú',
    7: 'Hình thức thanh toán',
    8: 'Tổng tiền',
    9: 'Tổng số lượng',
    10: 'Sản phẩm',
    11: '',
    12: '',
    13: '',
  },
  headers: {
    invoiceCode: 'Mã hóa đơn',
    userName: 'Tên khách hàng',
    receiver: 'Người nhận',
    address: 'Địa chỉ',
    phone: 'Số điện thoại',
    note: 'Ghi chú',
    paymentType: 'Hình thức thanh toán',
    totalPrice: 'Tổng tiền',
    totalAmount: 'Tổng số lượng',
    productCode: 'Mã sản phẩm',
    productName: 'Tên sản phẩm',
    price: 'Đơn giá',
    amount: 'Số lượng',
  },
};
