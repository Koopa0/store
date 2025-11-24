/**
 * 結帳頁面組件
 * Checkout Page Component
 *
 * 完整的結帳流程
 * Complete checkout process
 *
 * 教學重點 / Teaching Points:
 * 1. 多步驟表單處理
 * 2. Signal-based 狀態管理
 * 3. 服務整合（Cart, Order, Payment）
 * 4. 表單驗證
 * 5. 路由導航
 */

import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Material Modules
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

// Services
import { CartService } from '@features/cart/services/cart.service';
import { OrderService } from '@features/order/services/order.service';
import { PaymentService } from '@core/services/payment.service';
import { NotificationService } from '@core/services/notification.service';
import { LoggerService } from '@core/services';
import { AddressService } from '@core/services/address.service';

// Models
import { CreateOrderRequest, OrderAddress } from '@core/models/order.model';
import { CartItem } from '@core/models/cart.model';
import { PaymentMethod, PaymentRequest } from '@core/models/payment.model';

// Pipes
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatDividerModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    TranslateModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly notificationService = inject(NotificationService);
  private readonly logger = inject(LoggerService);
  private readonly addressService = inject(AddressService);

  /**
   * 購物車項目 Signal
   */
  readonly cartItems = this.cartService.cartItems;
  readonly subtotal = this.cartService.subtotal;
  readonly itemsCount = this.cartService.itemsCount;

  /**
   * 已儲存的地址列表
   */
  readonly savedAddresses = this.addressService.addresses;

  /**
   * 選中的地址 ID
   */
  readonly selectedAddressId = signal<string | null>(null);

  /**
   * 訂單金額計算 Signals
   */
  readonly shippingFee = computed(() => {
    const total = this.subtotal();
    return total >= 1000 ? 0 : 100; // 滿千免運
  });

  readonly taxAmount = computed(() => {
    const total = this.subtotal();
    return Math.round(total * 0.05); // 5% 稅
  });

  readonly totalAmount = computed(() => {
    return this.subtotal() + this.shippingFee() + this.taxAmount();
  });

  /**
   * 處理中狀態
   */
  readonly processing = signal<boolean>(false);

  /**
   * 支付處理狀態
   */
  readonly paymentProcessing = this.paymentService.processing;

  /**
   * 處理階段（用於顯示當前處理步驟）
   */
  readonly processingStage = signal<'order' | 'payment' | 'complete'>('order');

  /**
   * 支付方式列表
   */
  readonly paymentMethods = signal<PaymentMethod[]>([]);

  /**
   * 表單群組
   */
  shippingForm!: FormGroup;
  paymentForm!: FormGroup;

  ngOnInit(): void {
    // 檢查購物車是否為空
    if (this.itemsCount() === 0) {
      this.notificationService.warning('購物車是空的');
      this.router.navigate(['/products']);
      return;
    }

    this.initializeForms();
    this.loadPaymentMethods();
  }

  /**
   * 載入支付方式列表
   */
  private loadPaymentMethods(): void {
    this.paymentService
      .getPaymentMethods()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (methods) => {
          this.paymentMethods.set(methods);
          // 設定預設支付方式
          if (methods.length > 0) {
            this.paymentForm.patchValue({
              paymentMethodId: methods[0].id,
            });
          }
        },
        error: (error) => {
          this.logger.error('[Checkout] Failed to load payment methods:', error);
          this.notificationService.error('載入支付方式失敗');
        },
      });
  }

  /**
   * 初始化表單
   */
  private initializeForms(): void {
    // 配送地址表單
    this.shippingForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.minLength(2)]],
      recipientPhone: ['', [Validators.required, Validators.pattern(/^09\d{8}$/)]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{3,5}$/)]],
      city: ['', Validators.required],
      district: ['', Validators.required],
      streetAddress: ['', [Validators.required, Validators.minLength(5)]],
      buildingFloor: [''],
    });

    // 支付方式表單
    this.paymentForm = this.fb.group({
      paymentMethodId: [1, Validators.required],
      customerNote: [''],
    });

    // 自動填入用戶預設地址
    this.autoFillDefaultAddress();
  }

  /**
   * 自動填入預設地址
   * Auto-fill default address
   */
  private autoFillDefaultAddress(): void {
    this.addressService
      .getDefaultAddress()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (address) => {
          if (address) {
            this.logger.info('[Checkout] Auto-filling default address:', address);

            // 移除手機號碼中的破折號（09-1234-5678 -> 0912345678）
            const phoneNumber = address.recipientPhone.replace(/-/g, '');

            this.shippingForm.patchValue({
              recipientName: address.recipientName,
              recipientPhone: phoneNumber,
              postalCode: address.postalCode,
              city: address.city,
              district: address.district,
              streetAddress: address.streetAddress,
              buildingFloor: address.buildingFloor || '',
            });

            this.notificationService.info('已自動填入您的預設地址');
            // 設定選中的地址 ID
            this.selectedAddressId.set(address.id);
          }
        },
        error: (error) => {
          this.logger.error('[Checkout] Failed to load default address:', error);
          // 不顯示錯誤訊息，讓用戶手動填寫即可
          // 預設選中"新增地址"
          this.selectedAddressId.set('new');
        },
      });
  }

  /**
   * 選擇地址
   * Select address
   */
  selectAddress(addressId: string): void {
    this.selectedAddressId.set(addressId);

    if (addressId === 'new') {
      // 清空表單讓用戶輸入新地址
      this.shippingForm.reset();
      return;
    }

    // 找到選中的地址並填入表單
    const address = this.savedAddresses().find(a => a.id === addressId);
    if (address) {
      const phoneNumber = address.recipientPhone.replace(/-/g, '');

      this.shippingForm.patchValue({
        recipientName: address.recipientName,
        recipientPhone: phoneNumber,
        postalCode: address.postalCode,
        city: address.city,
        district: address.district,
        streetAddress: address.streetAddress,
        buildingFloor: address.buildingFloor || '',
      });

      this.notificationService.success('已填入所選地址');
    }
  }

  /**
   * 取得地址圖示
   * Get address icon
   */
  getAddressIcon(label: string): string {
    switch (label) {
      case 'home':
        return 'home';
      case 'office':
        return 'business';
      default:
        return 'place';
    }
  }

  /**
   * 取得地址標籤
   * Get address label
   */
  getAddressLabel(address: any): string {
    if (address.customLabel) {
      return address.customLabel;
    }
    switch (address.label) {
      case 'home':
        return '家裡';
      case 'office':
        return '公司';
      default:
        return '其他';
    }
  }

  /**
   * 提交訂單並處理支付
   */
  submitOrder(): void {
    if (this.shippingForm.invalid || this.paymentForm.invalid) {
      this.notificationService.error('請填寫所有必填欄位');
      return;
    }

    this.processing.set(true);
    this.processingStage.set('order');

    const shippingAddress: OrderAddress = {
      recipientName: this.shippingForm.value.recipientName,
      recipientPhone: this.shippingForm.value.recipientPhone,
      countryCode: 'TW',
      postalCode: this.shippingForm.value.postalCode,
      city: this.shippingForm.value.city,
      district: this.shippingForm.value.district,
      streetAddress: this.shippingForm.value.streetAddress,
      buildingFloor: this.shippingForm.value.buildingFloor,
    };

    const orderRequest: CreateOrderRequest = {
      shippingAddressId: 'mock-address-id', // TODO: 實際應從地址管理取得
      paymentMethodId: this.paymentForm.value.paymentMethodId,
      customerNote: this.paymentForm.value.customerNote,
    };

    // Step 1: 創建訂單
    this.orderService
      .createOrder(orderRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.logger.info('[Checkout] Order created:', order);
          this.notificationService.success('訂單建立成功！');

          // Step 2: 處理支付
          this.processingStage.set('payment');
          this.processPayment(order.id, this.totalAmount());
        },
        error: (error) => {
          this.processing.set(false);
          this.processingStage.set('order');
          this.notificationService.error('訂單建立失敗: ' + error.message);
        },
      });
  }

  /**
   * 處理支付
   */
  private processPayment(orderId: string, amount: number): void {
    const paymentRequest: PaymentRequest = {
      orderId,
      paymentMethodId: this.paymentForm.value.paymentMethodId,
      amount,
      currency: 'TWD',
      metadata: {
        customerNote: this.paymentForm.value.customerNote,
      },
    };

    this.paymentService
      .processPayment(paymentRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.logger.info('[Checkout] Payment successful:', result);
          this.processing.set(false);
          this.processingStage.set('complete');
          this.notificationService.success('支付成功！');

          // 清空購物車
          this.cartService
            .clearCart()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.logger.info('[Checkout] Cart cleared');

                // 延遲導航，讓用戶看到成功訊息
                setTimeout(() => {
                  // 從 OrderService 取得當前訂單號碼
                  const currentOrder = this.orderService.currentOrder();
                  if (currentOrder) {
                    this.router.navigate(['/order-confirmation', currentOrder.orderNumber]);
                  } else {
                    // Fallback: 導航到訂單列表
                    this.router.navigate(['/orders']);
                  }
                }, 1500);
              },
              error: (error) => {
                this.logger.error('[Checkout] Failed to clear cart:', error);
                // 即使清空購物車失敗，仍然導航到確認頁面
                const currentOrder = this.orderService.currentOrder();
                if (currentOrder) {
                  this.router.navigate(['/order-confirmation', currentOrder.orderNumber]);
                }
              },
            });
        },
        error: (error) => {
          this.processing.set(false);
          this.processingStage.set('payment');
          this.notificationService.error('支付失敗: ' + error.message);

          // TODO: 處理支付失敗後的訂單狀態
          // 可以選擇：
          // 1. 保留訂單為 "待付款" 狀態
          // 2. 自動取消訂單
          // 3. 提供重試支付選項
          this.logger.error('[Checkout] Payment failed:', error);
        },
      });
  }

  /**
   * 返回購物車
   */
  goBackToCart(): void {
    this.router.navigate(['/cart']);
  }
}
