/**
 * 評價列表組件
 * Review List Component
 *
 * 顯示商品評價列表和統計
 * Displays product review list and statistics
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. 評價篩選和排序
 * 3. 分頁處理
 * 4. 星級評分顯示
 */

import { Component, Input, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { ReviewService } from '@core/services/review.service';

// Models
import {
  ProductReviewDetail,
  ReviewStatistics,
  ReviewQueryParams,
  ReviewHelper,
} from '@core/models/review.model';

// Pipes
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './review-list.component.html',
  styleUrl: './review-list.component.scss',
})
export class ReviewListComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * 商品 ID
   * Product ID
   */
  @Input({ required: true }) productId!: string;

  /**
   * 狀態 Signals
   * State signals
   */
  public readonly reviews = signal<ProductReviewDetail[]>([]);
  public readonly statistics = signal<ReviewStatistics | null>(null);
  public readonly loading = signal(false);
  public readonly currentPage = signal(1);
  public readonly hasMore = signal(false);

  /**
   * 篩選參數
   * Filter parameters
   */
  public sortBy: 'newest' | 'highest' | 'lowest' | 'helpful' = 'newest';
  public selectedRating: number | null = null;
  public verifiedOnly = false;
  public withImagesOnly = false;

  /**
   * 輔助類別
   * Helper class
   */
  public readonly ReviewHelper = ReviewHelper;

  /**
   * 導出 Math 供模板使用
   * Export Math for template use
   */
  public readonly Math = Math;

  /**
   * 導出 Object 供模板使用
   * Export Object for template use
   */
  public readonly Object = Object;

  /**
   * 元件初始化
   * Component initialization
   */
  ngOnInit(): void {
    this.loadReviews();
    this.loadStatistics();
  }

  /**
   * 載入評價列表
   * Load reviews
   */
  loadReviews(loadMore = false): void {
    this.loading.set(true);

    const params: ReviewQueryParams = {
      productId: this.productId,
      page: loadMore ? this.currentPage() + 1 : 1,
      pageSize: 10,
      sortBy: this.sortBy,
      rating: this.selectedRating || undefined,
      verifiedOnly: this.verifiedOnly,
      withImagesOnly: this.withImagesOnly,
    };

    this.reviewService
      .getProductReviews(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (loadMore) {
            this.reviews.update((current) => [...current, ...response.reviews]);
            this.currentPage.update((p) => p + 1);
          } else {
            this.reviews.set(response.reviews);
            this.currentPage.set(1);
          }
          this.hasMore.set(response.hasNext);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load reviews:', err);
          this.loading.set(false);
        },
      });
  }

  /**
   * 載入評價統計
   * Load review statistics
   */
  loadStatistics(): void {
    this.reviewService
      .getReviewStatistics(this.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.statistics.set(stats);
        },
        error: (err) => {
          console.error('Failed to load review statistics:', err);
        },
      });
  }

  /**
   * 改變排序方式
   * Change sort order
   */
  onSortChange(): void {
    this.loadReviews();
  }

  /**
   * 篩選星級
   * Filter by rating
   */
  filterByRating(rating: number | null): void {
    this.selectedRating = rating;
    this.loadReviews();
  }

  /**
   * 切換驗證購買篩選
   * Toggle verified only filter
   */
  toggleVerifiedOnly(): void {
    this.verifiedOnly = !this.verifiedOnly;
    this.loadReviews();
  }

  /**
   * 切換有圖片篩選
   * Toggle with images only filter
   */
  toggleWithImagesOnly(): void {
    this.withImagesOnly = !this.withImagesOnly;
    this.loadReviews();
  }

  /**
   * 載入更多評價
   * Load more reviews
   */
  loadMore(): void {
    if (!this.loading() && this.hasMore()) {
      this.loadReviews(true);
    }
  }

  /**
   * 標記評價為有用
   * Mark review as helpful
   */
  markAsHelpful(reviewId: string): void {
    this.reviewService
      .markHelpful(reviewId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // 更新本地評價的 helpfulCount
          this.reviews.update((reviews) =>
            reviews.map((r) =>
              r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
            )
          );
        },
        error: (err) => {
          console.error('Failed to mark as helpful:', err);
        },
      });
  }

  /**
   * 取得星級百分比（用於進度條）
   * Get rating percentage (for progress bar)
   */
  getRatingPercentage(rating: number): number {
    const stats = this.statistics();
    if (!stats || stats.totalReviews === 0) return 0;

    const count = stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5] || 0;
    return (count / stats.totalReviews) * 100;
  }

  /**
   * 取得星級數量
   * Get rating count
   */
  getRatingCount(rating: number): number {
    const stats = this.statistics();
    return stats?.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5] || 0;
  }
}
