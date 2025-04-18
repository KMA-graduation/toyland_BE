export enum OrderStatus {
  IN_CART = 'in_cart',
  WAITING_CONFIRM = 'waiting_confirm',
  WAITING_PAYMENT = 'waiting_payment',
  CONFIRMED = 'confirmed',
  SHIPPING = 'shipping',
  RECEIVED = 'received',
  SUCCESS = 'success',
  REJECT = 'reject',
}

export enum OrderShopifyStatus {
  PAID = 'paid',
  PENDING = 'pending',
}

export enum IsMe {
  No,
  Yes,
}

export enum BankCodeEnum {
  '' = '', //Cổng thanh toán VNPAYQR
  VNPAYQR = 'VNPAYQR', // Thanh toán qua ứng dụng hỗ trợ VNPAYQR
  VNBANK = 'VNBANK', // Thanh toán qua ATM-Tài khoản ngân hàng nội địa
  INTCARD = 'INTCARD', // Thanh toán qua thẻ quốc tế
}
