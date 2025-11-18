/**
 * 購物車相關的資料模型
 * Cart-related data models
 *
 * 對應資料庫: shopping_carts, cart_items
 * Database mapping: shopping_carts, cart_items
 */

/**
 * 購物車項目介面
 * Cart item interface
 *
 * 對應資料表: cart_items
 * Database table: cart_items
 */
export interface CartItem {
  /** 購物車項目 ID (UUID) */
  id: string;
  /** 購物車 ID / Cart ID */
  cartId: string;
  /** 商品 ID / Product ID */
  productId: string;
  /** 變體 ID / Variant ID */
  variantId?: string;
  /** 數量 / Quantity */
  quantity: number;
  /** 單價（加入時的價格快照）/ Unit price (price snapshot when added) */
  unitPrice: number;
  /** 小計（自動計算）/ Subtotal (auto-calculated) */
  subtotal: number;
  /** 是否儲存以供稍後使用 / Is saved for later */
  isSavedForLater: boolean;
  /** 版本號 / Version number */
  version: number;
  /** 加入時間 / Added timestamp */
  addedAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
}

/**
 * 購物車介面
 * Shopping cart interface
 *
 * 對應資料表: shopping_carts
 * Database table: shopping_carts
 */
export interface ShoppingCart {
  /** 購物車 ID (UUID) */
  id: string;
  /** 用戶 ID（登入用戶）/ User ID (for logged-in users) */
  userId?: string;
  /** 會話 ID（未登入用戶）/ Session ID (for guest users) */
  sessionId?: string;
  /** 是否啟用 / Is active */
  isActive: boolean;
  /** 過期時間 / Expires at */
  expiresAt?: Date;
  /** 版本號 / Version number */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
}

/**
 * 購物車項目詳情（包含商品資訊）
 * Cart item detail (with product information)
 *
 * 用於購物車頁面顯示
 * Used for cart page display
 */
export interface CartItemDetail extends CartItem {
  /** 商品名稱 / Product name */
  productName: string;
  /** 商品圖片 URL / Product image URL */
  productImageUrl?: string;
  /** 商品 SKU / Product SKU */
  productSku: string;
  /** 變體屬性（如果有）/ Variant attributes (if any) */
  variantAttributes?: Record<string, any>;
  /** 目前價格（用於比較是否變價）/ Current price (for price change comparison) */
  currentPrice: number;
  /** 庫存數量 / Stock quantity */
  stockQuantity: number;
  /** 是否有庫存 / Is in stock */
  isInStock: boolean;
  /** 是否啟用 / Is active */
  isActive: boolean;
}

/**
 * 購物車摘要
 * Cart summary
 *
 * 對應函數: calculate_cart_total
 * Database function: calculate_cart_total
 */
export interface CartSummary {
  /** 項目數量 / Items count */
  itemsCount: number;
  /** 小計 / Subtotal */
  subtotal: number;
  /** 預估稅額 / Estimated tax */
  estimatedTax: number;
  /** 預估運費 / Estimated shipping */
  estimatedShipping: number;
  /** 預估總額 / Estimated total */
  estimatedTotal: number;
  /** 折扣金額（如果有促銷碼）/ Discount amount (if promotion code applied) */
  discountAmount?: number;
}

/**
 * 購物車完整資訊（包含項目和摘要）
 * Complete cart information (with items and summary)
 */
export interface CartDetail {
  /** 購物車 / Shopping cart */
  cart: ShoppingCart;
  /** 購物車項目（活躍的，非"稍後使用"）/ Cart items (active, not "saved for later") */
  items: CartItemDetail[];
  /** 稍後使用的項目 / Saved for later items */
  savedForLaterItems: CartItemDetail[];
  /** 購物車摘要 / Cart summary */
  summary: CartSummary;
}

/**
 * 加入購物車請求
 * Add to cart request
 */
export interface AddToCartRequest {
  /** 商品 ID / Product ID */
  productId: string;
  /** 變體 ID（如果有）/ Variant ID (if any) */
  variantId?: string;
  /** 數量 / Quantity */
  quantity: number;
}

/**
 * 更新購物車項目請求
 * Update cart item request
 */
export interface UpdateCartItemRequest {
  /** 購物車項目 ID / Cart item ID */
  cartItemId: string;
  /** 數量 / Quantity */
  quantity: number;
}

/**
 * 應用促銷碼請求
 * Apply promotion code request
 */
export interface ApplyPromotionCodeRequest {
  /** 促銷碼 / Promotion code */
  code: string;
}

/**
 * 促銷碼驗證回應
 * Promotion code validation response
 */
export interface PromotionCodeValidation {
  /** 是否有效 / Is valid */
  isValid: boolean;
  /** 促銷碼 / Code */
  code: string;
  /** 折扣類型 / Discount type */
  discountType?: 'percentage' | 'fixed';
  /** 折扣值 / Discount value */
  discountValue?: number;
  /** 折扣金額 / Discount amount */
  discountAmount?: number;
  /** 最低消費要求 / Minimum purchase requirement */
  minimumPurchase?: number;
  /** 錯誤訊息（如果無效）/ Error message (if invalid) */
  errorMessage?: string;
}
