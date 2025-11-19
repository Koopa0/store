/**
 * 庫存交易模型
 * Inventory Transaction Model
 *
 * 記錄所有庫存變動，提供完整的庫存追蹤歷史
 * Records all inventory changes, providing complete inventory tracking history
 *
 * 教學重點 / Teaching Points:
 * 1. 庫存交易類型設計
 * 2. 雙向記錄（變更前/變更後）
 * 3. 參考類型關聯
 */

/**
 * 庫存交易類型
 * Inventory transaction type
 */
export type InventoryTransactionType = 'sale' | 'return' | 'adjustment' | 'initial';

/**
 * 參考類型
 * Reference type
 */
export type InventoryReferenceType = 'order' | 'manual' | 'system';

/**
 * 庫存交易
 * Inventory Transaction
 */
export interface InventoryTransaction {
  /** 交易 ID */
  id: string;

  /** 商品 ID */
  productId: string;

  /** 商品名稱（冗餘欄位，方便查詢） */
  productName: string;

  /** 商品 SKU（冗餘欄位） */
  productSku: string;

  /** 變體 ID（可選） */
  variantId?: string;

  /** 變體屬性（可選，冗餘欄位） */
  variantAttributes?: Record<string, string>;

  /** 交易類型 */
  type: InventoryTransactionType;

  /** 數量變更（正數=增加，負數=減少） */
  quantityChange: number;

  /** 變更前數量 */
  beforeQuantity: number;

  /** 變更後數量 */
  afterQuantity: number;

  /** 參考類型 */
  referenceType: InventoryReferenceType;

  /** 參考 ID（訂單 ID、調整單 ID 等） */
  referenceId: string;

  /** 參考編號（訂單編號等，方便查詢） */
  referenceNumber?: string;

  /** 備註 */
  note: string;

  /** 創建者 ID */
  createdBy: string;

  /** 創建者名稱（冗餘欄位） */
  createdByName: string;

  /** 創建時間 */
  createdAt: Date;

  /** 版本號（樂觀鎖） */
  version: number;
}

/**
 * 庫存交易詳情
 * Inventory Transaction Detail
 *
 * 用於顯示，包含額外的計算欄位
 */
export interface InventoryTransactionDetail extends InventoryTransaction {
  /** 交易類型顯示名稱 */
  typeDisplayName: string;

  /** 參考類型顯示名稱 */
  referenceTypeDisplayName: string;

  /** 數量變更顯示（帶符號） */
  quantityChangeDisplay: string;
}

/**
 * 創建庫存交易請求
 * Create Inventory Transaction Request
 */
export interface CreateInventoryTransactionRequest {
  /** 商品 ID */
  productId: string;

  /** 變體 ID（可選） */
  variantId?: string;

  /** 交易類型 */
  type: InventoryTransactionType;

  /** 數量變更 */
  quantityChange: number;

  /** 參考類型 */
  referenceType: InventoryReferenceType;

  /** 參考 ID */
  referenceId: string;

  /** 參考編號 */
  referenceNumber?: string;

  /** 備註 */
  note: string;
}

/**
 * 庫存交易查詢參數
 * Inventory Transaction Query Parameters
 */
export interface InventoryTransactionQueryParams {
  /** 商品 ID 篩選 */
  productId?: string;

  /** 變體 ID 篩選 */
  variantId?: string;

  /** 交易類型篩選 */
  type?: InventoryTransactionType;

  /** 參考類型篩選 */
  referenceType?: InventoryReferenceType;

  /** 開始日期 */
  startDate?: Date;

  /** 結束日期 */
  endDate?: Date;

  /** 搜尋關鍵字（商品名稱、SKU、訂單編號等） */
  search?: string;

  /** 排序欄位 */
  sortBy?: 'createdAt' | 'quantityChange' | 'productName';

  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';

  /** 頁碼 */
  page?: number;

  /** 每頁筆數 */
  pageSize?: number;
}

/**
 * 庫存交易列表回應
 * Inventory Transaction List Response
 */
export interface InventoryTransactionListResponse {
  /** 交易列表 */
  transactions: InventoryTransactionDetail[];

  /** 總筆數 */
  total: number;

  /** 當前頁碼 */
  page: number;

  /** 每頁筆數 */
  pageSize: number;

  /** 總頁數 */
  totalPages: number;

  /** 是否有下一頁 */
  hasNext: boolean;
}

/**
 * 庫存統計
 * Inventory Statistics
 */
export interface InventoryStatistics {
  /** 商品 ID */
  productId: string;

  /** 變體 ID */
  variantId?: string;

  /** 當前庫存 */
  currentStock: number;

  /** 總銷售數量 */
  totalSales: number;

  /** 總退貨數量 */
  totalReturns: number;

  /** 總調整數量 */
  totalAdjustments: number;

  /** 最後交易時間 */
  lastTransactionAt?: Date;

  /** 統計期間開始時間 */
  periodStart: Date;

  /** 統計期間結束時間 */
  periodEnd: Date;
}

/**
 * 庫存交易輔助類別
 * Inventory Transaction Helper
 */
export class InventoryTransactionHelper {
  /**
   * 取得交易類型顯示名稱
   * Get transaction type display name
   */
  static getTypeDisplayName(type: InventoryTransactionType): string {
    const map: Record<InventoryTransactionType, string> = {
      sale: '銷售出庫',
      return: '退貨入庫',
      adjustment: '手動調整',
      initial: '期初建立',
    };
    return map[type] || type;
  }

  /**
   * 取得參考類型顯示名稱
   * Get reference type display name
   */
  static getReferenceTypeDisplayName(type: InventoryReferenceType): string {
    const map: Record<InventoryReferenceType, string> = {
      order: '訂單',
      manual: '手動',
      system: '系統',
    };
    return map[type] || type;
  }

  /**
   * 格式化數量變更顯示
   * Format quantity change display
   */
  static formatQuantityChange(change: number): string {
    if (change > 0) {
      return `+${change}`;
    }
    return `${change}`;
  }

  /**
   * 取得交易類型顏色
   * Get transaction type color
   */
  static getTypeColor(type: InventoryTransactionType): string {
    const colorMap: Record<InventoryTransactionType, string> = {
      sale: 'warn', // 紅色（減少）
      return: 'primary', // 藍色（增加）
      adjustment: 'accent', // 綠色（調整）
      initial: 'default', // 灰色（初始）
    };
    return colorMap[type] || 'default';
  }

  /**
   * 轉換為詳情格式
   * Convert to detail format
   */
  static toDetail(transaction: InventoryTransaction): InventoryTransactionDetail {
    return {
      ...transaction,
      typeDisplayName: this.getTypeDisplayName(transaction.type),
      referenceTypeDisplayName: this.getReferenceTypeDisplayName(
        transaction.referenceType
      ),
      quantityChangeDisplay: this.formatQuantityChange(transaction.quantityChange),
    };
  }

  /**
   * 判斷是否為庫存增加
   * Check if inventory is increasing
   */
  static isIncrease(transaction: InventoryTransaction): boolean {
    return transaction.quantityChange > 0;
  }

  /**
   * 判斷是否為庫存減少
   * Check if inventory is decreasing
   */
  static isDecrease(transaction: InventoryTransaction): boolean {
    return transaction.quantityChange < 0;
  }
}
