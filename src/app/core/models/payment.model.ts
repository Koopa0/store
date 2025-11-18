/**
 * 支付相關的資料模型
 * Payment-related data models
 *
 * 對應資料庫: payments, payment_methods
 * Database mapping: payments, payment_methods
 */

/**
 * 支付狀態
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * 支付方式類型
 * Payment method type
 */
export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cod',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  CRYPTOCURRENCY = 'cryptocurrency',
}

/**
 * 支付方式介面
 * Payment method interface
 */
export interface PaymentMethod {
  /** 支付方式 ID */
  id: number;
  /** 支付方式類型 */
  type: PaymentMethodType;
  /** 顯示名稱 */
  name: string;
  /** 圖示 */
  icon: string;
  /** 描述 */
  description: string;
  /** 是否啟用 */
  isActive: boolean;
  /** 處理費率（百分比）*/
  processingFeeRate: number;
  /** 最低手續費 */
  minimumFee: number;
  /** 最高手續費 */
  maximumFee?: number;
  /** Mock 處理延遲（毫秒）*/
  mockDelay?: number;
}

/**
 * 支付記錄介面
 * Payment record interface
 *
 * 對應資料表: payments
 * Database table: payments
 */
export interface Payment {
  /** 支付 ID (UUID) */
  id: string;
  /** 訂單 ID */
  orderId: string;
  /** 支付方式 ID */
  paymentMethodId: number;
  /** 支付狀態 */
  status: PaymentStatus;
  /** 支付金額 */
  amount: number;
  /** 幣別 */
  currency: string;
  /** 交易 ID（第三方支付提供的）*/
  transactionId?: string;
  /** 授權碼 */
  authorizationCode?: string;
  /** 處理費用 */
  processingFee: number;
  /** 支付時間 */
  paidAt?: Date;
  /** 失敗原因 */
  failureReason?: string;
  /** 退款金額 */
  refundedAmount?: number;
  /** 退款時間 */
  refundedAt?: Date;
  /** 額外資料（JSON）*/
  metadata?: Record<string, any>;
  /** 版本號 */
  version: number;
  /** 建立時間 */
  createdAt: Date;
  /** 更新時間 */
  updatedAt: Date;
}

/**
 * 支付請求
 * Payment request
 */
export interface PaymentRequest {
  /** 訂單 ID */
  orderId: string;
  /** 支付方式 ID */
  paymentMethodId: number;
  /** 支付金額 */
  amount: number;
  /** 幣別 */
  currency?: string;
  /** 回調 URL（真實支付用）*/
  callbackUrl?: string;
  /** 額外資料 */
  metadata?: Record<string, any>;
}

/**
 * 支付結果
 * Payment result
 */
export interface PaymentResult {
  /** 是否成功 */
  success: boolean;
  /** 支付 ID */
  paymentId: string;
  /** 支付狀態 */
  status: PaymentStatus;
  /** 交易 ID */
  transactionId?: string;
  /** 授權碼 */
  authorizationCode?: string;
  /** 支付時間 */
  paidAt?: Date;
  /** 錯誤訊息 */
  errorMessage?: string;
  /** 錯誤代碼 */
  errorCode?: string;
  /** 額外資料 */
  metadata?: Record<string, any>;
}

/**
 * Mock 支付配置
 * Mock payment configuration
 */
export interface MockPaymentConfig {
  /** 成功率（0-1）*/
  successRate: number;
  /** 處理延遲（毫秒）*/
  processingDelay: number;
  /** 是否模擬網路延遲 */
  simulateNetworkDelay: boolean;
  /** 最小延遲 */
  minDelay: number;
  /** 最大延遲 */
  maxDelay: number;
}

/**
 * 退款請求
 * Refund request
 */
export interface RefundRequest {
  /** 支付 ID */
  paymentId: string;
  /** 退款金額 */
  amount: number;
  /** 退款原因 */
  reason: string;
}

/**
 * 退款結果
 * Refund result
 */
export interface RefundResult {
  /** 是否成功 */
  success: boolean;
  /** 退款 ID */
  refundId: string;
  /** 退款金額 */
  refundedAmount: number;
  /** 退款時間 */
  refundedAt: Date;
  /** 錯誤訊息 */
  errorMessage?: string;
}
