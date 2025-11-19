/**
 * 通知模型
 * Notification Model
 *
 * 用於系統內部通知（訂單狀態變更、促銷活動等）
 * Used for in-app notifications (order status changes, promotions, etc.)
 *
 * 教學重點 / Teaching Points:
 * 1. 通知類型設計
 * 2. 通知資料結構
 * 3. 已讀/未讀狀態管理
 */

/**
 * 通知類型
 * Notification type
 */
export type NotificationType =
  | 'order_created'
  | 'order_paid'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_completed'
  | 'order_cancelled'
  | 'order_refunded'
  | 'promotion'
  | 'system'
  | 'review_replied';

/**
 * 通知優先級
 * Notification priority
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * 用戶通知
 * User Notification
 */
export interface UserNotification {
  /** 通知 ID */
  id: string;

  /** 用戶 ID */
  userId: string;

  /** 通知類型 */
  type: NotificationType;

  /** 優先級 */
  priority: NotificationPriority;

  /** 標題 */
  title: string;

  /** 訊息內容 */
  message: string;

  /** 關聯資料（如訂單 ID、商品 ID 等）*/
  data?: Record<string, any>;

  /** 動作連結（點擊通知後的跳轉路徑）*/
  actionUrl?: string;

  /** 動作文字 */
  actionText?: string;

  /** 圖示（Material Icon 名稱或圖片 URL）*/
  icon?: string;

  /** 是否已讀 */
  isRead: boolean;

  /** 閱讀時間 */
  readAt?: Date;

  /** 創建時間 */
  createdAt: Date;

  /** 版本號（樂觀鎖）*/
  version: number;
}

/**
 * 通知詳情
 * Notification Detail
 *
 * 用於顯示，包含額外的計算欄位
 */
export interface UserNotificationDetail extends UserNotification {
  /** 類型顯示名稱 */
  typeDisplayName: string;

  /** 優先級顯示名稱 */
  priorityDisplayName: string;

  /** 相對時間顯示 */
  relativeTime: string;

  /** 是否為今天 */
  isToday: boolean;
}

/**
 * 創建通知請求
 * Create Notification Request
 */
export interface CreateNotificationRequest {
  /** 用戶 ID（可為陣列，批量創建）*/
  userIds: string | string[];

  /** 通知類型 */
  type: NotificationType;

  /** 優先級 */
  priority?: NotificationPriority;

  /** 標題 */
  title: string;

  /** 訊息內容 */
  message: string;

  /** 關聯資料 */
  data?: Record<string, any>;

  /** 動作連結 */
  actionUrl?: string;

  /** 動作文字 */
  actionText?: string;

  /** 圖示 */
  icon?: string;
}

/**
 * 通知查詢參數
 * Notification Query Parameters
 */
export interface NotificationQueryParams {
  /** 用戶 ID */
  userId: string;

  /** 僅顯示未讀 */
  unreadOnly?: boolean;

  /** 通知類型篩選 */
  type?: NotificationType;

  /** 優先級篩選 */
  priority?: NotificationPriority;

  /** 開始日期 */
  startDate?: Date;

  /** 結束日期 */
  endDate?: Date;

  /** 排序欄位 */
  sortBy?: 'createdAt' | 'priority';

  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';

  /** 頁碼 */
  page?: number;

  /** 每頁筆數 */
  pageSize?: number;
}

/**
 * 通知列表回應
 * Notification List Response
 */
export interface NotificationListResponse {
  /** 通知列表 */
  notifications: UserNotificationDetail[];

  /** 總筆數 */
  total: number;

  /** 未讀筆數 */
  unreadCount: number;

  /** 當前頁碼 */
  page: number;

  /** 每頁筆數 */
  pageSize: number;

  /** 總頁數 */
  totalPages: number;

  /** 是否有下一頁 */
  hasNext: boolean;
}

/**
 * 通知統計
 * Notification Statistics
 */
export interface NotificationStatistics {
  /** 用戶 ID */
  userId: string;

  /** 總通知數 */
  totalCount: number;

  /** 未讀數 */
  unreadCount: number;

  /** 今日新增數 */
  todayCount: number;

  /** 按類型統計 */
  countByType: Record<NotificationType, number>;

  /** 按優先級統計 */
  countByPriority: Record<NotificationPriority, number>;

  /** 最新通知時間 */
  latestNotificationAt?: Date;
}

/**
 * 通知輔助類別
 * Notification Helper
 */
