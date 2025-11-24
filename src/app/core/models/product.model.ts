/**
 * 商品相關的資料模型
 * Product-related data models
 *
 * 對應資料庫: products, categories, brands, product_variants, product_images
 * Database mapping: products, categories, brands, product_variants, product_images
 */

/**
 * 商品分類介面
 * Category interface
 *
 * 對應資料表: categories
 * Database table: categories
 */
export interface Category {
  /** 分類 ID (UUID) */
  id: string;
  /** 父分類 ID / Parent category ID */
  parentId?: string;
  /** 分類代碼 / Category code */
  code: string;
  /** 分類名稱 / Category name */
  name: string;
  /** URL slug */
  slug: string;
  /** 描述 / Description */
  description?: string;
  /** 圖片 URL / Image URL */
  imageUrl?: string;
  /** 層級路徑（ltree）/ Hierarchical path (ltree) */
  ltreePath: string;
  /** 層級（自動生成）/ Level (auto-generated) */
  level: number;
  /** 排序順序 / Sort order */
  sortOrder: number;
  /** 是否啟用 / Is active */
  isActive: boolean;
  /** SEO 標題 / SEO title */
  metaTitle?: string;
  /** SEO 描述 / SEO description */
  metaDescription?: string;
  /** SEO 關鍵字 / SEO keywords */
  metaKeywords?: string[];
  /** 版本號 / Version number */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
}

/**
 * 品牌介面
 * Brand interface
 *
 * 對應資料表: brands
 * Database table: brands
 */
export interface Brand {
  /** 品牌 ID (UUID) */
  id: string;
  /** 品牌代碼 / Brand code */
  code: string;
  /** 品牌名稱 / Brand name */
  name: string;
  /** URL slug */
  slug: string;
  /** Logo URL */
  logoUrl?: string;
  /** 描述 / Description */
  description?: string;
  /** 官網 URL / Website URL */
  websiteUrl?: string;
  /** 原產國（ISO 代碼）/ Country of origin (ISO code) */
  countryOfOrigin?: string;
  /** 成立年份 / Established year */
  establishedYear?: number;
  /** 是否啟用 / Is active */
  isActive: boolean;
  /** 是否為精選品牌 / Is featured */
  isFeatured: boolean;
  /** 版本號 / Version number */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
}

/**
 * 商品介面
 * Product interface
 *
 * 對應資料表: products
 * Database table: products
 */
export interface Product {
  /** 商品 ID (UUID) */
  id: string;
  /** 分類 ID / Category ID */
  categoryId: string;
  /** 品牌 ID / Brand ID */
  brandId?: string;
  /** SKU（庫存單位）/ Stock Keeping Unit */
  sku: string;
  /** 條碼 / Barcode */
  barcode?: string;
  /** 商品名稱 / Product name */
  name: string;
  /** URL slug */
  slug: string;
  /** 摘要 / Summary */
  summary?: string;
  /** 詳細描述 / Detailed description */
  description?: string;
  /** 價格 / Price */
  price: number;
  /** 比較價格（劃線價）/ Compare at price */
  comparePrice?: number;
  /** 成本 / Cost */
  cost?: number;
  /** 稅率（百分比）/ Tax rate (percentage) */
  taxRate: number;
  /** 是否含稅 / Is tax included */
  isTaxIncluded: boolean;
  /** 是否追蹤庫存 / Track inventory */
  trackInventory: boolean;
  /** 庫存數量 / Stock quantity */
  stockQuantity: number;
  /** 低庫存警示閾值 / Low stock threshold */
  lowStockThreshold: number;
  /** 允許缺貨預訂 / Allow backorder */
  allowBackorder: boolean;
  /** 重量（公克）/ Weight (grams) */
  weight?: number;
  /** 長度（公分）/ Length (cm) */
  length?: number;
  /** 寬度（公分）/ Width (cm) */
  width?: number;
  /** 高度（公分）/ Height (cm) */
  height?: number;
  /** 是否啟用 / Is active */
  isActive: boolean;
  /** 是否為精選商品 / Is featured */
  isFeatured: boolean;
  /** 是否為數位商品 / Is digital product */
  isDigital: boolean;
  /** 是否需要配送（自動生成）/ Requires shipping (auto-generated) */
  requiresShipping: boolean;
  /** SEO 標題 / SEO title */
  metaTitle?: string;
  /** SEO 描述 / SEO description */
  metaDescription?: string;
  /** 標籤 / Tags */
  tags: string[];
  /** 瀏覽次數 / View count */
  viewCount: number;
  /** 版本號 / Version number */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
  /** 發布時間 / Published timestamp */
  publishedAt?: Date;
  /** 停產時間 / Discontinued timestamp */
  discontinuedAt?: Date;
  /** 刪除時間（軟刪除）/ Deleted timestamp (soft delete) */
  deletedAt?: Date;
}

