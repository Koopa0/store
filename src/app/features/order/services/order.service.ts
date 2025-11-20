/**
 * 訂單服務
 * Order Service
 *
 * 管理訂單的所有操作
 * Manages all order operations
 *
 * 教學重點 / Teaching Points:
 * 1. RESTful API 服務模式
 * 2. Observable 和 RxJS 操作符
 * 3. Signal-based 狀態管理
 * 4. Mock 資料模擬後端
 * 5. 訂單生命週期管理
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, catchError, throwError, switchMap, forkJoin } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Order,
  OrderDetail,
  OrderItem,
  OrderStatus,
  OrderAddress,
  CreateOrderRequest,
} from '@core/models/order.model';
import { PaginatedResponse, ApiResponse } from '@core/models/common.model';
import { InventoryService } from '@core/services/inventory.service';
import { StorageService } from '@core/services/storage.service';
import { CreateInventoryTransactionRequest } from '@core/models/inventory.model';
import { UserNotificationService } from '@core/services/user-notification.service';
import {
  CreateNotificationRequest,
  NotificationType,
  NotificationHelper,
} from '@core/models/notification.model';

/**
 * LocalStorage 儲存鍵
 */
const STORAGE_KEY = 'mock_orders';

/**
 * 從 localStorage 載入訂單
 */
function loadOrdersFromStorage(storage: StorageService): OrderDetail[] {
  try {
    const stored = storage.get<OrderDetail[]>(STORAGE_KEY);
    if (Array.isArray(stored)) {
      // 轉換日期字符串回 Date 對象
      return stored.map(order => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        confirmedAt: order.confirmedAt ? new Date(order.confirmedAt) : undefined,
        paidAt: order.paidAt ? new Date(order.paidAt) : undefined,
        shippedAt: order.shippedAt ? new Date(order.shippedAt) : undefined,
        deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
        completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
        cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : undefined,
        refundedAt: order.refundedAt ? new Date(order.refundedAt) : undefined,
        items: order.items.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
          shippedAt: item.shippedAt ? new Date(item.shippedAt) : undefined,
          returnedAt: item.returnedAt ? new Date(item.returnedAt) : undefined,
        })),
      }));
    }
  } catch (error) {
    console.error('[OrderService] Failed to load orders from storage:', error);
  }
  return [];
}

/**
 * 保存訂單到 localStorage
 */
function saveOrdersToStorage(storage: StorageService, orders: OrderDetail[]): void {
  try {
    storage.set(STORAGE_KEY, orders);
  } catch (error) {
    console.error('[OrderService] Failed to save orders to storage:', error);
  }
}

/**
 * Mock 訂單資料
 * Mock order data (用於示範，實際會從購物車創建)
 */
