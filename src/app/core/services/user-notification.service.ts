/**
 * 用戶通知服務
 * User Notification Service
 *
 * 管理用戶的系統通知（訂單狀態變更、促銷活動等）
 * Manages user system notifications (order status changes, promotions, etc.)
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. 未讀數量實時更新
 * 3. 分頁與篩選
 * 4. Mock 資料模擬
 */

import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';

// Models
import {
  UserNotification,
  UserNotificationDetail,
  CreateNotificationRequest,
  NotificationQueryParams,
  NotificationListResponse,
  NotificationStatistics,
  NotificationHelper,
  NotificationType,
} from '@core/models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class UserNotificationService {
  /**
   * 通知列表 Signal
   * Notifications list signal
   */
  private readonly notificationsSignal = signal<UserNotificationDetail[]>([]);

  /**
   * 載入中 Signal
   * Loading signal
   */
  private readonly loadingSignal = signal<boolean>(false);

  /**
   * 未讀數量 Signal
   * Unread count signal
   */
  private readonly unreadCountSignal = signal<number>(0);

  /**
   * 公開的只讀 Signal
   * Public readonly signals
   */
  public readonly notifications = this.notificationsSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly unreadCount = this.unreadCountSignal.asReadonly();

  /**
   * 是否有未讀通知
   * Has unread notifications
   */
  public readonly hasUnread = computed(() => this.unreadCountSignal() > 0);

  /**
   * 建構函式
   * Constructor
   */
  constructor() {
    // 初始化載入通知
    this.loadNotifications('mock-user-id');
  }

  /**
   * 載入通知列表
   * Load notifications list
   */
  private loadNotifications(userId: string): void {
    this.loadingSignal.set(true);

    this.getMockNotifications(userId)
      .pipe(delay(300))
      .subscribe({
        next: (notifications) => {
          const details = notifications.map((n) =>
            NotificationHelper.toDetail(n)
          );
          this.notificationsSignal.set(details);
          this.updateUnreadCount();
          this.loadingSignal.set(false);
        },
        error: (err) => {
          console.error('[UserNotificationService] Failed to load notifications:', err);
          this.loadingSignal.set(false);
        },
      });
  }

  /**
   * 取得通知列表（帶分頁與篩選）
   * Get notifications list (with pagination and filtering)
   */
  getNotifications(
    params: NotificationQueryParams
  ): Observable<NotificationListResponse> {
    this.loadingSignal.set(true);

    return this.getMockNotifications(params.userId).pipe(
      delay(300),
      map((notifications) => {
        let filtered = notifications;

        // 僅顯示未讀
        if (params.unreadOnly) {
          filtered = filtered.filter((n) => !n.isRead);
        }

        // 通知類型篩選
        if (params.type) {
          filtered = filtered.filter((n) => n.type === params.type);
        }

        // 優先級篩選
        if (params.priority) {
          filtered = filtered.filter((n) => n.priority === params.priority);
        }

        // 日期範圍篩選
        if (params.startDate) {
          filtered = filtered.filter(
            (n) => new Date(n.createdAt) >= params.startDate!
          );
        }
        if (params.endDate) {
          filtered = filtered.filter((n) => new Date(n.createdAt) <= params.endDate!);
        }

        // 排序
        const sortBy = params.sortBy || 'createdAt';
        const sortOrder = params.sortOrder || 'desc';

        filtered.sort((a, b) => {
          let aValue: any = a[sortBy];
          let bValue: any = b[sortBy];

          if (sortBy === 'createdAt') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        // 分頁
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedNotifications = filtered.slice(startIndex, endIndex);

        // 轉換為詳情格式
        const details = paginatedNotifications.map((n) =>
          NotificationHelper.toDetail(n)
        );

        const total = filtered.length;
        const unreadCount = filtered.filter((n) => !n.isRead).length;
        const totalPages = Math.ceil(total / pageSize);

        this.notificationsSignal.set(details);
        this.unreadCountSignal.set(unreadCount);
        this.loadingSignal.set(false);

        return {
          notifications: details,
          total,
          unreadCount,
          page,
          pageSize,
          totalPages,
          hasNext: page < totalPages,
        };
      })
    );
  }

  /**
   * 創建通知
   * Create notification
   */
  createNotification(
    request: CreateNotificationRequest
  ): Observable<UserNotificationDetail> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const userIds = Array.isArray(request.userIds)
          ? request.userIds
          : [request.userIds];

        // 為每個用戶創建通知（Mock 只創建一個）
        const userId = userIds[0];

        const notification: UserNotification = {
          id: `notif-${Date.now()}`,
          userId,
          type: request.type,
          priority: request.priority || 'normal',
          title: request.title,
          message: request.message,
          data: request.data,
          actionUrl: request.actionUrl,
          actionText: request.actionText,
          icon: request.icon || NotificationHelper.getTypeIcon(request.type),
          isRead: false,
          createdAt: new Date(),
          version: 1,
        };

        // 加入列表
        const current = this.notificationsSignal();
        const detail = NotificationHelper.toDetail(notification);
        this.notificationsSignal.set([detail, ...current]);
        this.updateUnreadCount();

        console.log('[UserNotificationService] Notification created:', notification);
        return detail;
      })
    );
  }

  /**
   * 標記為已讀
   * Mark as read
   */
  markAsRead(notificationId: string): Observable<void> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const notifications = this.notificationsSignal();
        const updated = notifications.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        );
        this.notificationsSignal.set(updated);
        this.updateUnreadCount();
        console.log('[UserNotificationService] Notification marked as read:', notificationId);
      })
    );
  }

  /**
   * 全部標記為已讀
   * Mark all as read
   */
  markAllAsRead(userId: string): Observable<void> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const notifications = this.notificationsSignal();
        const updated = notifications.map((n) =>
          n.userId === userId && !n.isRead
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        );
        this.notificationsSignal.set(updated);
        this.updateUnreadCount();
        console.log('[UserNotificationService] All notifications marked as read');
      })
    );
  }

  /**
   * 刪除通知
   * Delete notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const notifications = this.notificationsSignal();
        const updated = notifications.filter((n) => n.id !== notificationId);
        this.notificationsSignal.set(updated);
        this.updateUnreadCount();
        console.log('[UserNotificationService] Notification deleted:', notificationId);
      })
    );
  }

  /**
   * 取得統計資料
   * Get statistics
   */
  getStatistics(userId: string): Observable<NotificationStatistics> {
    return this.getMockNotifications(userId).pipe(
      delay(200),
      map((notifications) => {
        const userNotifications = notifications.filter((n) => n.userId === userId);
        const unreadCount = userNotifications.filter((n) => !n.isRead).length;

        // 今日通知數
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = userNotifications.filter(
          (n) => new Date(n.createdAt) >= today
        ).length;

        // 按類型統計
        const countByType: Record<NotificationType, number> = {
          order_created: 0,
          order_paid: 0,
          order_confirmed: 0,
          order_shipped: 0,
          order_delivered: 0,
          order_completed: 0,
          order_cancelled: 0,
          order_refunded: 0,
          promotion: 0,
          system: 0,
          review_replied: 0,
        };

        userNotifications.forEach((n) => {
          countByType[n.type] = (countByType[n.type] || 0) + 1;
        });

        // 按優先級統計
        const countByPriority: Record<string, number> = {
          low: 0,
          normal: 0,
          high: 0,
          urgent: 0,
        };

        userNotifications.forEach((n) => {
          countByPriority[n.priority] = (countByPriority[n.priority] || 0) + 1;
        });

        // 最新通知時間
        const latestNotificationAt =
          userNotifications.length > 0
            ? new Date(
                Math.max(
                  ...userNotifications.map((n) => new Date(n.createdAt).getTime())
                )
              )
            : undefined;

        const statistics: NotificationStatistics = {
          userId,
          totalCount: userNotifications.length,
          unreadCount,
          todayCount,
          countByType,
          countByPriority: countByPriority as any,
          latestNotificationAt,
        };

        return statistics;
      })
    );
  }

  /**
   * 更新未讀數量
   * Update unread count
   */
  private updateUnreadCount(): void {
    const notifications = this.notificationsSignal();
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    this.unreadCountSignal.set(unreadCount);
  }

  /**
   * 取得 Mock 通知資料
   * Get mock notification data
   */
  private getMockNotifications(userId: string): Observable<UserNotification[]> {
    const now = new Date();
    const mockNotifications: UserNotification[] = [
      {
        id: 'notif-1',
        userId: 'mock-user-id',
        type: 'order_paid',
        priority: 'high',
        title: '付款成功',
        message: '訂單 ORD-20241119-00001 已完成付款，我們將盡快為您處理',
        data: {
          orderId: 'order-1',
          orderNumber: 'ORD-20241119-00001',
        },
        actionUrl: '/orders/order-1',
        actionText: '查看訂單',
        icon: 'payment',
        isRead: false,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 分鐘前
        version: 1,
      },
      {
        id: 'notif-2',
        userId: 'mock-user-id',
        type: 'order_confirmed',
        priority: 'normal',
        title: '訂單已確認',
        message: '訂單 ORD-20241118-00005 已確認，正在準備出貨',
        data: {
          orderId: 'order-2',
          orderNumber: 'ORD-20241118-00005',
        },
        actionUrl: '/orders/order-2',
        actionText: '查看訂單',
        icon: 'check_circle',
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 小時前
        version: 1,
      },
      {
        id: 'notif-3',
        userId: 'mock-user-id',
        type: 'order_shipped',
        priority: 'normal',
        title: '訂單已發貨',
        message: '訂單 ORD-20241117-00003 已發貨，請留意物流通知',
        data: {
          orderId: 'order-3',
          orderNumber: 'ORD-20241117-00003',
        },
        actionUrl: '/orders/order-3',
        actionText: '追蹤物流',
        icon: 'local_shipping',
        isRead: true,
        readAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 天前
        version: 1,
      },
      {
        id: 'notif-4',
        userId: 'mock-user-id',
        type: 'promotion',
        priority: 'low',
        title: '雙11優惠活動開始',
        message: '全館商品 8 折起，限時 3 天！',
        data: {
          promotionId: 'promo-1',
        },
        actionUrl: '/promotions/promo-1',
        actionText: '查看活動',
        icon: 'local_offer',
        isRead: true,
        readAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 天前
        version: 1,
      },
      {
        id: 'notif-5',
        userId: 'mock-user-id',
        type: 'order_delivered',
        priority: 'normal',
        title: '訂單已送達',
        message: '訂單 ORD-20241115-00002 已送達，請確認收貨',
        data: {
          orderId: 'order-4',
          orderNumber: 'ORD-20241115-00002',
        },
        actionUrl: '/orders/order-4',
        actionText: '確認收貨',
        icon: 'home',
        isRead: true,
        readAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 天前
        version: 1,
      },
    ];

    return of(mockNotifications);
  }
}
