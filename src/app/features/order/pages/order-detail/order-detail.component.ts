/**
 * 訂單詳情頁面組件
 * Order Detail Page Component
 *
 * 顯示完整的訂單詳細資訊
 * Displays complete order details
 *
 * 教學重點 / Teaching Points:
 * 1. 路由參數讀取
 * 2. Signal-based 狀態管理
 * 3. 服務整合（OrderService）
 * 4. 訂單操作（取消、追蹤等）
 * 5. 詳細資訊展示
 */

import { Component, OnInit, inject, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

// Services
import { OrderService } from '@features/order/services/order.service';
import { NotificationService } from '@core/services/notification.service';
import { LoggerService } from '@core/services';

// Pipes
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    TranslateModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  /**
   * 訂單 ID（從路由參數取得）
   */
  orderId: string | null = null;

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

  /**
   * 是否可以取消訂單
   */
  readonly canCancelOrder = computed(() => {
    const status = this.currentOrder()?.status;
    return status === 'pending' || status === 'paid' || status === 'confirmed';
  });

  /**
   * 訂單項目表格欄位
   */
  readonly displayedColumns: string[] = ['product', 'quantity', 'unitPrice', 'subtotal'];

  ngOnInit(): void {
    // 從路由參數取得訂單 ID
    this.orderId = this.route.snapshot.paramMap.get('id');

    if (!this.orderId) {
      this.logger.error('[OrderDetail] No order ID in route');
      this.router.navigate(['/orders']);
      return;
    }

    // 載入訂單詳情
    this.loadOrder(this.orderId);
  }

  /**
   * 載入訂單詳情
   */
  private loadOrder(orderId: string): void {
    this.orderService.getOrder(orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.logger.info('[OrderDetail] Order loaded:', order);
        },
        error: (error) => {
          this.logger.error('[OrderDetail] Failed to load order:', error);
          // 如果訂單不存在，導航回訂單列表
          setTimeout(() => {
            this.router.navigate(['/orders']);
          }, 3000);
        },
      });
  }

  /**
   * 返回訂單列表
   */
  goBackToList(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * 取消訂單
   */
  cancelOrder(): void {
    const order = this.currentOrder();
    if (!order) return;

    // TODO: 實作確認對話框
    if (!confirm('確定要取消此訂單嗎？')) return;

    this.orderService.cancelOrder(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notificationService.success('訂單已取消');
          // 重新載入訂單
          this.loadOrder(order.id);
        },
        error: (error) => {
          this.notificationService.error('取消訂單失敗: ' + error.message);
        },
      });
  }

  /**
   * 再次購買
   */
  reorder(): void {
    // TODO: 實作再次購買功能
    this.logger.info('Reorder:', this.currentOrder()?.orderNumber);
    this.notificationService.info('再次購買功能開發中...');
  }

  /**
   * 追蹤訂單
   */
  trackOrder(): void {
    // TODO: 實作訂單追蹤功能
    this.logger.info('Track order:', this.currentOrder()?.orderNumber);
    this.notificationService.info('訂單追蹤功能開發中...');
  }

  /**
   * 申請退貨
   */
  requestReturn(): void {
    // TODO: 實作退貨申請功能
    this.logger.info('Request return:', this.currentOrder()?.orderNumber);
    this.notificationService.info('退貨申請功能開發中...');
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
   * 取得訂單狀態圖示
   */
  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      draft: 'edit',
      pending: 'schedule',
      paid: 'payment',
      confirmed: 'check_circle',
      processing: 'sync',
      shipped: 'local_shipping',
      delivered: 'home',
      completed: 'done_all',
      cancelled: 'cancel',
      refunding: 'undo',
      refunded: 'money_off',
    };
    return iconMap[status] || 'info';
  }

  /**
   * 將變體屬性物件轉換為陣列
   * Convert variant attributes object to array
   */
  getVariantAttributesArray(attributes: Record<string, any>): { key: string; value: any }[] {
    return Object.entries(attributes).map(([key, value]) => ({ key, value }));
  }
}
