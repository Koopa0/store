/**
 * 商品詳情元件
 * Product Detail Component
 *
 * 顯示單一商品的詳細資訊
 * Displays detailed information for a single product
 *
 * 教學重點 / Teaching Points:
 * 1. 路由參數的接收 (Route parameter handling)
 * 2. Signal-based 狀態管理 (Signal-based state management)
 * 3. 圖片輪播 (Image carousel)
 * 4. 商品數量選擇 (Quantity selection)
 * 5. 錯誤處理 (Error handling)
 */

import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';

// Services and Models
import { ProductService } from '../../services/product.service';
import { CartService } from '@features/cart/services/cart.service';
import { LoggerService } from '@core/services';
import {
  ProductListItem,
  ProductVariantConfig,
  SelectedVariant,
} from '@core/models/product.model';

// Shared Components
import {
  VariantSelectorComponent,
  ImageCarouselComponent,
  ReviewListComponent,
} from '@shared/components';

// Pipes
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    TranslateModule,
    CurrencyFormatPipe,
    VariantSelectorComponent,
    ImageCarouselComponent,
    ReviewListComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  /**
   * 注入服務
   * Inject services
   */
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  /**
   * 狀態 Signals
   * State signals
   */
  public readonly product = signal<ProductListItem | null>(null);
  public readonly loading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly selectedImageIndex = signal<number>(0);

  /**
   * 變體相關 Signals
   * Variant-related signals
   */
  public readonly variantConfig = signal<ProductVariantConfig | null>(null);
  public readonly selectedVariant = signal<SelectedVariant | null>(null);

  /**
   * 表單控制項
   * Form controls
   */
  public readonly quantityControl = new FormControl(1, [
    Validators.required,
    Validators.min(1),
  ]);

  /**
   * 計算屬性
   * Computed properties
   */
  public readonly selectedImage = computed(() => {
    const prod = this.product();
    if (!prod) return '';
    return prod.primaryImageUrl;
  });

  public readonly totalPrice = computed(() => {
    const prod = this.product();
    const quantity = this.quantityControl.value || 1;
    const variant = this.selectedVariant();

    // 如果有選擇變體，使用變體價格
    if (variant) {
      return variant.price * quantity;
    }

    return prod ? prod.price * quantity : 0;
  });

  public readonly isInStock = computed(() => {
    const variant = this.selectedVariant();

    // 如果有選擇變體，使用變體庫存
    if (variant) {
      return variant.availableStock > 0;
    }

    const prod = this.product();
    return prod ? prod.stockQuantity > 0 : false;
  });

  public readonly hasDiscount = computed(() => {
    const prod = this.product();
    return prod && prod.comparePrice ? prod.comparePrice > prod.price : false;
  });

  public readonly discountPercentage = computed(() => {
    const prod = this.product();
    if (!prod || !prod.comparePrice) return 0;
    return Math.round(
      ((prod.comparePrice - prod.price) / prod.comparePrice) * 100
    );
  });

  public readonly productImages = computed(() => {
    const prod = this.product();
    if (!prod) return [];
    // 如果有多張圖片，可以在這裡擴展
    // For now, just return the primary image
    // Filter out undefined values to ensure type safety
    return [prod.primaryImageUrl].filter((img): img is string => !!img);
  });

  /**
   * 元件初始化
   * Component initialization
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    } else {
      this.error.set('Product ID not found');
    }
  }

  /**
   * 載入商品資料
   * Load product data
   */
  private loadProduct(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService
      .getProduct(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.loading.set(false);

          // 載入變體配置
          this.loadVariantConfig(id);
        },
        error: (err) => {
          this.logger.error('Failed to load product:', err);
          this.error.set('Failed to load product. Please try again.');
          this.loading.set(false);
        },
      });
  }

  /**
   * 載入變體配置
   * Load variant configuration
   */
  private loadVariantConfig(productId: string): void {
    this.productService
      .getProductVariantConfig(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (config) => {
          this.variantConfig.set(config);

          // 如果有預設變體，設置為選中
          if (config.defaultVariant) {
            this.selectedVariant.set({
              variantId: config.defaultVariant.id,
              attributes: config.defaultVariant.attributes,
              price: config.defaultVariant.priceOverride || this.product()!.price,
              availableStock: config.defaultVariant.stockQuantity,
              sku: config.defaultVariant.variantSku,
            });
          }
        },
        error: (err) => {
          this.logger.error('Failed to load variant config:', err);
          // 變體載入失敗不影響主要功能
        },
      });
  }

  /**
   * 處理變體選擇變更
   * Handle variant selection change
   */
  onVariantChange(variant: SelectedVariant | null): void {
    this.selectedVariant.set(variant);
  }

  /**
   * 增加數量
   * Increase quantity
   */
  increaseQuantity(): void {
    const current = this.quantityControl.value || 1;
    const prod = this.product();
    if (prod && current < prod.stockQuantity) {
      this.quantityControl.setValue(current + 1);
    }
  }

  /**
   * 減少數量
   * Decrease quantity
   */
  decreaseQuantity(): void {
    const current = this.quantityControl.value || 1;
    if (current > 1) {
      this.quantityControl.setValue(current - 1);
    }
  }

  /**
   * 加入購物車
   * Add to cart
   */
  addToCart(): void {
    const prod = this.product();
    const quantity = this.quantityControl.value || 1;
    const variant = this.selectedVariant();
    const config = this.variantConfig();

    // 如果商品有變體但用戶尚未選擇，提示用戶選擇
    if (config?.hasVariants && !variant) {
      this.logger.warn('[ProductDetail] Please select variant options first');
      // TODO: 顯示提示訊息「請先選擇規格」
      return;
    }

    if (prod) {
      this.cartService
        .addToCart(prod, quantity, variant?.variantId, variant?.attributes)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.info('[ProductDetail] Added to cart successfully', {
              product: prod.name,
              variant: variant?.attributes,
              quantity,
            });
            // TODO: 顯示成功訊息
          },
          error: (err) => {
            this.logger.error('Failed to add to cart:', err);
            // TODO: 顯示錯誤訊息
          },
        });
    }
  }

  /**
   * 立即購買
   * Buy now
   */
  buyNow(): void {
    const prod = this.product();
    const quantity = this.quantityControl.value || 1;
    const variant = this.selectedVariant();
    const config = this.variantConfig();

    // 如果商品有變體但用戶尚未選擇，提示用戶選擇
    if (config?.hasVariants && !variant) {
      this.logger.warn('[ProductDetail] Please select variant options first');
      // TODO: 顯示提示訊息「請先選擇規格」
      return;
    }

    if (prod) {
      // 先加入購物車，然後導航到結帳頁面
      this.cartService
        .addToCart(prod, quantity, variant?.variantId, variant?.attributes)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.info('[ProductDetail] Buy now -', {
              product: prod.name,
              variant: variant?.attributes,
              quantity,
            });
            // TODO: 導向結帳頁面
            this.router.navigate(['/cart']);
          },
          error: (err) => {
            this.logger.error('Failed to add to cart:', err);
            // TODO: 顯示錯誤訊息
          },
        });
    }
  }

  /**
   * 返回商品列表
   * Go back to product list
   */
  goBack(): void {
    this.router.navigate(['/products']);
  }
}