let MOCK_ORDERS: OrderDetail[] = [];

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(UserNotificationService);
  private readonly storageService = inject(StorageService);
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private readonly useMock = true; // TODO: 後端完成後改為 false

  constructor() {
    // 從 localStorage 載入訂單
    if (this.useMock) {
      MOCK_ORDERS = loadOrdersFromStorage(this.storageService);
      console.log('[OrderService] Loaded orders from storage:', MOCK_ORDERS.length);
    }
  }

  /**
   * 當前訂單 Signal
   * Current order signal
   */
  private readonly currentOrderSignal = signal<OrderDetail | null>(null);

  /**
   * 載入狀態 Signal
   * Loading state signal
   */
  private readonly loadingSignal = signal<boolean>(false);

  /**
   * 錯誤訊息 Signal
   * Error message signal
   */
  private readonly errorSignal = signal<string | null>(null);

  /**
   * 公開的唯讀 Signals
   * Public readonly signals
   */
  public readonly currentOrder = this.currentOrderSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();

  /**
   * 是否有當前訂單
   * Has current order
   */
  public readonly hasCurrentOrder = computed(() => this.currentOrderSignal() !== null);

  /**
   * 建立訂單
   * Create order
   *
   * @param request 建立訂單請求
   * @returns Observable<OrderDetail>
   *
   * 教學說明：
   * 1. 從購物車創建訂單
   * 2. 保存地址快照（防止後續地址變更影響訂單）
   * 3. 自動生成訂單編號（由後端 trigger 處理）
   * 4. 扣除庫存
   */
  createOrder(request: CreateOrderRequest): Observable<OrderDetail> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    if (this.useMock) {
      return this.mockCreateOrder(request).pipe(
        delay(1000), // 模擬網路延遲
        map((order) => {
          this.currentOrderSignal.set(order);
          this.loadingSignal.set(false);
          return order;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
    }

    return this.http
      .post<ApiResponse<OrderDetail>>(`${this.apiUrl}`, request)
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error('No order data in response');
          }
          const order = response.data;
          this.currentOrderSignal.set(order);
          this.loadingSignal.set(false);
          return order;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * 取得訂單詳情
   * Get order detail
   *
   * @param orderId 訂單 ID
   * @returns Observable<OrderDetail>
   */
  getOrder(orderId: string): Observable<OrderDetail> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    if (this.useMock) {
      return this.mockGetOrder(orderId).pipe(
        delay(500),
        map((order) => {
          this.currentOrderSignal.set(order);
          this.loadingSignal.set(false);
          return order;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
    }

    return this.http.get<ApiResponse<OrderDetail>>(`${this.apiUrl}/${orderId}`).pipe(
      map((response) => {
        if (!response.data) {
          throw new Error('No order data in response');
        }
        const order = response.data;
        this.currentOrderSignal.set(order);
        this.loadingSignal.set(false);
        return order;
      }),
      catchError((error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * 根據訂單編號取得訂單
   * Get order by order number
   *
   * @param orderNumber 訂單編號
   * @returns Observable<OrderDetail>
   */
  getOrderByNumber(orderNumber: string): Observable<OrderDetail> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    if (this.useMock) {
      return this.mockGetOrderByNumber(orderNumber).pipe(
        delay(500),
        map((order) => {
          this.currentOrderSignal.set(order);
          this.loadingSignal.set(false);
          return order;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
    }

    return this.http
      .get<ApiResponse<OrderDetail>>(`${this.apiUrl}/number/${orderNumber}`)
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error('No order data in response');
          }
          const order = response.data;
          this.currentOrderSignal.set(order);
          this.loadingSignal.set(false);
          return order;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * 取得用戶的所有訂單
   * Get user's all orders
   *
   * @param userId 用戶 ID
   * @param page 頁碼
   * @param limit 每頁筆數
   * @returns Observable<PaginatedResponse<Order>>
   */
  getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Observable<PaginatedResponse<Order>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    if (this.useMock) {
      return this.mockGetUserOrders(userId, page, limit).pipe(
        delay(500),
        map((response) => {
          this.loadingSignal.set(false);
          return response;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
    }

    return this.http
      .get<PaginatedResponse<Order>>(`${this.apiUrl}/user/${userId}`, {
        params: {
          page: page.toString(),
          pageSize: limit.toString()
        },
      })
      .pipe(
        map((response) => {
          this.loadingSignal.set(false);
          return response;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * 更新訂單狀態
   * Update order status
   *
   * @param orderId 訂單 ID
   * @param status 新狀態
   * @returns Observable<Order>
   */
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    if (this.useMock) {
      return this.mockUpdateOrderStatus(orderId, status).pipe(
        delay(500),
        map((order) => {
          this.loadingSignal.set(false);
          return order;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
    }

    return this.http
      .patch<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/status`, { status })
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error('No order data in response');
          }
          const order = response.data;
          this.loadingSignal.set(false);
          return order;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * 取消訂單
   * Cancel order
   *
   * @param orderId 訂單 ID
   * @param reason 取消原因
   * @returns Observable<Order>
   */
  cancelOrder(orderId: string, reason?: string): Observable<Order> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    if (this.useMock) {
      return this.mockCancelOrder(orderId, reason).pipe(
        delay(500),
        map((order) => {
          this.loadingSignal.set(false);
          return order;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
    }

    return this.http
      .post<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/cancel`, { reason })
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error('No order data in response');
          }
          const order = response.data;
          this.loadingSignal.set(false);
          return order;
        }),
        catchError((error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * 清除當前訂單
   * Clear current order
   */
  clearCurrentOrder(): void {
    this.currentOrderSignal.set(null);
  }

  // ============================================================================
  // Mock 方法（模擬後端 API）
  // Mock methods (simulating backend API)
  // ============================================================================

  /**
   * Mock: 創建訂單
   */
  private mockCreateOrder(request: CreateOrderRequest): Observable<OrderDetail> {
    // 模擬從購物車轉換為訂單
    // TODO: 實際應從 CartService 取得購物車資料

    const now = new Date();
    const orderNumber = this.generateMockOrderNumber(now);

    // 模擬訂單項目（實際應從購物車取得）
    const mockItems: OrderItem[] = [
      {
        id: crypto.randomUUID(),
        orderId: '',  // 稍後設定
        productId: '1',
        variantId: undefined,
        productSnapshot: {
          name: 'iPhone 15 Pro Max',
          sku: 'IPH15PM-256-BLK',
          imageUrl: '/assets/images/products/iphone-15-pro-max-1.jpg',
        },
        quantity: 1,
        unitPrice: 36900,
        subtotal: 36900,
        discountAmount: 0,
        finalAmount: 36900,
        isShipped: false,
        isReturned: false,
        version: 1,
        createdAt: now,
      },
    ];

    const subtotal = mockItems.reduce((sum, item) => sum + item.finalAmount, 0);
    const shippingFee = subtotal >= 1000 ? 0 : 100; // 滿千免運
    const taxAmount = Math.round(subtotal * 0.05); // 5% 稅

    const order: OrderDetail = {
      id: crypto.randomUUID(),
      orderNumber,
      userId: 'mock-user-id', // TODO: 從 AuthService 取得
      status: OrderStatus.PENDING,
      subtotal,
      shippingFee,
      taxAmount,
      discountAmount: 0,
      totalAmount: subtotal + shippingFee + taxAmount,
      currencyCode: 'TWD',
      exchangeRate: 1,
      shippingAddress: {
        recipientName: '測試用戶',
        recipientPhone: '+886912345678',
        countryCode: 'TW',
        postalCode: '106',
        city: '台北市',
        district: '大安區',
        streetAddress: '測試路123號',
      },
      promotionCodes: request.promotionCodes || [],
      promotionDiscount: 0,
      customerNote: request.customerNote,
      version: 1,
      createdAt: now,
      updatedAt: now,
      items: mockItems.map(item => ({ ...item, orderId: order.id })),
    };

    // 儲存到 Mock 資料庫
    MOCK_ORDERS.push(order);

    // 保存到 localStorage
    saveOrdersToStorage(this.storageService, MOCK_ORDERS);

    // 創建訂單建立通知
    return this.createNotificationForOrderStatus(order, OrderStatus.PENDING).pipe(
      map(() => order)
    );
  }

  /**
   * Mock: 取得訂單
   */
  private mockGetOrder(orderId: string): Observable<OrderDetail> {
    const order = MOCK_ORDERS.find((o) => o.id === orderId);
    if (!order) {
      return throwError(() => new Error(`Order not found: ${orderId}`));
    }
    return of(order);
  }

  /**
   * Mock: 根據訂單編號取得訂單
   */
  private mockGetOrderByNumber(orderNumber: string): Observable<OrderDetail> {
    const order = MOCK_ORDERS.find((o) => o.orderNumber === orderNumber);
    if (!order) {
      return throwError(() => new Error(`Order not found: ${orderNumber}`));
    }
    return of(order);
  }

  /**
   * Mock: 取得用戶訂單列表
   */
  private mockGetUserOrders(
    userId: string,
    page: number,
    limit: number
  ): Observable<PaginatedResponse<Order>> {
    const userOrders = MOCK_ORDERS.filter((o) => o.userId === userId);
    const total = userOrders.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = userOrders.slice(start, end);

    return of({
      items,
      totalItems: total,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    });
  }

  /**
   * Mock: 更新訂單狀態
   */
  private mockUpdateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Observable<Order> {
    const order = MOCK_ORDERS.find((o) => o.id === orderId);
    if (!order) {
      return throwError(() => new Error(`Order not found: ${orderId}`));
    }

    // 更新狀態和相應的時間戳
    order.status = status;
    order.updatedAt = new Date();

    switch (status) {
      case OrderStatus.PAID:
        order.paidAt = new Date();
        break;
      case OrderStatus.CONFIRMED:
        order.confirmedAt = new Date();
        break;
      case OrderStatus.SHIPPED:
        order.shippedAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        order.deliveredAt = new Date();
        break;
      case OrderStatus.COMPLETED:
        order.completedAt = new Date();
        break;
      case OrderStatus.CANCELLED:
        order.cancelledAt = new Date();
        break;
      case OrderStatus.REFUNDED:
        order.refundedAt = new Date();
        break;
    }

    // 保存到 localStorage
    saveOrdersToStorage(this.storageService, MOCK_ORDERS);

    // 創建庫存交易記錄（僅當訂單付款時）
    if (status === OrderStatus.PAID) {
      return this.createInventoryTransactionsForOrder(order, 'sale').pipe(
        switchMap(() => this.createNotificationForOrderStatus(order, status)),
        map(() => order)
      );
    }

    // 創建狀態變更通知
    return this.createNotificationForOrderStatus(order, status).pipe(
      map(() => order)
    );
  }

  /**
   * Mock: 取消訂單
   */
  private mockCancelOrder(orderId: string, reason?: string): Observable<Order> {
    const order = MOCK_ORDERS.find((o) => o.id === orderId);
    if (!order) {
      return throwError(() => new Error(`Order not found: ${orderId}`));
    }

    // 更新訂單狀態為取消
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.updatedAt = new Date();

    // 保存到 localStorage
    saveOrdersToStorage(this.storageService, MOCK_ORDERS);

    // 如果訂單已付款，需要創建退貨交易恢復庫存
    if (order.paidAt) {
      return this.createInventoryTransactionsForOrder(order, 'return').pipe(
        switchMap(() => this.createNotificationForOrderStatus(order, OrderStatus.CANCELLED)),
        map(() => order)
      );
    }

    // 創建取消通知
    return this.createNotificationForOrderStatus(order, OrderStatus.CANCELLED).pipe(
      map(() => order)
    );
  }

  /**
   * 為訂單創建庫存交易記錄
   * Create inventory transactions for order
   *
   * @param order 訂單詳情
   * @param type 交易類型 ('sale' 或 'return')
   * @returns Observable<void>
   */
  private createInventoryTransactionsForOrder(
    order: OrderDetail,
    type: 'sale' | 'return'
  ): Observable<void> {
    // 為每個訂單項目創建庫存交易
    const transactionRequests: Observable<any>[] = order.items.map((item) => {
      const request: CreateInventoryTransactionRequest = {
        productId: item.productId,
        variantId: item.variantId,
        type: type,
        quantityChange: type === 'sale' ? -item.quantity : item.quantity,
        referenceType: 'order',
        referenceId: order.id,
        referenceNumber: order.orderNumber,
        note:
          type === 'sale'
            ? `訂單銷售出庫 - ${item.productSnapshot.name}`
            : `訂單取消退貨入庫 - ${item.productSnapshot.name}`,
      };

      return this.inventoryService.createTransaction(request);
    });

    // 等待所有交易創建完成
    if (transactionRequests.length === 0) {
      return of(void 0);
    }

    return forkJoin(transactionRequests).pipe(
      map(() => {
        console.log(
          `[OrderService] Created ${transactionRequests.length} inventory transactions for order ${order.orderNumber} (${type})`
        );
      })
    );
  }

  /**
   * 為訂單狀態變更創建通知
   * Create notification for order status change
   *
   * @param order 訂單詳情
   * @param status 新的訂單狀態
   * @returns Observable<void>
   */
  private createNotificationForOrderStatus(
    order: OrderDetail,
    status: OrderStatus
  ): Observable<void> {
    // 將訂單狀態映射到通知類型
    const statusToNotificationType: Partial<Record<OrderStatus, NotificationType>> = {
      [OrderStatus.PENDING]: 'order_created',
      [OrderStatus.PAID]: 'order_paid',
      [OrderStatus.CONFIRMED]: 'order_confirmed',
      [OrderStatus.SHIPPED]: 'order_shipped',
      [OrderStatus.DELIVERED]: 'order_delivered',
      [OrderStatus.COMPLETED]: 'order_completed',
      [OrderStatus.CANCELLED]: 'order_cancelled',
      [OrderStatus.REFUNDED]: 'order_refunded',
    };

    const notificationType = statusToNotificationType[status];
    if (!notificationType) {
      // 某些狀態不需要通知
      return of(void 0);
    }

    // 使用 NotificationHelper 創建通知內容
    const notificationContent = NotificationHelper.createOrderNotification(
      notificationType,
      order.orderNumber
    );

    // 根據狀態設定優先級
    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
    if (status === OrderStatus.PAID || status === OrderStatus.DELIVERED) {
      priority = 'high';
    } else if (status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED) {
      priority = 'normal';
    }

    const request: CreateNotificationRequest = {
      userIds: order.userId, // 可以是單個 userId 或 userId 陣列
      type: notificationType,
      priority: priority,
      title: notificationContent.title,
      message: notificationContent.message,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: status,
      },
      actionUrl: `/orders/${order.id}`,
      actionText: '查看訂單',
      icon: NotificationHelper.getTypeIcon(notificationType),
    };

    return this.notificationService.createNotification(request).pipe(
      map(() => {
        console.log(
          `[OrderService] Created notification for order ${order.orderNumber} - ${status}`
        );
      })
    );
  }

  /**
   * Mock: 生成訂單編號
   * 格式: ORD-YYYYMMDD-XXXXX
   *
   * 注意：實際由資料庫 trigger 生成
   */
  private generateMockOrderNumber(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(MOCK_ORDERS.length + 1).padStart(5, '0');

    return `ORD-${year}${month}${day}-${sequence}`;
  }
}
