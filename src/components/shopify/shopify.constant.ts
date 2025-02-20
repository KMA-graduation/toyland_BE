export interface CustomerAddress {
  id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
  name: string;
  province_code: string | null;
  country_code: string;
  country_name: string;
  default: boolean;
}

export interface EmailMarketingConsent {
  state: string;
  opt_in_level: string;
  consent_updated_at: string | null;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  state: string;
  total_spent: string;
  last_order_id: number;
  note: string | null;
  verified_email: boolean;
  multipass_identifier: string | null;
  tax_exempt: boolean;
  tags: string;
  last_order_name: string;
  currency: string;
  phone: string | null;
  addresses: CustomerAddress[];
  tax_exemptions: any[];
  email_marketing_consent: EmailMarketingConsent;
  sms_marketing_consent: null;
  admin_graphql_api_id: string;
  default_address: Address;
}

export interface ShopifyOrder {
  id: number;
  admin_graphql_api_id: string;
  app_id: number;
  browser_ip: string;
  buyer_accepts_marketing: boolean;
  cancel_reason: string | null;
  cancelled_at: string | null;
  cart_token: string | null;
  checkout_id: number;
  checkout_token: string;
  client_details: {
    accept_language: string | null;
    browser_height: number | null;
    browser_ip: string;
    browser_width: number | null;
    session_hash: string | null;
    user_agent: string;
  };
  closed_at: string | null;
  company: string | null;
  confirmation_number: string;
  confirmed: boolean;
  contact_email: string;
  created_at: string;
  currency: string;
  current_subtotal_price: string;
  current_subtotal_price_set: PriceSet;
  current_total_additional_fees_set: null;
  current_total_discounts: string;
  current_total_discounts_set: PriceSet;
  current_total_duties_set: null;
  current_total_price: string;
  current_total_price_set: PriceSet;
  current_total_tax: string;
  current_total_tax_set: PriceSet;
  customer_locale: string;
  device_id: string | null;
  discount_codes: any[];
  duties_included: boolean;
  email: string;
  estimated_taxes: boolean;
  status: string;
  financial_status: string;
  fulfillment_status: string | null;
  landing_site: string | null;
  landing_site_ref: string | null;
  location_id: string | null;
  merchant_business_entity_id: string;
  name: string;
  number: number;
  order_number: number;
  order_status_url: string;
  payment_gateway_names: string[];
  phone: string | null;
  presentment_currency: string;
  processed_at: string;
  reference: string;
  source_name: string;
  subtotal_price: string;
  subtotal_price_set: PriceSet;
  tags: string;
  tax_exempt: boolean;
  tax_lines: TaxLine[];
  taxes_included: boolean;
  test: boolean;
  token: string;
  total_discounts: string;
  total_discounts_set: PriceSet;
  total_line_items_price: string;
  total_line_items_price_set: PriceSet;
  total_outstanding: string;
  total_price: string;
  total_price_set: PriceSet;
  total_shipping_price_set: PriceSet;
  total_tax: string;
  total_tax_set: PriceSet;
  total_tip_received: string;
  total_weight: number;
  updated_at: string;
  user_id: number;
  billing_address: Address;
  customer: Customer;
  discount_applications: any[];
  fulfillments: any[];
  line_items: LineItem[];
  payment_terms: PaymentTerms;
  refunds: any[];
  shipping_address: Address;
  shipping_lines: ShippingLine[];
}

interface PriceSet {
  shop_money: Money;
  presentment_money: Money;
}

interface Money {
  amount: string;
  currency_code: string;
}

interface TaxLine {
  price: string;
  rate: number;
  title: string;
  price_set: PriceSet;
  channel_liable: boolean;
}

interface Address {
  first_name: string;
  address1: string;
  phone: string | null;
  city: string;
  zip: string | null;
  province: string | null;
  country: string;
  last_name: string;
  address2: string | null;
  company: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string;
  country_code: string;
  province_code: string | null;
}

interface Customer {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  state: string;
  note: string | null;
  verified_email: boolean;
  multipass_identifier: string | null;
  tax_exempt: boolean;
  phone: string | null;
  email_marketing_consent: {
    state: string;
    opt_in_level: string;
    consent_updated_at: string;
  };
  sms_marketing_consent: null;
  tags: string;
  currency: string;
  tax_exemptions: any[];
  admin_graphql_api_id: string;
  default_address: Address;
}

interface LineItem {
  id: number;
  admin_graphql_api_id: string;
  attributed_staffs: any[];
  current_quantity: number;
  fulfillable_quantity: number;
  fulfillment_service: string;
  fulfillment_status: string | null;
  gift_card: boolean;
  grams: number;
  name: string;
  price: string;
  price_set: PriceSet;
  product_exists: boolean;
  product_id: number;
  properties: any[];
  quantity: number;
  requires_shipping: boolean;
  sku: string;
  taxable: boolean;
  title: string;
  total_discount: string;
  total_discount_set: PriceSet;
  variant_id: number;
  variant_inventory_management: string;
  variant_title: string | null;
  vendor: string;
  tax_lines: TaxLine[];
  duties: any[];
  discount_allocations: any[];
}

interface PaymentTerms {
  id: number;
  created_at: string;
  due_in_days: number | null;
  payment_schedules: any[];
  payment_terms_name: string;
  payment_terms_type: string;
  updated_at: string;
}

interface ShippingLine {
  id: number;
  carrier_identifier: string | null;
  code: string;
  discounted_price: string;
  discounted_price_set: PriceSet;
  is_removed: boolean;
  phone: string | null;
  price: string;
  price_set: PriceSet;
  requested_fulfillment_service_id: string | null;
  source: string;
  title: string;
  tax_lines: any[];
  discount_allocations: any[];
}

export type ShoppifyFinancialStatus = {
  authorized: 'authorized';
  pending: 'pending';
  paid: 'paid';
  partially_paid: 'partially_paid';
  refunded: 'refunded';
  voided: 'voided';
  partially_refunded: 'partially_refunded';
  any: 'any';
  unpaid: 'unpaid';
};

export type ShoppifyFulfillmentStatus = {
  shipped: 'shipped';
  partial: 'partial';
  unshipped: 'unshipped';
  any: 'any';
  unfulfilled: 'unfulfilled';
};

export type ShopifyOrderStatus = {
  open: 'open';
  closed: 'closed';
  cancelled: 'cancelled';
  any: 'any';
};
