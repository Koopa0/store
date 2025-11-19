/**
 * 評價服務
 * Review Service
 *
 * 管理商品評價的 CRUD 操作和統計
 * Manages product review CRUD operations and statistics
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. 分頁查詢實現
 * 3. 評價統計計算
 * 4. Mock 資料模擬
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';

// Models
import {
  ProductReview,
  ProductReviewDetail,
  AddReviewRequest,
  UpdateReviewRequest,
  ReviewStatistics,
  ReviewQueryParams,
  ReviewListResponse,
} from '@core/models/review.model';
import { ApiResponse } from '@core/models/common.model';

/**
 * 評價服務
 * Review service
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reviews`;
  private readonly useMock = true; // 使用 Mock 資料 / Use mock data

  /**
   * 狀態 Signals
   * State signals
   */
  private readonly reviewsSignal = signal<ProductReviewDetail[]>([]);
  private readonly statisticsSignal = signal<ReviewStatistics | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  /**
   * 唯讀公開的 Signals
   * Readonly public signals
   */
  public readonly reviews = this.reviewsSignal.asReadonly();
  public readonly statistics = this.statisticsSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();

  /**
   * 計算屬性：平均評分
   * Computed: average rating
   */
  public readonly averageRating = computed(() => {
    return this.statistics()?.averageRating || 0;
  });

  /**
   * 取得商品評價列表
   * Get product reviews
   */
  getProductReviews(params: ReviewQueryParams): Observable<ReviewListResponse> {
    if (this.useMock) {
      return this.getMockReviews(params);
    }

    return this.http
      .get<ApiResponse<ReviewListResponse>>(`${this.apiUrl}/product/${params.productId}`, {
        params: params as any,
      })
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to fetch reviews:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 取得評價統計
   * Get review statistics
   */
  getReviewStatistics(productId: string): Observable<ReviewStatistics> {
    if (this.useMock) {
      return this.getMockStatistics(productId);
    }

    return this.http
      .get<ApiResponse<ReviewStatistics>>(`${this.apiUrl}/product/${productId}/statistics`)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to fetch review statistics:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 新增評價
   * Add review
   */
  addReview(request: AddReviewRequest): Observable<ProductReview> {
    if (this.useMock) {
      return this.mockAddReview(request);
    }

    return this.http
      .post<ApiResponse<ProductReview>>(`${this.apiUrl}`, request)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to add review:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 更新評價
   * Update review
   */
  updateReview(request: UpdateReviewRequest): Observable<ProductReview> {
    if (this.useMock) {
      return this.mockUpdateReview(request);
    }

    return this.http
      .put<ApiResponse<ProductReview>>(`${this.apiUrl}/${request.id}`, request)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to update review:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 刪除評價
   * Delete review
   */
  deleteReview(reviewId: string): Observable<void> {
    if (this.useMock) {
      return this.mockDeleteReview(reviewId);
    }

    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${reviewId}`)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to delete review:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 標記評價為有用
   * Mark review as helpful
   */
  markHelpful(reviewId: string): Observable<ProductReview> {
    if (this.useMock) {
      return this.mockMarkHelpful(reviewId);
    }

    return this.http
      .post<ApiResponse<ProductReview>>(`${this.apiUrl}/${reviewId}/helpful`, {})
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to mark review as helpful:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 檢查用戶是否可以評價該商品
   * Check if user can review product
   */
  checkUserCanReview(productId: string, userId: string): Observable<boolean> {
    if (this.useMock) {
      return this.mockCheckUserCanReview(productId, userId);
    }

    return this.http
      .get<ApiResponse<{ canReview: boolean }>>(
        `${this.apiUrl}/product/${productId}/can-review/${userId}`
      )
      .pipe(
        map((response) => response.data!.canReview),
        catchError((error) => {
          console.error('Failed to check review permission:', error);
          return of(false);
        })
      );
  }

  // ==================== Mock 資料方法 / Mock Data Methods ====================

  /**
   * Mock: 取得商品評價列表
   * Mock: Get product reviews
   */
  private getMockReviews(params: ReviewQueryParams): Observable<ReviewListResponse> {
    const allReviews = this.getMockReviewsData();
    const productReviews = allReviews.filter((r) => r.productId === params.productId);

    // 篩選
    let filtered = productReviews;
    if (params.rating) {
      filtered = filtered.filter((r) => r.rating === params.rating);
    }
    if (params.verifiedOnly) {
      filtered = filtered.filter((r) => r.isVerifiedPurchase);
    }
    if (params.withImagesOnly) {
      filtered = filtered.filter((r) => r.images && r.images.length > 0);
    }

    // 排序
    const sortBy = params.sortBy || 'newest';
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating);
    } else if (sortBy === 'helpful') {
      filtered.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }

    // 分頁
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedReviews = filtered.slice(startIndex, endIndex);

    // 統計
    const statistics = this.calculateStatistics(productReviews);

    const response: ReviewListResponse = {
      reviews: paginatedReviews,
      statistics,
      total: filtered.length,
      page,
      pageSize,
      hasNext: endIndex < filtered.length,
    };

    return of(response).pipe(delay(300));
  }

  /**
   * Mock: 取得評價統計
   * Mock: Get review statistics
   */
  private getMockStatistics(productId: string): Observable<ReviewStatistics> {
    const allReviews = this.getMockReviewsData();
    const productReviews = allReviews.filter((r) => r.productId === productId);
    const statistics = this.calculateStatistics(productReviews);

    return of(statistics).pipe(delay(300));
  }

  /**
   * 計算評價統計
   * Calculate review statistics
   */
  private calculateStatistics(reviews: ProductReviewDetail[]): ReviewStatistics {
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingDistribution = {
      1: reviews.filter((r) => r.rating === 1).length,
      2: reviews.filter((r) => r.rating === 2).length,
      3: reviews.filter((r) => r.rating === 3).length,
      4: reviews.filter((r) => r.rating === 4).length,
      5: reviews.filter((r) => r.rating === 5).length,
    };

    const verifiedPurchasesCount = reviews.filter((r) => r.isVerifiedPurchase).length;
    const reviewsWithImagesCount = reviews.filter(
      (r) => r.images && r.images.length > 0
    ).length;

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
      verifiedPurchasesCount,
      reviewsWithImagesCount,
    };
  }

  /**
   * Mock: 評價資料
   * Mock: Review data
   */
  private getMockReviewsData(): ProductReviewDetail[] {
    return [
      {
        id: 'review-1',
        productId: '1',
        userId: 'user-1',
        orderId: 'order-1',
        rating: 5,
        title: '非常滿意的購買',
        content:
          '這支 iPhone 15 Pro Max 真的很棒！拍照效果超好，尤其是夜拍模式非常驚艷。電池續航力也很不錯，重度使用一整天沒問題。鈦金屬的質感也很好，比之前的不鏽鋼輕很多。',
        images: [
          '/assets/images/reviews/iphone-review-1.jpg',
          '/assets/images/reviews/iphone-review-2.jpg',
        ],
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 25,
        isHidden: false,
        version: 1,
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-01'),
        userName: '王小明',
        userAvatar: '/assets/images/avatars/user-1.jpg',
        variantAttributes: {
          顏色: '原色鈦金屬',
          容量: '256GB',
        },
      },
      {
        id: 'review-2',
        productId: '1',
        userId: 'user-2',
        orderId: 'order-2',
        rating: 4,
        title: '整體不錯但價格偏高',
        content:
          '手機本身沒什麼好挑剔的，性能很強，拍照也很好。就是價格真的有點貴，建議等官網有活動再買會比較划算。',
        images: [],
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 12,
        isHidden: false,
        version: 1,
        createdAt: new Date('2024-10-28'),
        updatedAt: new Date('2024-10-28'),
        userName: '李小華',
        userAvatar: '/assets/images/avatars/user-2.jpg',
        variantAttributes: {
          顏色: '黑色鈦金屬',
          容量: '512GB',
        },
      },
      {
        id: 'review-3',
        productId: '1',
        userId: 'user-3',
        orderId: 'order-3',
        rating: 5,
        title: '值得升級！',
        content:
          '從 iPhone 13 Pro 升級上來，感受非常明顯。螢幕更亮更清晰，動態島設計很實用，A17 Pro 處理器跑遊戲超順暢。唯一小缺點是充電線要另外買。',
        images: ['/assets/images/reviews/iphone-review-3.jpg'],
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 18,
        isHidden: false,
        version: 1,
        createdAt: new Date('2024-10-25'),
        updatedAt: new Date('2024-10-25'),
        userName: '陳大明',
        userAvatar: '/assets/images/avatars/user-3.jpg',
        variantAttributes: {
          顏色: '藍色鈦金屬',
          容量: '256GB',
        },
      },
      {
        id: 'review-4',
        productId: '1',
        userId: 'user-4',
        orderId: 'order-4',
        rating: 3,
        title: '普通使用者可能不需要 Pro Max',
        content:
          '手機確實很好，但對於一般使用者來說，Pro Max 的功能可能用不到。如果不是專業攝影或玩遊戲，買標準版就夠了。而且這個尺寸對女生來說有點大。',
        images: [],
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 8,
        isHidden: false,
        version: 1,
        createdAt: new Date('2024-10-20'),
        updatedAt: new Date('2024-10-20'),
        userName: '林小美',
        userAvatar: '/assets/images/avatars/user-4.jpg',
        variantAttributes: {
          顏色: '白色鈦金屬',
          容量: '512GB',
        },
      },
      {
        id: 'review-5',
        productId: '1',
        userId: 'user-5',
        orderId: 'order-5',
        rating: 5,
        title: '攝影愛好者必買！',
        content:
          '作為一個攝影愛好者，這支手機的相機功能真的太強了！ProRAW、ProRes 影片錄製、1TB 儲存空間，完全可以取代部分專業相機的工作。48MP 主鏡頭的細節表現非常好。',
        images: [
          '/assets/images/reviews/iphone-review-4.jpg',
          '/assets/images/reviews/iphone-review-5.jpg',
          '/assets/images/reviews/iphone-review-6.jpg',
        ],
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 32,
        isHidden: false,
        version: 1,
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-10-15'),
        userName: '張攝影師',
        userAvatar: '/assets/images/avatars/user-5.jpg',
        variantAttributes: {
          顏色: '原色鈦金屬',
          容量: '1TB',
        },
      },
    ];
  }

  /**
   * Mock: 新增評價
   * Mock: Add review
   */
  private mockAddReview(request: AddReviewRequest): Observable<ProductReview> {
    const newReview: ProductReview = {
      id: `review-${Date.now()}`,
      userId: 'user-1', // 實際應從 auth service 取得
      ...request,
      images: request.images || [],
      isApproved: true,
      isVerifiedPurchase: true,
      helpfulCount: 0,
      isHidden: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return of(newReview).pipe(delay(500));
  }

  /**
   * Mock: 更新評價
   * Mock: Update review
   */
  private mockUpdateReview(request: UpdateReviewRequest): Observable<ProductReview> {
    // 在實際實現中應該從資料庫取得並更新
    const updatedReview: ProductReview = {
      id: request.id,
      productId: '1', // 實際應從資料庫取得
      userId: 'user-1',
      orderId: 'order-1',
      rating: request.rating,
      title: request.title,
      content: request.content,
      images: request.images || [],
      isApproved: true,
      isVerifiedPurchase: true,
      helpfulCount: 0,
      isHidden: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return of(updatedReview).pipe(delay(500));
  }

  /**
   * Mock: 刪除評價
   * Mock: Delete review
   */
  private mockDeleteReview(reviewId: string): Observable<void> {
    return of(void 0).pipe(delay(300));
  }

  /**
   * Mock: 標記有用
   * Mock: Mark helpful
   */
  private mockMarkHelpful(reviewId: string): Observable<ProductReview> {
    // 在實際實現中應該更新 helpfulCount
    const review = this.getMockReviewsData().find((r) => r.id === reviewId);

    if (!review) {
      return throwError(() => new Error('Review not found'));
    }

    return of({ ...review, helpfulCount: review.helpfulCount + 1 }).pipe(delay(300));
  }

  /**
   * Mock: 檢查是否可評價
   * Mock: Check can review
   */
  private mockCheckUserCanReview(productId: string, userId: string): Observable<boolean> {
    // Mock: 假設用戶已購買該商品
    return of(true).pipe(delay(200));
  }
}
