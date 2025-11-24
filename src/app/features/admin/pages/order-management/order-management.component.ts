/**
 * 訂單管理組件
 * Order Management Component
 */

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { OrderService } from '@features/order/services/order.service';
import { NotificationService } from '@core/services/notification.service';

// Models
import { OrderDetail, OrderStatus } from '@core/models/order.model';

// Pipes
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDividerModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.scss',
})
export class OrderManagementComponent {
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // 暴露 OrderStatus 枚舉給模板使用
  readonly OrderStatus = OrderStatus;

  readonly displayedColumns = [
    'orderId',
    'customer',
    'date',
    'items',
    'total',
    'status',
    'actions',
  ];

  readonly searchTerm = signal('');
  readonly statusFilter = signal<string>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  private readonly allOrders = signal<OrderDetail[]>([]);

  readonly filteredOrders = computed(() => {
    let orders = this.allOrders();

    const search = this.searchTerm().toLowerCase();
    if (search) {
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(search) ||
          o.shippingAddress.recipientName.toLowerCase().includes(search)
      );
    }

    if (this.statusFilter() !== 'all') {
      orders = orders.filter((o) => o.status === this.statusFilter());
    }

    return orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  readonly pagedOrders = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredOrders().slice(start, end);
  });

  readonly totalOrders = computed(() => this.filteredOrders().length);

  readonly stats = computed(() => {
    const orders = this.allOrders();
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      processing: orders.filter((o) => o.status === OrderStatus.PROCESSING)
        .length,
      shipped: orders.filter((o) => o.status === OrderStatus.SHIPPED).length,
      completed: orders.filter((o) => o.status === OrderStatus.COMPLETED)
        .length,
    };
  });

  readonly orderStatuses = [
    { value: 'all', label: '全部狀態' },
    { value: OrderStatus.PENDING, label: '待處理' },
    { value: OrderStatus.PROCESSING, label: '處理中' },
    { value: OrderStatus.SHIPPED, label: '已出貨' },
    { value: OrderStatus.COMPLETED, label: '已完成' },
    { value: OrderStatus.CANCELLED, label: '已取消' },
  ];

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.allOrders.set(orders);
      },
      error: (error) => {
        this.notificationService.error('載入訂單失敗');
        console.error('Error loading orders:', error);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('all');
    this.pageIndex.set(0);
  }

  viewOrderDetail(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  changeOrderStatus(order: OrderDetail, newStatus: OrderStatus): void {
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        const statusText = this.getStatusText(newStatus);
        this.notificationService.success(`訂單狀態已更新為：${statusText}`);
        this.loadOrders();
      },
      error: (error) => {
        this.notificationService.error('更新訂單狀態失敗');
        console.error('Error updating order status:', error);
      },
    });
  }

  cancelOrder(order: OrderDetail): void {
    if (confirm(`確定要取消訂單 ${order.id} 嗎？`)) {
      this.changeOrderStatus(order, OrderStatus.CANCELLED);
    }
  }

  exportOrders(): void {
    this.notificationService.info('匯出功能開發中...');
  }

  getStatusText(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: '草稿',
      [OrderStatus.PENDING]: '待處理',
      [OrderStatus.PAID]: '已付款',
      [OrderStatus.CONFIRMED]: '已確認',
      [OrderStatus.PROCESSING]: '處理中',
      [OrderStatus.SHIPPED]: '已出貨',
      [OrderStatus.DELIVERED]: '已送達',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
      [OrderStatus.REFUNDING]: '退款中',
      [OrderStatus.REFUNDED]: '已退款',
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: OrderStatus): string {
    const colorMap: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: '#757575',
      [OrderStatus.PENDING]: '#f57c00',
      [OrderStatus.PAID]: '#388e3c',
      [OrderStatus.CONFIRMED]: '#1976d2',
      [OrderStatus.PROCESSING]: '#1976d2',
      [OrderStatus.SHIPPED]: '#9c27b0',
      [OrderStatus.DELIVERED]: '#388e3c',
      [OrderStatus.COMPLETED]: '#388e3c',
      [OrderStatus.CANCELLED]: '#757575',
      [OrderStatus.REFUNDING]: '#d32f2f',
      [OrderStatus.REFUNDED]: '#757575',
    };
    return colorMap[status] || '#757575';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
