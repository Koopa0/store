/**
 * 評價相關的資料模型
 * Review-related data models
 *
 * 對應資料庫: product_reviews
 * Database mapping: product_reviews
 */

/**
 * 商品評價介面
 * Product review interface
 *
 * 對應資料表: product_reviews
 * Database table: product_reviews
 */
export interface ProductReview {
  /** 評價 ID (UUID) */
  id: string;
  /** 商品 ID / Product ID */
  productId: string;
  /** 用戶 ID / User ID */
  userId: string;
  /** 訂單 ID（驗證已購買）/ Order ID (verify purchase) */
  orderId: string;
  /** 評分（1-5 星）/ Rating (1-5 stars) */
  rating: number;
  /** 評價標題 / Review title */
  title: string;
  /** 評價內容 / Review content */
  content: string;
  /** 評價圖片 URLs / Review image URLs */
  images: string[];
  /** 是否已審核（自動為 true）/ Is approved (auto true) */
  isApproved: boolean;
  /** 是否為驗證購買 / Is verified purchase */
  isVerifiedPurchase: boolean;
  /** 有用計數 / Helpful count */
  helpfulCount: number;
  /** 是否被隱藏（管理員操作）/ Is hidden (admin action) */
  isHidden: boolean;
  /** 版本號 / Version number */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
}

/**
 * 評價詳情（包含用戶資訊）
 * Review detail (with user information)
 */
export interface ProductReviewDetail extends ProductReview {
  /** 用戶名稱 / User name */
  userName: string;
  /** 用戶頭像 / User avatar */
  userAvatar?: string;
  /** 變體屬性（如果有）/ Variant attributes (if any) */
  variantAttributes?: Record<string, string>;
}

/**
 * 新增評價請求
 * Add review request
 */
export interface AddReviewRequest {
  /** 商品 ID / Product ID */
  productId: string;
  /** 訂單 ID / Order ID */
  orderId: string;
  /** 評分 / Rating */
  rating: number;
  /** 標題 / Title */
  title: string;
  /** 內容 / Content */
  content: string;
  /** 圖片 URLs / Image URLs */
  images?: string[];
}

/**
 * 更新評價請求
 * Update review request
 */
export interface UpdateReviewRequest {
  /** 評價 ID / Review ID */
  id: string;
  /** 評分 / Rating */
  rating: number;
  /** 標題 / Title */
  title: string;
  /** 內容 / Content */
  content: string;
  /** 圖片 URLs / Image URLs */
  images?: string[];
}

/**
 * 評價統計
 * Review statistics
 */
export interface ReviewStatistics {
  /** 總評價數 / Total reviews */
  totalReviews: number;
  /** 平均評分 / Average rating */
  averageRating: number;
  /** 各星級數量 / Rating distribution */
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  /** 驗證購買數量 / Verified purchases count */
  verifiedPurchasesCount: number;
  /** 有圖片的評價數量 / Reviews with images count */
  reviewsWithImagesCount: number;
}

/**
 * 評價查詢參數
 * Review query parameters
 */
export interface ReviewQueryParams {
  /** 商品 ID / Product ID */
  productId: string;
  /** 頁碼 / Page number */
  page?: number;
  /** 每頁數量 / Page size */
  pageSize?: number;
  /** 排序方式 / Sort by */
  sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful';
  /** 僅顯示有圖片的評價 / Only with images */
  withImagesOnly?: boolean;
  /** 僅顯示驗證購買 / Only verified purchases */
  verifiedOnly?: boolean;
  /** 篩選星級 / Filter by rating */
  rating?: number;
}

/**
 * 評價列表回應
 * Review list response
 */
export interface ReviewListResponse {
  /** 評價列表 / Reviews */
  reviews: ProductReviewDetail[];
  /** 統計資訊 / Statistics */
  statistics: ReviewStatistics;
  /** 總數 / Total count */
  total: number;
  /** 當前頁 / Current page */
  page: number;
  /** 每頁數量 / Page size */
  pageSize: number;
  /** 是否有下一頁 / Has next page */
  hasNext: boolean;
}

/**
 * 評價輔助函式
 * Review helper functions
 */
export class ReviewHelper {
  /**
   * 取得星級陣列（用於顯示星星）
   * Get star array (for displaying stars)
   */
  static getStarArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }

  /**
   * 格式化評分為百分比
   * Format rating to percentage
   */
  static ratingToPercentage(rating: number): number {
    return (rating / 5) * 100;
  }

  /**
   * 計算評價的相對時間
   * Calculate relative time for review
   */
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月前`;
    return `${Math.floor(diffDays / 365)} 年前`;
  }

  /**
   * 驗證評分有效性
   * Validate rating
   */
  static isValidRating(rating: number): boolean {
    return rating >= 1 && rating <= 5 && Number.isInteger(rating);
  }
}