export class NotificationHelper {
  /**
   * 取得通知類型顯示名稱
   * Get notification type display name
   */
  static getTypeDisplayName(type: NotificationType): string {
    const map: Record<NotificationType, string> = {
      order_created: '訂單已建立',
      order_paid: '訂單已付款',
      order_confirmed: '訂單已確認',
      order_shipped: '訂單已發貨',
      order_delivered: '訂單已送達',
      order_completed: '訂單已完成',
      order_cancelled: '訂單已取消',
      order_refunded: '訂單已退款',
      promotion: '促銷活動',
      system: '系統通知',
      review_replied: '評價已回覆',
    };
    return map[type] || type;
  }

  /**
   * 取得優先級顯示名稱
   * Get priority display name
   */
  static getPriorityDisplayName(priority: NotificationPriority): string {
    const map: Record<NotificationPriority, string> = {
      low: '低',
      normal: '普通',
      high: '高',
      urgent: '緊急',
    };
    return map[priority] || priority;
  }

  /**
   * 取得通知類型圖示
   * Get notification type icon
   */
  static getTypeIcon(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
      order_created: 'receipt',
      order_paid: 'payment',
      order_confirmed: 'check_circle',
      order_shipped: 'local_shipping',
      order_delivered: 'home',
      order_completed: 'done_all',
      order_cancelled: 'cancel',
      order_refunded: 'money_off',
      promotion: 'local_offer',
      system: 'info',
      review_replied: 'chat',
    };
    return iconMap[type] || 'notifications';
  }

  /**
   * 取得優先級顏色
   * Get priority color
   */
  static getPriorityColor(priority: NotificationPriority): string {
    const colorMap: Record<NotificationPriority, string> = {
      low: 'default',
      normal: 'primary',
      high: 'accent',
      urgent: 'warn',
    };
    return colorMap[priority] || 'default';
  }

  /**
   * 格式化相對時間
   * Format relative time
   */
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return '剛剛';
    } else if (minutes < 60) {
      return `${minutes} 分鐘前`;
    } else if (hours < 24) {
      return `${hours} 小時前`;
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return new Date(date).toLocaleDateString('zh-TW');
    }
  }

  /**
   * 判斷是否為今天
   * Check if is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    const targetDate = new Date(date);
    return (
      today.getFullYear() === targetDate.getFullYear() &&
      today.getMonth() === targetDate.getMonth() &&
      today.getDate() === targetDate.getDate()
    );
  }

  /**
   * 轉換為詳情格式
   * Convert to detail format
   */
  static toDetail(notification: UserNotification): UserNotificationDetail {
    return {
      ...notification,
      typeDisplayName: this.getTypeDisplayName(notification.type),
      priorityDisplayName: this.getPriorityDisplayName(notification.priority),
      relativeTime: this.getRelativeTime(notification.createdAt),
      isToday: this.isToday(notification.createdAt),
    };
  }

  /**
   * 從訂單狀態創建通知標題和訊息
   * Create notification title and message from order status
   */
  static createOrderNotification(
    type: NotificationType,
    orderNumber: string
  ): { title: string; message: string } {
    const templates: Record<
      NotificationType,
      { title: string; message: string }
    > = {
      order_created: {
        title: '訂單已建立',
        message: `您的訂單 ${orderNumber} 已成功建立`,
      },
      order_paid: {
        title: '付款成功',
        message: `訂單 ${orderNumber} 已完成付款，我們將盡快為您處理`,
      },
      order_confirmed: {
        title: '訂單已確認',
        message: `訂單 ${orderNumber} 已確認，正在準備出貨`,
      },
      order_shipped: {
        title: '訂單已發貨',
        message: `訂單 ${orderNumber} 已發貨，請留意物流通知`,
      },
      order_delivered: {
        title: '訂單已送達',
        message: `訂單 ${orderNumber} 已送達，請確認收貨`,
      },
      order_completed: {
        title: '訂單已完成',
        message: `訂單 ${orderNumber} 已完成，感謝您的購買`,
      },
      order_cancelled: {
        title: '訂單已取消',
        message: `訂單 ${orderNumber} 已取消`,
      },
      order_refunded: {
        title: '訂單已退款',
        message: `訂單 ${orderNumber} 已完成退款，款項將在 3-5 個工作天內退回`,
      },
      promotion: {
        title: '促銷活動',
        message: '新的促銷活動開始了',
      },
      system: {
        title: '系統通知',
        message: '系統通知訊息',
      },
      review_replied: {
        title: '評價已回覆',
        message: '商家已回覆您的評價',
      },
    };

    return (
      templates[type] || {
        title: '通知',
        message: '您有一則新通知',
      }
    );
  }
}
