/**
 * 首頁元件
 * Home Page Component
 *
 * 顯示推薦商品、最新商品、分類等
 * Display featured products, new arrivals, categories, etc.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';

// ngx-translate
import { TranslateModule } from '@ngx-translate/core';

// Services
import { LoggerService, NotificationService } from '@core/services';
import { CartService } from '@features/cart/services/cart.service';

// Pipes
import { CurrencyFormatPipe } from '@shared/pipes';

// Models
import { ProductListItem } from '@core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatGridListModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);

  /**
   * 精選商品
   * Featured products
   */
  featuredProducts = signal<ProductListItem[]>([]);

  /**
   * 最新商品
   * New arrivals
   */
  newArrivals = signal<ProductListItem[]>([]);

  /**
   * 熱門分類
   * Popular categories
   */
  categories = signal([
    { id: '1', name: '電子產品', icon: 'devices', slug: 'electronics' },
    { id: '2', name: '服飾配件', icon: 'checkroom', slug: 'fashion' },
    { id: '3', name: '家居生活', icon: 'home', slug: 'home-living' },
    { id: '4', name: '運動健身', icon: 'sports_soccer', slug: 'sports' },
    { id: '5', name: '美妝保養', icon: 'face', slug: 'beauty' },
    { id: '6', name: '書籍文具', icon: 'menu_book', slug: 'books' },
  ]);

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.loadNewArrivals();
    this.logger.info('[HomeComponent] Initialized');
  }

  /**
   * 載入精選商品
   * Load featured products
   */
  private loadFeaturedProducts(): void {
    // TODO: 從 API 載入實際數據
    // 現在使用模擬數據
    const mockProducts: ProductListItem[] = [
      {
        id: '1',
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        sku: 'APPLE-IP15P-128',
        price: 36900,
        primaryImageUrl: 'https://picsum.photos/seed/iphone/400/400',
        stockQuantity: 50,
        isActive: true,
        isFeatured: true,
        categoryName: '電子產品',
        categoryPath: 'electronics',
        ratingAverage: 4.8,
        reviewCount: 128,
        totalSold: 450,
        totalRevenue: 16605000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'MacBook Pro 14"',
        slug: 'macbook-pro-14',
        sku: 'APPLE-MBP14-512',
        price: 59900,
        primaryImageUrl: 'https://picsum.photos/seed/macbook/400/400',
        stockQuantity: 30,
        isActive: true,
        isFeatured: true,
        categoryName: '電子產品',
        categoryPath: 'electronics',
        ratingAverage: 4.9,
        reviewCount: 95,
        totalSold: 280,
        totalRevenue: 16772000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        name: 'AirPods Pro 2',
        slug: 'airpods-pro-2',
        sku: 'APPLE-APP2-WHITE',
        price: 7990,
        primaryImageUrl: 'https://picsum.photos/seed/airpods/400/400',
        stockQuantity: 100,
        isActive: true,
        isFeatured: true,
        categoryName: '電子產品',
        categoryPath: 'electronics',
        ratingAverage: 4.7,
        reviewCount: 210,
        totalSold: 680,
        totalRevenue: 5433200,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Apple Watch Series 9',
        slug: 'apple-watch-9',
        sku: 'APPLE-AWS9-GPS',
        price: 12900,
        primaryImageUrl: 'https://picsum.photos/seed/watch/400/400',
        stockQuantity: 75,
        isActive: true,
        isFeatured: true,
        categoryName: '電子產品',
        categoryPath: 'electronics',
        ratingAverage: 4.6,
        reviewCount: 156,
        totalSold: 320,
        totalRevenue: 4128000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.featuredProducts.set(mockProducts);
  }

  /**
   * 載入最新商品
   * Load new arrivals
   */
  private loadNewArrivals(): void {
    // TODO: 從 API 載入實際數據
    const mockProducts: ProductListItem[] = [
      {
        id: '5',
        name: 'iPad Air',
        slug: 'ipad-air',
        sku: 'APPLE-IPA-64',
        price: 19900,
        primaryImageUrl: 'https://picsum.photos/seed/ipad/400/400',
        stockQuantity: 60,
        isActive: true,
        isFeatured: false,
        categoryName: '電子產品',
        categoryPath: 'electronics',
        ratingAverage: 4.5,
        reviewCount: 88,
        totalSold: 180,
        totalRevenue: 3582000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '1',
        name: 'Magic Keyboard',
        slug: 'magic-keyboard',
        sku: 'APPLE-MK-WHITE',
        price: 3290,
        primaryImageUrl: 'https://picsum.photos/seed/keyboard/400/400',
        stockQuantity: 120,
        isActive: true,
        isFeatured: false,
        categoryName: '電子產品',
        categoryPath: 'electronics',
        ratingAverage: 4.4,
        reviewCount: 72,
        totalSold: 220,
        totalRevenue: 723800,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'HomePod mini',
        slug: 'homepod-mini',
        sku: 'APPLE-HPM-BLACK',
        price: 3000,
        primaryImageUrl: 'https://picsum.photos/seed/homepod/400/400',
        stockQuantity: 85,
        isActive: true,
        isFeatured: false,
        categoryName: '電子產品',
        categoryPath: 'electronics',
        ratingAverage: 4.3,
        reviewCount: 65,
        totalSold: 190,
        totalRevenue: 570000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'AirTag 4 pack',
        slug: 'airtag-4pack',
        sku: 'APPLE-AT-4PK',
        price: 3590,
        primaryImageUrl: 'https://picsum.photos/seed/airtag/400/400',
        stockQuantity: 200,
        isActive: true,
        isFeatured: false,
        categoryName: '電子產品',
        categoryPath: 'electronics',
        ratingAverage: 4.6,
        reviewCount: 142,
        totalSold: 410,
        totalRevenue: 1471900,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.newArrivals.set(mockProducts);
  }

  /**
   * 前往商品詳情
   * Go to product detail
   */
  goToProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  /**
   * 前往分類
   * Go to category
   */
  goToCategory(categorySlug: string): void {
    this.router.navigate(['/categories', categorySlug]);
  }

  /**
   * 前往所有商品
   * Go to all products
   */
  goToAllProducts(): void {
    this.router.navigate(['/products']);
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
   * 取得折扣百分比
   * Get discount percentage
   */
  getDiscountPercentage(product: ProductListItem): number {
    if (!product.comparePrice) return 0;
    return Math.round(
      ((product.comparePrice - product.price) / product.comparePrice) * 100
    );
  }
}
