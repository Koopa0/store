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

import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
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

// Services
import { CartService } from '@features/cart/services/cart.service';
import { OrderService } from '@features/order/services/order.service';
import { NotificationService } from '@core/services/notification.service';

// Models
import { CreateOrderRequest, OrderAddress } from '@core/models/order.model';
import { CartItem } from '@core/models/cart.model';

// Pipes
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

/**
 * 支付方式介面
 */
interface PaymentMethod {
  id: number;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
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
  private readonly notificationService = inject(NotificationService);

  /**
   * 購物車項目 Signal
   */
  readonly cartItems = this.cartService.cartItems;
  readonly subtotal = this.cartService.subtotal;
  readonly itemsCount = this.cartService.itemsCount;

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
   * 支付方式列表（Mock）
   */
  readonly paymentMethods: PaymentMethod[] = [
    {
      id: 1,
      name: '信用卡',
      icon: 'credit_card',
      description: 'Visa, MasterCard, JCB',
    },
    {
      id: 2,
      name: 'PayPal',
      icon: 'paypal',
      description: '安全的線上支付',
    },
    {
      id: 3,
      name: '銀行轉帳',
      icon: 'account_balance',
      description: '轉帳後需人工確認',
    },
    {
      id: 4,
      name: '貨到付款',
      icon: 'local_shipping',
      description: '送達時付款',
    },
  ];

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
  }

  /**
   * 提交訂單
   */
  submitOrder(): void {
    if (this.shippingForm.invalid || this.paymentForm.invalid) {
      this.notificationService.error('請填寫所有必填欄位');
      return;
    }

    this.processing.set(true);

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

    this.orderService
      .createOrder(orderRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.processing.set(false);
          this.notificationService.success('訂單建立成功！');

          // 清空購物車
          this.cartService.clearCart();

          // 導航到訂單確認頁
          this.router.navigate(['/order-confirmation', order.orderNumber]);
        },
        error: (error) => {
          this.processing.set(false);
          this.notificationService.error('訂單建立失敗: ' + error.message);
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