/**
 * 商品變體介面
 * Product variant interface
 *
 * 對應資料表: product_variants
 * Database table: product_variants
 */
export interface ProductVariant {
  /** 變體 ID (UUID) */
  id: string;
  /** 商品 ID / Product ID */
  productId: string;
  /** 變體 SKU / Variant SKU */
  variantSku: string;
  /** 變體條碼 / Variant barcode */
  variantBarcode?: string;
  /** 變體屬性（JSON）/ Variant attributes (JSON) */
  attributes: Record<string, any>;
  /** 變體名稱 / Variant name */
  variantName?: string;
  /** 價格覆蓋（若為 null 則使用主商品價格）/ Price override (null uses main product price) */
  priceOverride?: number;
  /** 庫存數量 / Stock quantity */
  stockQuantity: number;
  /** 是否啟用 / Is active */
  isActive: boolean;
  /** 版本號 / Version number */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
  /** 刪除時間（軟刪除）/ Deleted timestamp (soft delete) */
  deletedAt?: Date;
}

/**
 * 商品圖片介面
 * Product image interface
 *
 * 對應資料表: product_images
 * Database table: product_images
 */
export interface ProductImage {
  /** 圖片 ID (UUID) */
  id: string;
  /** 商品 ID / Product ID */
  productId: string;
  /** 變體 ID（可選）/ Variant ID (optional) */
  variantId?: string;
  /** 圖片 URL / Image URL */
  url: string;
  /** 縮圖 URL / Thumbnail URL */
  thumbnailUrl?: string;
  /** Alt 文字（用於 SEO 和無障礙）/ Alt text (for SEO and accessibility) */
  altText?: string;
  /** 排序順序 / Sort order */
  sortOrder: number;
  /** 是否為主圖 / Is primary image */
  isPrimary: boolean;
  /** 圖片寬度（像素）/ Image width (pixels) */
  width?: number;
  /** 圖片高度（像素）/ Image height (pixels) */
  height?: number;
  /** 檔案大小（位元組）/ File size (bytes) */
  fileSize?: number;
  /** MIME 類型 / MIME type */
  mimeType?: string;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
}

/**
 * 商品完整資訊（包含關聯資料）
 * Complete product information (with related data)
 *
 * 用於商品詳情頁面
 * Used for product detail pages
 */
export interface ProductDetail extends Product {
  /** 分類資訊 / Category information */
  category?: Category;
  /** 品牌資訊 / Brand information */
  brand?: Brand;
  /** 商品圖片 / Product images */
  images: ProductImage[];
  /** 商品變體 / Product variants */
  variants: ProductVariant[];
  /** 平均評分 / Average rating */
  averageRating?: number;
  /** 評論數量 / Review count */
  reviewCount?: number;
}

/**
 * 商品列表項目（用於列表頁面）
 * Product list item (for list pages)
 *
 * 對應物化視圖: mv_product_catalog
 * Database materialized view: mv_product_catalog
 */
