/**
 * 支付服務
 * Payment Service
 *
 * Mock 實作，模擬各種支付方式的處理流程
 * Mock implementation simulating various payment processing flows
 *
 * 教學重點 / Teaching Points:
 * 1. Mock 支付處理邏輯
 * 2. 非同步延遲模擬
 * 3. 成功率模擬（90% 成功）
 * 4. 錯誤處理
 * 5. Signal-based 狀態管理
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';

// Models
import {
  Payment,
  PaymentMethod,
  PaymentMethodType,
  PaymentRequest,
  PaymentResult,
  PaymentStatus,
  RefundRequest,
  RefundResult,
  MockPaymentConfig,
} from '@core/models/payment.model';
import { ApiResponse } from '@core/models/common.model';

// Environment
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  /**
   * 當前支付處理狀態 Signal
   */
  private readonly processingSignal = signal<boolean>(false);
  public readonly processing = this.processingSignal.asReadonly();

  /**
   * Mock 支付配置
   */
  private readonly mockConfig: MockPaymentConfig = {
    successRate: 0.9, // 90% 成功率
    processingDelay: 1500, // 預設延遲 1.5 秒
    simulateNetworkDelay: true,
    minDelay: 1000,
    maxDelay: 3000,
  };

  /**
   * 支付方式列表（含 Mock 設定）
   */
  private readonly PAYMENT_METHODS: PaymentMethod[] = [
    {
      id: 1,
      type: PaymentMethodType.CREDIT_CARD,
      name: '信用卡',
      icon: 'credit_card',
      description: 'Visa, MasterCard, JCB',
      isActive: true,
      processingFeeRate: 0.028, // 2.8%
      minimumFee: 0,
      maximumFee: 200,
      mockDelay: 2000,
    },
    {
      id: 2,
      type: PaymentMethodType.PAYPAL,
      name: 'PayPal',
      icon: 'paypal',
      description: '安全的線上支付',
      isActive: true,
      processingFeeRate: 0.034, // 3.4%
      minimumFee: 10,
      mockDelay: 1500,
    },
    {
      id: 3,
      type: PaymentMethodType.BANK_TRANSFER,
      name: '銀行轉帳',
      icon: 'account_balance',
      description: '轉帳後需人工確認',
      isActive: true,
      processingFeeRate: 0, // 無手續費
      minimumFee: 0,
      mockDelay: 500, // 即時確認
    },
    {
      id: 4,
      type: PaymentMethodType.CASH_ON_DELIVERY,
      name: '貨到付款',
      icon: 'local_shipping',
      description: '送達時付款',
      isActive: true,
      processingFeeRate: 0,
      minimumFee: 0,
      mockDelay: 300, // 即時確認
    },
    {
      id: 5,
      type: PaymentMethodType.APPLE_PAY,
      name: 'Apple Pay',
      icon: 'smartphone',
      description: '快速且安全',
      isActive: true,
      processingFeeRate: 0.029, // 2.9%
      minimumFee: 0,
      mockDelay: 1000,
    },
    {
      id: 6,
      type: PaymentMethodType.GOOGLE_PAY,
      name: 'Google Pay',
      icon: 'account_balance_wallet',
      description: '輕觸付款',
      isActive: true,
      processingFeeRate: 0.029, // 2.9%
      minimumFee: 0,
      mockDelay: 1000,
    },
    {
      id: 7,
      type: PaymentMethodType.CRYPTOCURRENCY,
      name: '加密貨幣',
      icon: 'currency_bitcoin',
      description: 'BTC, ETH, USDT',
      isActive: false, // 暫時停用
      processingFeeRate: 0.01, // 1%
      minimumFee: 0,
      mockDelay: 3000,
    },
  ];

  /**
   * Mock 支付記錄存儲
   */
  private readonly MOCK_PAYMENTS: Payment[] = [];

  /**
   * 取得所有可用的支付方式
   */
  getPaymentMethods(): Observable<PaymentMethod[]> {
    // TODO: 在實際環境中，這會是 API 請求
    // return this.http
    //   .get<ApiResponse<PaymentMethod[]>>(`${this.apiUrl}/methods`)
    //   .pipe(map((response) => response.data || []));

    // Mock 實作：返回啟用的支付方式
    return of(this.PAYMENT_METHODS.filter((method) => method.isActive)).pipe(
      delay(300) // 模擬網路延遲
    );
  }

  /**
   * 根據 ID 取得支付方式
   */
  getPaymentMethod(id: number): Observable<PaymentMethod | undefined> {
    // TODO: 在實際環境中，這會是 API 請求
    // return this.http
    //   .get<ApiResponse<PaymentMethod>>(`${this.apiUrl}/methods/${id}`)
    //   .pipe(map((response) => response.data));

    // Mock 實作
    return of(this.PAYMENT_METHODS.find((method) => method.id === id)).pipe(
      delay(100)
    );
  }

  /**
   * 處理支付
   * Process payment
   *
   * Mock 實作：
   * - 模擬不同支付方式的處理延遲
   * - 90% 成功率
   * - 生成模擬交易 ID
   */
  processPayment(request: PaymentRequest): Observable<PaymentResult> {
    console.log('[PaymentService] Processing payment:', request);

    // TODO: 在實際環境中，這會是 API 請求
    // this.processingSignal.set(true);
    // return this.http
    //   .post<ApiResponse<PaymentResult>>(`${this.apiUrl}/process`, request)
    //   .pipe(
    //     map((response) => {
    //       this.processingSignal.set(false);
    //       if (!response.data) {
    //         throw new Error('No payment result in response');
    //       }
    //       return response.data;
    //     }),
    //     catchError((error) => {
    //       this.processingSignal.set(false);
    //       return throwError(() => error);
    //     })
    //   );

    // Mock 實作
    this.processingSignal.set(true);
    return this.mockProcessPayment(request);
  }

  /**
   * Mock 支付處理
   */
  private mockProcessPayment(
    request: PaymentRequest
  ): Observable<PaymentResult> {
    // 取得支付方式
    const paymentMethod = this.PAYMENT_METHODS.find(
      (m) => m.id === request.paymentMethodId
    );

    if (!paymentMethod) {
      this.processingSignal.set(false);
      return throwError(() => new Error('Invalid payment method'));
    }

    // 計算處理延遲
    const processingDelay = this.mockConfig.simulateNetworkDelay
      ? this.getRandomDelay(paymentMethod.mockDelay || 1500)
      : paymentMethod.mockDelay || 1500;

    // 模擬支付處理
    return of(null).pipe(
      delay(processingDelay),
      map(() => {
        // 模擬成功率（90%）
        const success = Math.random() < this.mockConfig.successRate;

        if (success) {
          // 支付成功
          const paymentId = this.generatePaymentId();
          const transactionId = this.generateTransactionId(paymentMethod.type);
          const authorizationCode = this.generateAuthCode();
          const paidAt = new Date();

          // 創建支付記錄
          const payment: Payment = {
            id: paymentId,
            orderId: request.orderId,
            paymentMethodId: request.paymentMethodId,
            status: PaymentStatus.SUCCESS,
            amount: request.amount,
            currency: request.currency || 'TWD',
            transactionId,
            authorizationCode,
            processingFee: this.calculateProcessingFee(
              request.amount,
              paymentMethod
            ),
            paidAt,
            version: 1,
            createdAt: paidAt,
            updatedAt: paidAt,
            metadata: request.metadata,
          };

          // 存儲到 Mock 數據
          this.MOCK_PAYMENTS.push(payment);

          this.processingSignal.set(false);

          console.log('[PaymentService] Payment successful:', payment);

          // 返回支付結果
          return {
            success: true,
            paymentId,
            status: PaymentStatus.SUCCESS,
            transactionId,
            authorizationCode,
            paidAt,
            metadata: {
              paymentMethod: paymentMethod.name,
              processingTime: processingDelay,
            },
          } as PaymentResult;
        } else {
          // 支付失敗
          this.processingSignal.set(false);

          const errorMessages = [
            '支付被拒絕，請檢查卡片資訊',
            '餘額不足',
            '支付超時，請重試',
            '銀行系統維護中',
            '卡片已過期',
          ];

          const errorMessage =
            errorMessages[Math.floor(Math.random() * errorMessages.length)];

          console.error('[PaymentService] Payment failed:', errorMessage);

          throw new Error(errorMessage);
        }
      }),
      catchError((error) => {
        this.processingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * 取得支付記錄
   */
  getPayment(paymentId: string): Observable<Payment> {
    // TODO: 在實際環境中，這會是 API 請求
    // return this.http
    //   .get<ApiResponse<Payment>>(`${this.apiUrl}/${paymentId}`)
    //   .pipe(
    //     map((response) => {
    //       if (!response.data) {
    //         throw new Error('Payment not found');
    //       }
    //       return response.data;
    //     })
    //   );

    // Mock 實作
    const payment = this.MOCK_PAYMENTS.find((p) => p.id === paymentId);
    if (!payment) {
      return throwError(() => new Error('Payment not found'));
    }
    return of(payment).pipe(delay(200));
  }

  /**
   * 根據訂單 ID 取得支付記錄
   */
  getPaymentByOrderId(orderId: string): Observable<Payment | undefined> {
    // TODO: 在實際環境中，這會是 API 請求
    // return this.http
    //   .get<ApiResponse<Payment>>(`${this.apiUrl}/order/${orderId}`)
    //   .pipe(map((response) => response.data));

    // Mock 實作
    const payment = this.MOCK_PAYMENTS.find((p) => p.orderId === orderId);
    return of(payment).pipe(delay(200));
  }

  /**
   * 申請退款
   */
  requestRefund(request: RefundRequest): Observable<RefundResult> {
    console.log('[PaymentService] Requesting refund:', request);

    // TODO: 在實際環境中，這會是 API 請求
    // return this.http
    //   .post<ApiResponse<RefundResult>>(`${this.apiUrl}/refund`, request)
    //   .pipe(
    //     map((response) => {
    //       if (!response.data) {
    //         throw new Error('No refund result in response');
    //       }
    //       return response.data;
    //     })
    //   );

    // Mock 實作
    return of(null).pipe(
      delay(2000),
      map(() => {
        // 找到支付記錄
        const payment = this.MOCK_PAYMENTS.find(
          (p) => p.id === request.paymentId
        );

        if (!payment) {
          throw new Error('Payment not found');
        }

        if (payment.status !== PaymentStatus.SUCCESS) {
          throw new Error('Only successful payments can be refunded');
        }

        // 更新支付記錄
        payment.status = PaymentStatus.REFUNDED;
        payment.refundedAmount = request.amount;
        payment.refundedAt = new Date();
        payment.updatedAt = new Date();

        console.log('[PaymentService] Refund successful:', payment);

        return {
          success: true,
          refundId: this.generateRefundId(),
          refundedAmount: request.amount,
          refundedAt: new Date(),
        } as RefundResult;
      })
    );
  }

  /**
   * 計算處理費用
   */
  private calculateProcessingFee(
    amount: number,
    method: PaymentMethod
  ): number {
    const fee = amount * method.processingFeeRate + method.minimumFee;
    if (method.maximumFee && fee > method.maximumFee) {
      return method.maximumFee;
    }
    return Math.round(fee);
  }

  /**
   * 生成隨機延遲
   */
  private getRandomDelay(baseDelay: number): number {
    const variation = 500; // ±500ms 變化
    return baseDelay + Math.random() * variation * 2 - variation;
  }

  /**
   * 生成支付 ID
   */
  private generatePaymentId(): string {
    return `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  /**
   * 生成交易 ID
   */
  private generateTransactionId(type: PaymentMethodType): string {
    const prefix = type.toUpperCase().replace('_', '');
    return `TXN-${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  /**
   * 生成授權碼
   */
  private generateAuthCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * 生成退款 ID
   */
  private generateRefundId(): string {
    return `RFD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }
}
