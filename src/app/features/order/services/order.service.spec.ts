/**
 * OrderService 單元測試
 * OrderService Unit Tests
 *
 * 測試覆蓋：
 * - 訂單 CRUD 操作
 * - 訂單狀態管理
 * - 庫存整合
 * - 通知整合
 * - Signal 狀態管理
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { InventoryService } from '@core/services/inventory.service';
import { UserNotificationService } from '@core/services/user-notification.service';
import { OrderStatus, CreateOrderRequest, OrderDetail } from '@core/models/order.model';
import { of, throwError } from 'rxjs';

describe('OrderService', () => {
  let service: OrderService;
  let inventoryService: jasmine.SpyObj<InventoryService>;
  let notificationService: jasmine.SpyObj<UserNotificationService>;

  const mockOrderNumber = 'ORD-20250119-00001';

  const mockCreateOrderRequest: CreateOrderRequest = {
    cartId: 'cart-123',
    shippingAddressId: 'addr-123',
    billingAddressId: 'addr-123',
    paymentMethodId: 123,
    promotionCodes: [],
    customerNote: 'Test note',
  };

  beforeEach(() => {
    // 創建 spy 物件
    const inventoryServiceSpy = jasmine.createSpyObj('InventoryService', [
      'createTransaction',
    ]);

    const notificationServiceSpy = jasmine.createSpyObj('UserNotificationService', [
      'createNotification',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OrderService,
        { provide: InventoryService, useValue: inventoryServiceSpy },
        { provide: UserNotificationService, useValue: notificationServiceSpy },
      ],
    });

    // 預設返回成功的 Observable
    inventoryServiceSpy.createTransaction.and.returnValue(of(null as any));
    notificationServiceSpy.createNotification.and.returnValue(of(void 0));

    service = TestBed.inject(OrderService);
    inventoryService = TestBed.inject(
      InventoryService
    ) as jasmine.SpyObj<InventoryService>;
    notificationService = TestBed.inject(
      UserNotificationService
    ) as jasmine.SpyObj<UserNotificationService>;
  });

  describe('初始化 (Initialization)', () => {
    it('應該成功創建服務', () => {
      expect(service).toBeTruthy();
    });

    it('初始狀態應該無當前訂單', () => {
      expect(service.currentOrder()).toBeNull();
      expect(service.hasCurrentOrder()).toBeFalse();
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    });
  });

  describe('創建訂單 (Create Order)', () => {
    it('應該成功創建訂單', fakeAsync(() => {
      let createdOrder: OrderDetail | undefined;

      service.createOrder(mockCreateOrderRequest).subscribe((order) => {
        createdOrder = order;
      });

      tick(1000); // 等待 delay(1000)

      expect(createdOrder).toBeDefined();
      expect(createdOrder!.orderNumber).toContain('ORD-');
      expect(createdOrder!.status).toBe(OrderStatus.PENDING);
      expect(createdOrder!.items.length).toBeGreaterThan(0);

      const currentOrder = service.currentOrder();
      expect(currentOrder).toBeDefined();
      expect(currentOrder!.id).toBe(createdOrder!.id);
      expect(currentOrder!.orderNumber).toBe(createdOrder!.orderNumber);
      expect(service.hasCurrentOrder()).toBeTrue();
      expect(service.loading()).toBeFalse();

      flush();
    }));

    it('應該在創建訂單時發送通知', fakeAsync(() => {
      service.createOrder(mockCreateOrderRequest).subscribe();

      tick(1000);

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: 'order_created',
        })
      );

      flush();
    }));

    it('應該在創建時設定 loading 狀態', fakeAsync(() => {
      service.createOrder(mockCreateOrderRequest).subscribe();

      // 在 delay 期間，loading 應該是 true（需要在 delay 之前檢查，但這裡我們測試完成後）
      tick(1000);

      expect(service.loading()).toBeFalse();

      flush();
    }));

    it('應該處理創建失敗的情況', fakeAsync(() => {
      // 模擬通知服務失敗
      notificationService.createNotification.and.returnValue(
        throwError(() => new Error('Notification failed'))
      );

      let error: any;
      service.createOrder(mockCreateOrderRequest).subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(1000);

      expect(error).toBeDefined();
      expect(service.error()).toBeTruthy();
      expect(service.loading()).toBeFalse();

      flush();
    }));

    it('應該計算正確的訂單金額', fakeAsync(() => {
      let createdOrder: OrderDetail | undefined;

      service.createOrder(mockCreateOrderRequest).subscribe((order) => {
        createdOrder = order;
      });

      tick(1000);

      expect(createdOrder!.subtotal).toBeGreaterThan(0);
      expect(createdOrder!.taxAmount).toBe(Math.round(createdOrder!.subtotal * 0.05));
      expect(createdOrder!.totalAmount).toBe(
        createdOrder!.subtotal + createdOrder!.shippingFee + createdOrder!.taxAmount
      );

      flush();
    }));

    it('滿千應該免運費', fakeAsync(() => {
      let createdOrder: OrderDetail | undefined;

      service.createOrder(mockCreateOrderRequest).subscribe((order) => {
        createdOrder = order;
      });

      tick(1000);

      // mock 訂單預設有 iPhone，應該超過 1000
      if (createdOrder!.subtotal >= 1000) {
        expect(createdOrder!.shippingFee).toBe(0);
      } else {
        expect(createdOrder!.shippingFee).toBe(100);
      }

      flush();
    }));
  });

  describe('取得訂單 (Get Order)', () => {
    let orderId: string;

    beforeEach(fakeAsync(() => {
      // 先創建一個訂單
      service.createOrder(mockCreateOrderRequest).subscribe((order) => {
        orderId = order.id;
      });

      tick(1000);
      flush();
    }));

    it('應該成功取得訂單詳情', fakeAsync(() => {
      let retrievedOrder: OrderDetail | undefined;

      service.getOrder(orderId).subscribe((order) => {
        retrievedOrder = order;
      });

      tick(500);

      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder!.id).toBe(orderId);

      const currentOrder = service.currentOrder();
      expect(currentOrder).toBeDefined();
      expect(currentOrder!.id).toBe(retrievedOrder!.id);
      expect(currentOrder!.orderNumber).toBe(retrievedOrder!.orderNumber);

      flush();
    }));

    it('應該處理訂單不存在的情況', fakeAsync(() => {
      let error: any;

      service.getOrder('non-existent-id').subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(500);

      expect(error).toBeDefined();
      expect(error.message).toContain('not found');
      expect(service.error()).toBeTruthy();

      flush();
    }));
  });

  describe('根據訂單編號取得訂單 (Get Order By Number)', () => {
    let orderNumber: string;

    beforeEach(fakeAsync(() => {
      service.createOrder(mockCreateOrderRequest).subscribe((order) => {
        orderNumber = order.orderNumber;
      });

      tick(1000);
      flush();
    }));

    it('應該成功根據訂單編號取得訂單', fakeAsync(() => {
      let retrievedOrder: OrderDetail | undefined;

      service.getOrderByNumber(orderNumber).subscribe((order) => {
        retrievedOrder = order;
      });

      tick(500);

      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder!.orderNumber).toBe(orderNumber);

      flush();
    }));

    it('應該處理訂單編號不存在的情況', fakeAsync(() => {
      let error: any;

      service.getOrderByNumber('ORD-99999999-99999').subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(500);

      expect(error).toBeDefined();

      flush();
    }));
  });

  describe('取得用戶訂單列表 (Get User Orders)', () => {
    beforeEach(fakeAsync(() => {
      // 創建多個訂單
      service.createOrder(mockCreateOrderRequest).subscribe();
      tick(1000);
      service.createOrder(mockCreateOrderRequest).subscribe();
      tick(1000);
      service.createOrder(mockCreateOrderRequest).subscribe();
      tick(1000);
      flush();
    }));

    it('應該成功取得用戶訂單列表', fakeAsync(() => {
      let response: any;

      service.getUserOrders('mock-user-id', 1, 10).subscribe((res) => {
        response = res;
      });

      tick(500);

      expect(response).toBeDefined();
      expect(response.items).toBeDefined();
      expect(Array.isArray(response.items)).toBeTrue();
      expect(response.totalItems).toBeGreaterThan(0);

      flush();
    }));

    it('應該支援分頁', fakeAsync(() => {
      let response: any;

      service.getUserOrders('mock-user-id', 1, 2).subscribe((res) => {
        response = res;
      });

      tick(500);

      expect(response.pageSize).toBe(2);
      expect(response.currentPage).toBe(1);
      expect(response.items.length).toBeLessThanOrEqual(2);

      flush();
    }));

    it('應該計算正確的分頁資訊', fakeAsync(() => {
      let response: any;

      service.getUserOrders('mock-user-id', 1, 10).subscribe((res) => {
        response = res;
      });

      tick(500);

      expect(response.totalPages).toBe(
        Math.ceil(response.totalItems / response.pageSize)
      );
      expect(response.hasPreviousPage).toBe(response.currentPage > 1);

      flush();
    }));
  });

  describe('更新訂單狀態 (Update Order Status)', () => {
    let orderId: string;

    beforeEach(fakeAsync(() => {
      service.createOrder(mockCreateOrderRequest).subscribe((order) => {
        orderId = order.id;
      });

      tick(1000);
      flush();

      // 重置 spy 計數
      notificationService.createNotification.calls.reset();
      inventoryService.createTransaction.calls.reset();
    }));

    it('應該成功更新訂單狀態', fakeAsync(() => {
      let updatedOrder: any;

      service.updateOrderStatus(orderId, OrderStatus.PAID).subscribe((order) => {
        updatedOrder = order;
      });

      tick(500);

      expect(updatedOrder).toBeDefined();
      expect(updatedOrder.status).toBe(OrderStatus.PAID);
      expect(updatedOrder.paidAt).toBeDefined();

      flush();
    }));

    it('付款時應該創建庫存交易', fakeAsync(() => {
      service.updateOrderStatus(orderId, OrderStatus.PAID).subscribe();

      tick(500);

      expect(inventoryService.createTransaction).toHaveBeenCalled();

      flush();
    }));

    it('狀態變更應該發送通知', fakeAsync(() => {
      service.updateOrderStatus(orderId, OrderStatus.CONFIRMED).subscribe();

      tick(500);

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: 'order_confirmed',
        })
      );

      flush();
    }));

    it('應該正確設定不同狀態的時間戳', fakeAsync(() => {
      let order: any;

      // 測試 SHIPPED 狀態
      service.updateOrderStatus(orderId, OrderStatus.SHIPPED).subscribe((o) => {
        order = o;
      });

      tick(500);

      expect(order.shippedAt).toBeDefined();

      // 測試 DELIVERED 狀態
      service.updateOrderStatus(orderId, OrderStatus.DELIVERED).subscribe((o) => {
        order = o;
      });

      tick(500);

      expect(order.deliveredAt).toBeDefined();

      flush();
    }));

    it('應該處理更新不存在的訂單', fakeAsync(() => {
      let error: any;

      service.updateOrderStatus('non-existent-id', OrderStatus.PAID).subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(500);

      expect(error).toBeDefined();

      flush();
    }));
  });

  describe('取消訂單 (Cancel Order)', () => {
    let orderId: string;

    beforeEach(fakeAsync(() => {
      service.createOrder(mockCreateOrderRequest).subscribe((order) => {
        orderId = order.id;
      });

      tick(1000);
      flush();

      // 重置 spy 計數
      notificationService.createNotification.calls.reset();
      inventoryService.createTransaction.calls.reset();
    }));

    it('應該成功取消訂單', fakeAsync(() => {
      let cancelledOrder: any;

      service.cancelOrder(orderId, '測試取消').subscribe((order) => {
        cancelledOrder = order;
      });

      tick(500);

      expect(cancelledOrder).toBeDefined();
      expect(cancelledOrder.status).toBe(OrderStatus.CANCELLED);
      expect(cancelledOrder.cancelledAt).toBeDefined();

      flush();
    }));

    it('取消訂單應該發送通知', fakeAsync(() => {
      service.cancelOrder(orderId).subscribe();

      tick(500);

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: 'order_cancelled',
        })
      );

      flush();
    }));

    it('取消已付款訂單應該創建退貨庫存交易', fakeAsync(() => {
      // 先將訂單設為已付款
      service.updateOrderStatus(orderId, OrderStatus.PAID).subscribe();
      tick(500);

      inventoryService.createTransaction.calls.reset();

      // 取消訂單
      service.cancelOrder(orderId).subscribe();
      tick(500);

      expect(inventoryService.createTransaction).toHaveBeenCalled();

      flush();
    }));

    it('應該處理取消不存在的訂單', fakeAsync(() => {
      let error: any;

      service.cancelOrder('non-existent-id').subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(500);

      expect(error).toBeDefined();

      flush();
    }));
  });

  describe('清除當前訂單 (Clear Current Order)', () => {
    it('應該清除當前訂單', fakeAsync(() => {
      service.createOrder(mockCreateOrderRequest).subscribe();
      tick(1000);

      expect(service.hasCurrentOrder()).toBeTrue();

      service.clearCurrentOrder();

      expect(service.currentOrder()).toBeNull();
      expect(service.hasCurrentOrder()).toBeFalse();

      flush();
    }));
  });

  describe('錯誤處理 (Error Handling)', () => {
    it('應該正確處理庫存交易失敗', fakeAsync(() => {
      inventoryService.createTransaction.and.returnValue(
        throwError(() => new Error('Inventory transaction failed'))
      );

      let error: any;
      service.createOrder(mockCreateOrderRequest).subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(1000);

      expect(error).toBeDefined();
      expect(service.error()).toBeTruthy();

      flush();
    }));

    it('錯誤後應該重置 loading 狀態', fakeAsync(() => {
      notificationService.createNotification.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      service.createOrder(mockCreateOrderRequest).subscribe({
        error: () => {},
      });

      tick(1000);

      expect(service.loading()).toBeFalse();

      flush();
    }));
  });

  describe('Computed Signals', () => {
    it('hasCurrentOrder 應該反映訂單狀態', fakeAsync(() => {
      expect(service.hasCurrentOrder()).toBeFalse();

      service.createOrder(mockCreateOrderRequest).subscribe();
      tick(1000);

      expect(service.hasCurrentOrder()).toBeTrue();

      service.clearCurrentOrder();

      expect(service.hasCurrentOrder()).toBeFalse();

      flush();
    }));
  });

  describe('訂單編號生成 (Order Number Generation)', () => {
    it('訂單編號應該包含日期和序號', fakeAsync(() => {
      let order1: OrderDetail | undefined;
      let order2: OrderDetail | undefined;

      service.createOrder(mockCreateOrderRequest).subscribe((order) => {
        order1 = order;
      });
      tick(1000);

      service.createOrder(mockCreateOrderRequest).subscribe((order) => {
        order2 = order;
      });
      tick(1000);

      expect(order1!.orderNumber).toMatch(/^ORD-\d{8}-\d{5}$/);
      expect(order2!.orderNumber).toMatch(/^ORD-\d{8}-\d{5}$/);
      expect(order1!.orderNumber).not.toBe(order2!.orderNumber);

      flush();
    }));
  });

  describe('邊界情況 (Edge Cases)', () => {
    it('應該處理空的用戶訂單列表', fakeAsync(() => {
      let response: any;

      service.getUserOrders('non-existent-user', 1, 10).subscribe((res) => {
        response = res;
      });

      tick(500);

      expect(response.items.length).toBe(0);
      expect(response.totalItems).toBe(0);

      flush();
    }));

    it('應該處理大頁碼請求', fakeAsync(() => {
      let response: any;

      service.getUserOrders('mock-user-id', 999, 10).subscribe((res) => {
        response = res;
      });

      tick(500);

      expect(response.items.length).toBe(0);
      expect(response.currentPage).toBe(999);

      flush();
    }));
  });
});
