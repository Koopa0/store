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
import { Observable, of, delay, map, catchError, throwError } from 'rxjs';
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

/**
 * Mock 訂單資料
 * Mock order data (用於示範，實際會從購物車創建)
 */
const MOCK_ORDERS: OrderDetail[] = [];

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private readonly useMock = true; // TODO: 後端完成後改為 false

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

    return of(order);
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

    return of(order);
  }

  /**
   * Mock: 取消訂單
   */
  private mockCancelOrder(orderId: string, reason?: string): Observable<Order> {
    return this.mockUpdateOrderStatus(orderId, OrderStatus.CANCELLED);
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
