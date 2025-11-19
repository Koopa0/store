/**
 * 訂單列表頁面組件
 * Order List Page Component
 *
 * 顯示用戶的所有訂單列表
 * Displays user's order list with pagination
 *
 * 教學重點 / Teaching Points:
 * 1. 分頁處理
 * 2. Signal-based 狀態管理
 * 3. 服務整合（OrderService）
 * 4. 訂單狀態篩選
 * 5. 響應式列表設計
 */

import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

// Services
import { OrderService } from '@features/order/services/order.service';
import { LoggerService } from '@core/services';

// Models
import { Order, OrderStatus } from '@core/models/order.model';

// Pipes
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  /**
   * 訂單列表 Signal
   */
  readonly orders = signal<Order[]>([]);

  /**
   * Loading 狀態
   */
  readonly loading = signal<boolean>(false);

  /**
   * 錯誤訊息
   */
  readonly error = signal<string | null>(null);

  /**
   * 分頁資訊
   */
  readonly pagination = signal({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  /**
   * 狀態篩選
   */
  readonly statusFilter = signal<OrderStatus | 'all'>('all');

  /**
   * 所有可用的訂單狀態
   */
  readonly availableStatuses: Array<{ value: OrderStatus | 'all'; label: string }> = [
    { value: 'all', label: 'order.filter.all' },
    { value: OrderStatus.PENDING, label: 'order.status_pending' },
    { value: OrderStatus.PAID, label: 'order.status_paid' },
    { value: OrderStatus.CONFIRMED, label: 'order.status_confirmed' },
    { value: OrderStatus.PROCESSING, label: 'order.status_processing' },
    { value: OrderStatus.SHIPPED, label: 'order.status_shipped' },
    { value: OrderStatus.DELIVERED, label: 'order.status_delivered' },
    { value: OrderStatus.COMPLETED, label: 'order.status_completed' },
    { value: OrderStatus.CANCELLED, label: 'order.status_cancelled' },
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  /**
   * 載入訂單列表
   */
  loadOrders(page: number = 1): void {
    this.loading.set(true);
    this.error.set(null);

    // TODO: 實際應從 AuthService 取得用戶 ID
    const userId = 'mock-user-id';

    this.orderService
      .getUserOrders(userId, page, this.pagination().pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.orders.set(response.items);
          this.pagination.set({
            currentPage: response.currentPage,
            pageSize: response.pageSize,
            totalItems: response.totalItems,
            totalPages: response.totalPages,
          });
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set('載入訂單失敗: ' + error.message);
          this.loading.set(false);
        },
      });
  }

  /**
   * 處理分頁變更
   */
  onPageChange(event: PageEvent): void {
    const newPage = event.pageIndex + 1; // Material Paginator 從 0 開始
    this.loadOrders(newPage);
  }

  /**
   * 處理狀態篩選變更
   */
  onStatusFilterChange(status: OrderStatus | 'all'): void {
    this.statusFilter.set(status);
    // TODO: 實作狀態篩選邏輯
    // 目前先重新載入所有訂單
    this.loadOrders(1);
  }

  /**
   * 查看訂單詳情
   */
  viewOrderDetail(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  /**
   * 追蹤訂單
   */
  trackOrder(orderNumber: string): void {
    // TODO: 實作訂單追蹤功能
    this.logger.info('Track order:', orderNumber);
  }

  /**
   * 再次購買
   */
  reorder(order: Order): void {
    // TODO: 實作再次購買功能
    this.logger.info('Reorder:', order.orderNumber);
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
}
