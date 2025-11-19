/**
 * 購物車元件
 * Cart Component
 *
 * 顯示購物車內容和管理購物車項目
 * Displays cart contents and manages cart items
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. Computed properties 計算總計
 * 3. 購物車項目的 CRUD 操作
 * 4. 響應式設計
 * 5. 錯誤處理
 */

import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services and Models
import { CartService } from '../../services/cart.service';
import { CartItemDetail } from '@core/models/cart.model';
import { LoggerService } from '@core/services';

// Pipes
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  /**
   * 注入服務
   * Inject services
   */
  private readonly router = inject(Router);
  public readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  /**
   * 從 CartService 取得的狀態
   * State from CartService
   */
  public readonly cartItems = this.cartService.cartItems;
  public readonly itemsCount = this.cartService.itemsCount;
  public readonly subtotal = this.cartService.subtotal;
  public readonly estimatedTax = this.cartService.estimatedTax;
  public readonly estimatedShipping = this.cartService.estimatedShipping;
  public readonly estimatedTotal = this.cartService.estimatedTotal;
  public readonly cartSummary = this.cartService.cartSummary;

  /**
   * 元件初始化
   * Component initialization
   */
  ngOnInit(): void {
    // 可以在這裡載入購物車詳情
    // Can load cart details here
  }

  /**
   * 增加商品數量
   * Increase item quantity
   */
  increaseQuantity(item: CartItemDetail): void {
    const newQuantity = item.quantity + 1;
    if (newQuantity <= item.stockQuantity) {
      this.cartService
        .updateQuantity(item.id, newQuantity)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.info('Quantity updated');
          },
          error: (err) => {
            this.logger.error('Failed to update quantity:', err);
          },
        });
    }
  }

  /**
   * 減少商品數量
   * Decrease item quantity
   */
  decreaseQuantity(item: CartItemDetail): void {
    const newQuantity = item.quantity - 1;
    if (newQuantity >= 1) {
      this.cartService
        .updateQuantity(item.id, newQuantity)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.info('Quantity updated');
          },
          error: (err) => {
            this.logger.error('Failed to update quantity:', err);
          },
        });
    }
  }

  /**
   * 更新商品數量（輸入框）
   * Update item quantity (input field)
   */
  updateQuantity(item: CartItemDetail, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);

    if (newQuantity >= 1 && newQuantity <= item.stockQuantity) {
      this.cartService
        .updateQuantity(item.id, newQuantity)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.info('Quantity updated');
          },
        error: (err) => {
          this.logger.error('Failed to update quantity:', err);
          // 恢復原始值
          input.value = item.quantity.toString();
        },
      });
    } else {
      // 恢復原始值
      input.value = item.quantity.toString();
    }
  }

  /**
   * 移除商品
   * Remove item
   */
  removeItem(item: CartItemDetail): void {
    if (confirm(`確定要移除「${item.productName}」嗎？`)) {
      this.cartService
        .removeItem(item.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.info('Item removed');
          },
          error: (err) => {
            this.logger.error('Failed to remove item:', err);
          },
        });
    }
  }

  /**
   * 清空購物車
   * Clear cart
   */
  clearCart(): void {
    if (confirm('確定要清空購物車嗎？')) {
      this.cartService
        .clearCart()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.info('Cart cleared');
          },
          error: (err) => {
            this.logger.error('Failed to clear cart:', err);
          },
        });
    }
  }

  /**
   * 繼續購物
   * Continue shopping
   */
  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  /**
   * 前往結帳
   * Go to checkout
   */
  checkout(): void {
    // TODO: 實作結帳頁面
    this.logger.info('Checkout:', this.cartSummary());
    alert('結帳功能開發中...');
  }

  /**
   * 檢查商品是否缺貨
   * Check if item is out of stock
   */
  isOutOfStock(item: CartItemDetail): boolean {
    return !item.isInStock || item.quantity > item.stockQuantity;
  }

  /**
   * 檢查商品價格是否已變更
   * Check if item price has changed
   */
  hasPriceChanged(item: CartItemDetail): boolean {
    return item.unitPrice !== item.currentPrice;
  }

  /**
   * 取得折扣百分比
   * Get discount percentage
   */
  getDiscountPercentage(item: CartItemDetail): number {
    if (!item.currentPrice || item.unitPrice >= item.currentPrice) return 0;
    return Math.round(
      ((item.currentPrice - item.unitPrice) / item.currentPrice) * 100
    );
  }

  /**
   * 將變體屬性物件轉換為陣列
   * Convert variant attributes object to array
   */
  getVariantAttributesArray(attributes: Record<string, any>): { key: string; value: any }[] {
    return Object.entries(attributes).map(([key, value]) => ({ key, value }));
  }
}
