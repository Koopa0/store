/**
 * 通知中心組件
 * Notification Center Component
 *
 * 顯示用戶通知列表、未讀數量、標記已讀等功能
 * Displays user notifications, unread count, mark as read functionality
 *
 * 教學重點 / Teaching Points:
 * 1. Material Menu 實現下拉面板
 * 2. Signal 實現響應式 UI
 * 3. 通知點擊導航
 * 4. 標記已讀功能
 */

import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Material Modules
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// i18n
import { TranslateModule } from '@ngx-translate/core';

// Services
import { UserNotificationService } from '@core/services/user-notification.service';
import { LoggerService } from '@core/services';

// Models
import {
  UserNotificationDetail,
  NotificationHelper,
} from '@core/models/notification.model';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent implements OnInit {
  /**
   * 服務注入 / Service Injection
   */
  private readonly notificationService = inject(UserNotificationService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  /**
   * 公開的 Signal / Public Signals
   */
  public readonly notifications = this.notificationService.notifications;
  public readonly loading = this.notificationService.loading;
  public readonly unreadCount = this.notificationService.unreadCount;
  public readonly hasUnread = this.notificationService.hasUnread;

  /**
   * Helper 類別 / Helper Class
   */
  public readonly NotificationHelper = NotificationHelper;

  /**
   * 最大顯示通知數量 / Maximum notifications to display
   */
  private readonly MAX_DISPLAY = 5;

  /**
   * 初始化 / Initialization
   */
  ngOnInit(): void {
    this.loadNotifications();
  }

  /**
   * 載入通知 / Load notifications
   */
  private loadNotifications(): void {
    this.notificationService
      .getNotifications({
        userId: 'mock-user-id',
        page: 1,
        pageSize: this.MAX_DISPLAY,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (response) => {
          this.logger.info('[NotificationCenter] Loaded notifications:', response);
        },
        error: (err) => {
          this.logger.error('[NotificationCenter] Failed to load notifications:', err);
        },
      });
  }

  /**
   * 取得顯示的通知列表 / Get displayed notifications
   */
  getDisplayNotifications(): UserNotificationDetail[] {
    const allNotifications = this.notifications();
    return allNotifications.slice(0, this.MAX_DISPLAY);
  }

  /**
   * 點擊通知 / Click notification
   */
  onNotificationClick(notification: UserNotificationDetail): void {
    // 標記為已讀
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.logger.info('[NotificationCenter] Marked as read:', notification.id);
        },
        error: (err) => {
          this.logger.error('[NotificationCenter] Failed to mark as read:', err);
        },
      });
    }

    // 導航到目標頁面
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  /**
   * 全部標記為已讀 / Mark all as read
   */
  onMarkAllAsRead(): void {
    this.notificationService.markAllAsRead('mock-user-id').subscribe({
      next: () => {
        this.logger.info('[NotificationCenter] All notifications marked as read');
      },
      error: (err) => {
        this.logger.error('[NotificationCenter] Failed to mark all as read:', err);
      },
    });
  }

  /**
   * 查看所有通知 / View all notifications
   */
  onViewAll(): void {
    this.router.navigate(['/notifications']);
  }

  /**
   * 取得通知圖示顏色 / Get notification icon color
   */
  getNotificationIconColor(notification: UserNotificationDetail): string {
    if (notification.isRead) {
      return 'text-gray-400';
    }
    return NotificationHelper.getPriorityColor(notification.priority);
  }

  /**
   * 取得通知標題樣式 / Get notification title style
   */
  getNotificationTitleClass(notification: UserNotificationDetail): string {
    return notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium';
  }

  /**
   * 取得通知訊息樣式 / Get notification message style
   */
  getNotificationMessageClass(notification: UserNotificationDetail): string {
    return notification.isRead ? 'text-gray-400' : 'text-gray-600';
  }

  /**
   * 刪除通知 / Delete notification
   */
  onDeleteNotification(event: Event, notificationId: string): void {
    // 阻止事件冒泡，避免觸發通知點擊
    event.stopPropagation();

    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.logger.info('[NotificationCenter] Notification deleted:', notificationId);
      },
      error: (err) => {
        this.logger.error('[NotificationCenter] Failed to delete notification:', err);
      },
    });
  }

  /**
   * TrackBy 函數用於 *ngFor 效能優化
   * TrackBy function for *ngFor performance optimization
   */
  trackByNotificationId(index: number, notification: UserNotificationDetail): string {
    return notification.id;
  }
}