export interface ProductListItem {
  /** 商品 ID (UUID) */
  id: string;
  /** SKU */
  sku: string;
  /** 商品名稱 / Product name */
  name: string;
  /** URL slug */
  slug: string;
  /** 摘要 / Summary */
  summary?: string;
  /** 價格 / Price */
  price: number;
  /** 比較價格 / Compare price */
  comparePrice?: number;
  /** 庫存數量 / Stock quantity */
  stockQuantity: number;
  /** 是否啟用 / Is active */
  isActive: boolean;
  /** 是否為精選商品 / Is featured */
  isFeatured: boolean;
  /** 分類名稱 / Category name */
  categoryName: string;
  /** 分類路徑 / Category path */
  categoryPath: string;
  /** 品牌名稱 / Brand name */
  brandName?: string;
  /** 平均評分 / Average rating */
  ratingAverage: number;
  /** 評論數量 / Review count */
  reviewCount: number;
  /** 總銷售量 / Total sold */
  totalSold: number;
  /** 總收入 / Total revenue */
  totalRevenue: number;
  /** 主圖 URL / Primary image URL */
  primaryImageUrl?: string;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
}

/**
 * 商品狀態枚舉
 * Product status enum
 */
export type ProductStatus = 'draft' | 'active' | 'archived';

/**
 * 簡化的商品分類
 * Simplified product category
 */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 商品列表查詢參數
 * Product list query parameters
 */
export interface ProductListParams {
  /** 頁碼 / Page number */
  page?: number;
  /** 每頁數量 / Items per page */
  limit?: number;
  /** 搜尋關鍵字 / Search keyword */
  search?: string;
  /** 分類 ID / Category ID */
  categoryId?: string;
  /** 分類 Slug / Category slug */
  categorySlug?: string;
  /** 品牌 ID / Brand ID */
  brandId?: string;
  /** 商品狀態 / Product status */
  status?: ProductStatus;
  /** 排序欄位 / Sort field */
  sortBy?: string;
  /** 排序方向 / Sort order */
  sortOrder?: 'asc' | 'desc';
  /** 最低價格 / Minimum price */
  minPrice?: number;
  /** 最高價格 / Maximum price */
  maxPrice?: number;
  /** 是否精選 / Is featured */
  isFeatured?: boolean;
  /** 標籤 / Tags */
  tags?: string[];
}

/**
 * 變體屬性類型
 * Variant attribute type
 */
export type VariantAttributeType = 'color' | 'size' | 'material' | 'style' | 'custom';

/**
 * 變體選項介面
 * Variant option interface
 *
 * 用於定義商品的可選屬性（如顏色、尺寸）
 * Used to define product optional attributes (like color, size)
 */
export interface VariantOption {
  /** 屬性名稱 / Attribute name */
  name: string;
  /** 屬性類型 / Attribute type */
  type: VariantAttributeType;
  /** 可選值 / Available values */
  values: VariantOptionValue[];
}

/**
 * 變體選項值介面
 * Variant option value interface
 */
export interface VariantOptionValue {
  /** 值 / Value */
  value: string;
  /** 顯示名稱 / Display name */
  displayName: string;
  /** 顏色代碼（用於顏色選項）/ Color code (for color options) */
  colorCode?: string;
  /** 圖片 URL（用於視覺化展示）/ Image URL (for visual display) */
  imageUrl?: string;
  /** 是否可用 / Is available */
  isAvailable: boolean;
  /** 額外價格 / Additional price */
  priceAdjustment?: number;
}

/**
 * 選擇的變體介面
 * Selected variant interface
 *
 * 用於在 UI 中追蹤用戶選擇的變體組合
 * Used to track user-selected variant combination in UI
 */
export interface SelectedVariant {
  /** 變體 ID（如果存在）/ Variant ID (if exists) */
  variantId?: string;
  /** 選擇的屬性 / Selected attributes */
  attributes: Record<string, string>;
  /** 最終價格 / Final price */
  price: number;
  /** 可用庫存 / Available stock */
  availableStock: number;
  /** SKU */
  sku?: string;
}

/**
 * 商品變體配置介面
 * Product variant configuration interface
 *
 * 用於商品詳情頁的變體選擇器
 * Used for variant selector in product detail page
 */
export interface ProductVariantConfig {
  /** 是否啟用變體 / Has variants enabled */
  hasVariants: boolean;
  /** 變體選項 / Variant options */
  options: VariantOption[];
  /** 所有變體 / All variants */
  variants: ProductVariant[];
  /** 預設選擇的變體 / Default selected variant */
  defaultVariant?: ProductVariant;
}
