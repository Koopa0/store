/**
 * 訂單確認頁面組件
 * Order Confirmation Page Component
 *
 * 顯示訂單完成訊息和訂單詳情
 * Displays order completion message and order details
 *
 * 教學重點 / Teaching Points:
 * 1. 路由參數讀取
 * 2. Signal-based 狀態管理
 * 3. 服務整合（OrderService）
 * 4. 響應式設計
 * 5. 成功頁面 UX 設計
 */

import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { OrderService } from '@features/order/services/order.service';

// Pipes
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss',
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);

  /**
   * 訂單編號（從路由參數取得）
   */
  orderNumber: string | null = null;

  /**
   * 當前訂單 Signal
   */
  readonly currentOrder = this.orderService.currentOrder;
  readonly loading = this.orderService.loading;
  readonly error = this.orderService.error;

  /**
   * 訂單是否已載入
   */
  readonly orderLoaded = computed(() => {
    return this.currentOrder() !== null && !this.loading();
  });

  /**
   * 訂單項目數量
   */
  readonly itemsCount = computed(() => {
    const order = this.currentOrder();
    return order?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  });

  ngOnInit(): void {
    // 從路由參數取得訂單編號
    this.orderNumber = this.route.snapshot.paramMap.get('orderNumber');

    if (!this.orderNumber) {
      console.error('[OrderConfirmation] No order number in route');
      this.router.navigate(['/products']);
      return;
    }

    // 載入訂單詳情
    this.loadOrder(this.orderNumber);
  }

  /**
   * 載入訂單詳情
   */
  private loadOrder(orderNumber: string): void {
    this.orderService.getOrderByNumber(orderNumber).subscribe({
      next: (order) => {
        console.log('[OrderConfirmation] Order loaded:', order);
      },
      error: (error) => {
        console.error('[OrderConfirmation] Failed to load order:', error);
        // 如果訂單不存在，導航回首頁
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 3000);
      },
    });
  }

  /**
   * 繼續購物
   */
  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  /**
   * 查看訂單詳情
   */
  viewOrderDetails(): void {
    if (this.currentOrder()) {
      this.router.navigate(['/orders', this.currentOrder()!.id]);
    }
  }

  /**
   * 查看我的訂單列表
   */
  viewMyOrders(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * 取得訂單狀態顯示文字
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'order.status_draft',
      pending: 'order.status_pending',
      paid: 'order.status_paid',
      confirmed: 'order.status_confirmed',
      processing: 'order.status_processing',
      shipped: 'order.status_shipped',
      delivered: 'order.status_delivered',
      completed: 'order.status_completed',
      cancelled: 'order.status_cancelled',
      refunding: 'order.status_refunding',
      refunded: 'order.status_refunded',
    };
    return statusMap[status] || status;
  }

  /**
   * 將變體屬性物件轉換為陣列
   * Convert variant attributes object to array
   */
  getVariantAttributesArray(attributes: Record<string, any>): { key: string; value: any }[] {
    return Object.entries(attributes).map(([key, value]) => ({ key, value }));
  }
}
