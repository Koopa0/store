/**
 * 訂單相關的資料模型
 * Order-related data models
 *
 * 對應資料庫: orders, order_items, order_statuses
 * Database mapping: orders, order_items, order_statuses
 */

/**
 * 訂單狀態枚舉
 * Order status enumeration
 *
 * 對應資料表: order_statuses
 * Database table: order_statuses
 */
export enum OrderStatus {
  /** 草稿 / Draft */
  DRAFT = 'draft',
  /** 待付款 / Pending payment */
  PENDING = 'pending',
  /** 已付款 / Paid */
  PAID = 'paid',
  /** 已確認 / Confirmed */
  CONFIRMED = 'confirmed',
  /** 處理中 / Processing */
  PROCESSING = 'processing',
  /** 已發貨 / Shipped */
  SHIPPED = 'shipped',
  /** 已送達 / Delivered */
  DELIVERED = 'delivered',
  /** 已完成 / Completed */
  COMPLETED = 'completed',
  /** 已取消 / Cancelled */
  CANCELLED = 'cancelled',
  /** 退款中 / Refunding */
  REFUNDING = 'refunding',
  /** 已退款 / Refunded */
  REFUNDED = 'refunded',
}

/**
 * 訂單地址介面（用於快照）
 * Order address interface (for snapshot)
 */
export interface OrderAddress {
  /** 收件人姓名 / Recipient name */
  recipientName: string;
  /** 收件人電話 / Recipient phone */
  recipientPhone: string;
  /** 國家代碼 / Country code */
  countryCode: string;
  /** 郵遞區號 / Postal code */
  postalCode: string;
  /** 州/省 / State/Province */
  stateProvince?: string;
  /** 城市 / City */
  city: string;
  /** 區 / District */
  district?: string;
  /** 街道地址 / Street address */
  streetAddress: string;
  /** 大樓/樓層 / Building/Floor */
  buildingFloor?: string;
}

/**
 * 訂單項目介面
 * Order item interface
 *
 * 對應資料表: order_items
 * Database table: order_items
 */
export interface OrderItem {
  /** 訂單項目 ID (UUID) */
  id: string;
  /** 訂單 ID / Order ID */
  orderId: string;
  /** 商品 ID / Product ID */
  productId: string;
  /** 變體 ID / Variant ID */
  variantId?: string;
  /** 商品快照（JSON）/ Product snapshot (JSON) */
  productSnapshot: {
    name: string;
    sku: string;
    imageUrl?: string;
    attributes?: Record<string, any>;
  };
  /** 數量 / Quantity */
  quantity: number;
  /** 單價 / Unit price */
  unitPrice: number;
  /** 小計（自動計算）/ Subtotal (auto-calculated) */
  subtotal: number;
  /** 折扣金額 / Discount amount */
  discountAmount: number;
  /** 最終金額（自動計算）/ Final amount (auto-calculated) */
  finalAmount: number;
  /** 單位成本（用於利潤計算）/ Unit cost (for profit calculation) */
  unitCost?: number;
  /** 利潤金額（自動計算）/ Profit amount (auto-calculated) */
  profitAmount?: number;
  /** 是否已發貨 / Is shipped */
  isShipped: boolean;
  /** 是否已退貨 / Is returned */
  isReturned: boolean;
  /** 版本號 / Version number */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 發貨時間 / Shipped timestamp */
  shippedAt?: Date;
  /** 退貨時間 / Returned timestamp */
  returnedAt?: Date;
}

/**
 * 訂單介面
 * Order interface
 *
 * 對應資料表: orders
 * Database table: orders
 */
export interface Order {
  /** 訂單 ID (UUID) */
  id: string;
  /** 訂單編號 / Order number */
  orderNumber: string;
  /** 用戶 ID / User ID */
  userId: string;
  /** 訂單狀態 / Order status */
  status: OrderStatus;
  /** 小計 / Subtotal */
  subtotal: number;
  /** 運費 / Shipping fee */
  shippingFee: number;
  /** 稅額 / Tax amount */
  taxAmount: number;
  /** 折扣金額 / Discount amount */
  discountAmount: number;
  /** 總金額（自動計算）/ Total amount (auto-calculated) */
  totalAmount: number;
  /** 貨幣代碼 / Currency code */
  currencyCode: string;
  /** 匯率 / Exchange rate */
  exchangeRate: number;
  /** 配送地址（快照）/ Shipping address (snapshot) */
  shippingAddress: OrderAddress;
  /** 帳單地址（快照）/ Billing address (snapshot) */
  billingAddress?: OrderAddress;
  /** 促銷代碼 / Promotion codes */
  promotionCodes: string[];
  /** 促銷折扣 / Promotion discount */
  promotionDiscount: number;
  /** 客戶備註 / Customer note */
  customerNote?: string;
  /** 內部備註 / Internal note */
  internalNote?: string;
  /** 版本號 / Version number */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
  /** 確認時間 / Confirmed timestamp */
  confirmedAt?: Date;
  /** 付款時間 / Paid timestamp */
  paidAt?: Date;
  /** 發貨時間 / Shipped timestamp */
  shippedAt?: Date;
  /** 送達時間 / Delivered timestamp */
  deliveredAt?: Date;
  /** 完成時間 / Completed timestamp */
  completedAt?: Date;
  /** 取消時間 / Cancelled timestamp */
  cancelledAt?: Date;
  /** 退款時間 / Refunded timestamp */
  refundedAt?: Date;
}

/**
 * 訂單完整資訊（包含項目）
 * Complete order information (with items)
 */
export interface OrderDetail extends Order {
  /** 訂單項目 / Order items */
  items: OrderItem[];
}

/**
 * 建立訂單請求
 * Create order request
 */
export interface CreateOrderRequest {
  /** 購物車 ID / Cart ID */
  cartId?: string;
  /** 配送地址 ID / Shipping address ID */
  shippingAddressId: string;
  /** 帳單地址 ID（可選，預設使用配送地址）/ Billing address ID (optional, defaults to shipping address) */
  billingAddressId?: string;
  /** 支付方式 ID / Payment method ID */
  paymentMethodId: number;
  /** 促銷代碼 / Promotion codes */
  promotionCodes?: string[];
  /** 客戶備註 / Customer note */
  customerNote?: string;
}
