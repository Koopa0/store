/**
 * 管理後台儀表板
 * Admin Dashboard
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly router = inject(Router);
  /**
   * 統計卡片資料
   */
  readonly stats = signal([
    {
      title: '總訂單',
      value: '1,234',
      change: '+12.5%',
      changeType: 'increase',
      icon: 'shopping_cart',
      color: '#1976d2',
      route: '/admin/orders',
    },
    {
      title: '總銷售額',
      value: 'NT$ 456,789',
      change: '+8.3%',
      changeType: 'increase',
      icon: 'attach_money',
      color: '#388e3c',
      route: null,
    },
    {
      title: '總商品',
      value: '234',
      change: '+5',
      changeType: 'increase',
      icon: 'inventory_2',
      color: '#f57c00',
      route: '/admin/products',
    },
    {
      title: '總用戶',
      value: '5,678',
      change: '+23',
      changeType: 'increase',
      icon: 'people',
      color: '#7b1fa2',
      route: '/admin/users',
    },
  ]);

  /**
   * 待處理事項
   */
  readonly pendingTasks = signal([
    {
      title: '待處理訂單',
      count: 5,
      icon: 'pending_actions',
      color: '#f57c00',
      route: '/admin/orders?status=pending',
    },
    {
      title: '待審核評論',
      count: 2,
      icon: 'rate_review',
      color: '#1976d2',
      route: '/admin/reviews?status=pending',
    },
    {
      title: '庫存不足商品',
      count: 8,
      icon: 'warning',
      color: '#d32f2f',
      route: '/admin/inventory?low-stock=true',
    },
  ]);

  /**
   * 最近訂單（模擬資料）
   */
  readonly recentOrders = signal([
    {
      id: 'ORD-001',
      customer: '王小明',
      amount: 'NT$ 2,580',
      status: 'pending',
      date: new Date('2025-11-20'),
    },
    {
      id: 'ORD-002',
      customer: '李小華',
      amount: 'NT$ 1,290',
      status: 'processing',
      date: new Date('2025-11-20'),
    },
    {
      id: 'ORD-003',
      customer: '張美麗',
      amount: 'NT$ 4,560',
      status: 'completed',
      date: new Date('2025-11-19'),
    },
  ]);

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '待處理',
      processing: '處理中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: '#f57c00',
      processing: '#1976d2',
      completed: '#388e3c',
      cancelled: '#d32f2f',
    };
    return colorMap[status] || '#757575';
  }

  /**
   * 導航到統計卡片路由
   */
  navigateToStat(route: string | null): void {
    if (route) {
      this.router.navigate([route]);
    }
  }
}
