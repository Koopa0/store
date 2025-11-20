/**
 * 商品列表元件
 * Product List Component
 *
 * 顯示商品列表，支援搜尋、篩選、排序和分頁
 * Displays product list with search, filter, sort, and pagination
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. 表單控制與響應式搜尋
 * 3. 分頁處理
 * 4. Material Grid List 的使用
 * 5. 路由導航
 */

import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// 服務和模型
import { ProductService } from '../../services/product.service';
import { CartService } from '@features/cart/services/cart.service';
import { NotificationService } from '@core/services/notification.service';
import { ProductListItem, ProductListParams } from '@core/models/product.model';
import { LoggerService } from '@core/services';
import { TranslateModule } from '@ngx-translate/core';

// 共用元件和管道
import { CurrencyFormatPipe, TruncatePipe } from '@shared/pipes';

@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    // Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    // 共用
    CurrencyFormatPipe,
    TruncatePipe,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  /**
   * 注入服務
   * Inject services
   */
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  /**
   * 商品列表
   * Product list
   */
  public readonly products = this.productService.products;

  /**
   * 載入狀態
   * Loading state
   */
  public readonly loading = signal<boolean>(false);

  /**
   * 搜尋控制
   * Search control
   *
   * 教學說明：
   * 使用 FormControl 實現響應式搜尋
   */
  public readonly searchControl = new FormControl('');

  /**
   * 排序控制
   * Sort control
   */
  public readonly sortControl = new FormControl('createdAt');

  /**
   * 排序方向控制
   * Sort order control
   */
  public readonly sortOrderControl = new FormControl<'asc' | 'desc'>('desc');

  /**
   * 分類控制
   * Category control
   */
  public readonly categoryControl = new FormControl('');

  /**
   * 分頁資訊
   * Pagination info
   */
  public readonly pagination = signal({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  /**
   * 可用分類列表
   * Available categories
   */
  public readonly categories = signal<Array<{ name: string; path: string }>>([
    { name: '全部分類', path: '' },
    { name: '智慧型手機', path: 'smartphones' },
    { name: '筆記型電腦', path: 'laptops' },
    { name: '音訊設備', path: 'audio' },
  ]);

  /**
   * 排序選項
   * Sort options
   */
  public readonly sortOptions = [
    { value: 'createdAt', label: '最新上架' },
    { value: 'price', label: '價格' },
    { value: 'soldCount', label: '銷量' },
    { value: 'rating', label: '評分' },
    { value: 'name', label: '名稱' },
  ];

  /**
   * 初始化
   * Initialize
   */
  ngOnInit(): void {
    // 監聽路由參數（用於分類篩選）
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const categorySlug = params['slug'];
        if (categorySlug) {
          // 從 URL 設定分類
          this.categoryControl.setValue(categorySlug, { emitEvent: false });
        }
        this.loadProducts();
      });

    // 監聽搜尋輸入
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500), // 延遲 500ms
        distinctUntilChanged(), // 只有值改變時才觸發
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.loadProducts();
      });

    // 監聽分類變更
    this.categoryControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadProducts();
      });

    // 監聽排序變更
    this.sortControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadProducts();
      });

    this.sortOrderControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadProducts();
      });
  }

  /**
   * 載入商品
   * Load products
   */
  loadProducts(): void {
    this.loading.set(true);

    const params: ProductListParams = {
      page: this.pagination().page,
      limit: this.pagination().limit,
      search: this.searchControl.value || undefined,
      categoryId: this.categoryControl.value || undefined,
      sortBy: this.sortControl.value || undefined,
      sortOrder: this.sortOrderControl.value || undefined,
      status: 'active', // 只顯示上架中的商品
    };

    this.productService
      .getProducts(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.pagination.set({
          page: response.currentPage,
          limit: response.pageSize,
          total: response.totalItems,
          totalPages: response.totalPages,
        });
        this.loading.set(false);
      },
      error: (error) => {
        this.logger.error('Failed to load products:', error);
        this.loading.set(false);
      },
    });
  }

  /**
   * 處理分頁變更
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.pagination.update((current) => ({
      ...current,
      page: event.pageIndex + 1,
      limit: event.pageSize,
    }));
    this.loadProducts();
  }

  /**
   * 切換排序方向
   * Toggle sort order
   */
  toggleSortOrder(): void {
    const currentOrder = this.sortOrderControl.value;
    this.sortOrderControl.setValue(currentOrder === 'asc' ? 'desc' : 'asc');
  }

  /**
   * 取得折扣百分比
   * Get discount percentage
   */
  getDiscountPercentage(product: ProductListItem): number {
    if (!product.comparePrice) return 0;
    return Math.round(
      ((product.comparePrice - product.price) / product.comparePrice) * 100
    );
  }

  /**
   * 檢查商品是否有折扣
   * Check if product has discount
   */
  hasDiscount(product: ProductListItem): boolean {
    return !!product.comparePrice && product.comparePrice > product.price;
  }

  /**
   * 加入購物車
   * Add to cart
   */
  addToCart(product: ProductListItem, event: Event): void {
    event.stopPropagation(); // 防止觸發卡片的 click 事件

    this.cartService.addToCart(product, 1).subscribe({
      next: (cartItem) => {
        this.notificationService.success(
          `已將「${product.name}」加入購物車！`
        );
      },
      error: (error) => {
        this.logger.error('Failed to add to cart:', error);
        this.notificationService.error(
          '加入購物車失敗，請稍後再試'
        );
      },
    });
  }

  /**
   * 前往商品詳情
   * Navigate to product detail
   */
  goToProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }
}
