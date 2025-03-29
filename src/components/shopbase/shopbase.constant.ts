export interface DraftOrdersResponse {
  draft_orders: DraftOrder[];
}

export interface DraftOrder {
  access_key: string;
  additional_information: AdditionalInformation;
  applied_discount: AppliedDiscount;
  balance: number;
  billing_address: Address;
  buyer_accepts_marketing: boolean;
  cancel_reason: string;
  cancelled_at: string;
  cart_token: string;
  chargeback_amount: number;
  chargeback_deadline_at: string;
  chargeback_dispute_id: string;
  chargeback_status: string;
  checkout_token: string;
  client_details: ClientDetails;
  closed_at: string;
  created_at: string;
  created_at_in_timezone: string;
  currency: string;
  customer_locale: string;
  discount_applications: DiscountApplication[];
  discount_code: DiscountCode[];
  email: string;
  financial_status: string;
  fulfillment_status: string;
  fulfillments: Fulfillment[];
  id: number;
  is_in_post_purchase: boolean;
  is_risk: boolean;
  line_items: LineItem[];
  name: string;
  not_explicit_discount: number;
  note: string;
  note_attributes: any[];
  order_number: number;
  order_status_url: string;
  original_total_price: number;
  payment_gateway: string;
  payment_gateway_names: string[];
  phone: string;
  post_purchase_timeout_at: string;
  previous_shipping_fee: number;
  processed_at: string;
  referring_site: string;
  refunds: Refund[];
  shipping_address: Address;
  shipping_discount: number;
  shipping_fee: number;
  shipping_lines: ShippingLine[];
  shipping_tax: number;
  shop_id: number;
  source_name: string;
  subtotal_price: number;
  tags: string;
  tax_lines: TaxLine[];
  taxes_included: boolean;
  token: string;
  total_discounts: number;
  total_line_items_discount: number;
  total_line_items_price: number;
  total_price: number;
  total_quantity: number;
  total_shipping: number;
  total_tax: number;
  total_tip_received: number;
  total_weight: number;
  updated_at: string;
  weight_unit: string;
}

export interface AdditionalInformation {
  ASN: number;
  IPS: string;
  city: string;
  country: string;
  hostname: string;
  latitude: string;
  longitude: string;
  organization: string;
  region: string;
  timezone: string;
}

export interface AppliedDiscount {
  amount: string;
  description: string;
  title: string;
  value: string;
  value_type: string;
}

export interface Address {
  address1: string;
  address2: string;
  city: string;
  company: string;
  country: string;
  country_code: string;
  country_id: number;
  country_name: string;
  cpf_number: string;
  cpf_or_cnpj_number: string;
  created_at: string;
  default: boolean;
  first_name: string;
  id: number;
  last_name: string;
  latitude: number;
  longitude: number;
  name: string;
  phone: string;
  province: string;
  province_code: string;
  updated_at: string;
  zip: string;
}

export interface ClientDetails {
  accept_language: string;
  browser_height: number;
  browser_ip: string;
  browser_width: number;
  session_hash: string;
  user_agent: string;
}

export interface DiscountApplication {
  allocation_method: string;
  code: string;
  description: string;
  discount_type: string;
  is_applied_entire_order: boolean;
  target_selection: string;
  target_type: string;
  title: string;
  type: string;
  value: number;
  value_type: string;
}

export interface DiscountCode {
  amount: number;
  code: string;
  discount_type: string;
  price_rule_id: number;
  price_rule_type: string;
  scope: string;
  type: string;
}

export interface Fulfillment {
  claim_id: number;
  created_at: number;
  date_done: number;
  detected_tracking_company: string;
  first_tracking_step_at: number;
  id: number;
  last_crawled_at: number;
  last_mile_tracking_company: string;
  last_mile_tracking_number: string;
  last_tracking_step_at: number;
  name: string;
  notify_customer: boolean;
  order_id: number;
  send_delay_mail: boolean;
  service: string;
  shipment_status: string;
  status: string;
  tracking_company: string;
  tracking_number: string;
  tracking_numbers: string[];
  tracking_steps: Record<string, any>;
  tracking_url: string;
  tracking_urls: string[];
  updated_at: number;
  variant_inventory_management: string;
}

export interface DiscountAllocation {
  amount: number;
  discount_application_index: number;
}

export interface ShippingRate {
  code: string;
  id: number;
  is_post_purchase: boolean;
  price: number;
  title: string;
  type: string;
  variant_id: number;
}

export interface TaxLine {
  price: number;
  rate: number;
  title: string;
}

export interface LineItem {
  discount_allocations: DiscountAllocation[];
  discount_amount: number;
  fulfillable_quantity: number;
  fulfillment_service: string;
  fulfillment_status: string;
  gift_card: boolean;
  image_src: string;
  is_post_purchase_item: boolean;
  item_discount_price: number;
  line_item_discount_amount: number;
  line_item_discount_price: number;
  line_item_price: number;
  line_item_price_after_discount: number;
  line_item_price_before_discount: number;
  line_item_price_with_explicit_discount: number;
  line_item_weight: number;
  name: string;
  not_explicit_discount_price: number;
  order_id: number;
  price: number;
  product_id: number;
  product_is_deleted: boolean;
  product_type: string;
  properties: any[];
  quantity: number;
  raw_price: number;
  raw_weight: number;
  requires_shipping: boolean;
  shipping_rate: ShippingRate;
  sku: string;
  tags: string;
  tax_amount: number;
  tax_lines: TaxLine[];
  tax_rate: number;
  taxable: boolean;
  tip_payment_gateway: string;
  tip_payment_method: string;
  title: string;
  total_discount: number;
  total_item_discount_price: number;
  total_line_with_discount_price: number;
  total_tax_amount: number;
  variant_id: number;
  variant_title: string;
  vendor: string;
  weight: number;
  weight_unit: string;
}

export interface OrderAdjustment {
  amount: number;
  kind: string;
  order_id: number;
  reason: string;
  tax_amount: number;
}

export interface RefundLineItem {
  discount_amount: number;
  line_item: LineItem;
  line_item_id: number;
  quantity: number;
  restock_type: string;
  subtotal: number;
  title: string;
  total_refund: number;
  total_tax: number;
  variant_title: string;
}

export interface RefundShipping {
  amount: number;
  full_refund: boolean;
}

export interface Transaction {
  amount: number;
  authorization: string;
  conversion_rate: number;
  created_at: number;
  currency: string;
  currency_exchange_adjustment: string;
  error_code: string;
  gateway: string;
  id: number;
  kind: string;
  message: string;
  order_id: number;
  parent_id: number;
  payment_details: string;
  processed_at: number;
  receipt: string;
  source_name: string;
  status: string;
  test: boolean;
  transaction_amount: number;
  transaction_currency: string;
}

export interface Refund {
  created_at: number;
  id: number;
  is_dont_withdraw_from_balance_of_seller: boolean;
  note: string;
  order_adjustments: OrderAdjustment[];
  order_dto: Record<string, any>;
  order_id: number;
  payment_fee: number;
  processed_at: number;
  refund_line_items: RefundLineItem[];
  restock: boolean;
  shipping: RefundShipping;
  transactions: Transaction[];
  user_id: number;
}

export interface ShippingLine {
  carrier_identifier: string;
  code: string;
  discounted_price: number;
  fulfillment_service: string;
  price: number;
  source: string;
  tax_lines: TaxLine[];
  title: string;
}
