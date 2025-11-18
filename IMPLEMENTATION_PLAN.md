# Koopa Store 實現計劃

## 📋 決策記錄

基於 2025-11-18 討論，以下為確定的實現策略：

### 1. 訂單編號生成
- ✅ **方式**: Database Trigger 自動生成
- ✅ **格式**: `ORD-YYYYMMDD-XXXXX`
- ✅ **實現**: `migrations/001_add_order_number_trigger.sql`
- ✅ **並發安全**: PostgreSQL Advisory Lock

### 2. 支付系統
- ✅ **策略**: 全部 Mock 支付，可 Demo 即可
- ✅ **支援方式**:
  - Credit Card (Mock)
  - PayPal (Mock)
  - Bank Transfer (Mock)
  - Cash on Delivery (Mock)
  - Apple Pay (Mock)
  - Google Pay (Mock)
  - Cryptocurrency (Mock)

### 3. 庫存管理
- ✅ **策略**: 簡單扣庫存（直接更新 stock_quantity）
- ⏭️ **進階功能**: 庫存預留機制（延後到 Phase 2）

### 4. 評價系統
- ✅ **審核方式**: 自動發布
- ✅ **管理方式**: 後台可隱藏不當評價
- ✅ **驗證**: 僅限已購買用戶可評價

### 5. 電商後台
- ⏳ **決策待定**: Week 3 根據進度決定
- 📝 **選項**:
  - A. 暫不實現
  - B. 簡易後台（訂單/商品/用戶管理）
  - C. 完整後台（含分析/促銷/審核）

---

## 🗓️ 3週實現計劃

### **Week 1: 核心訂單流程** (5天)

#### Day 1-2: 訂單系統基礎
**目標**: 完成訂單創建與管理

**後端 (NestJS/Express 或直接使用 Supabase Functions)**
- [ ] Order Model
  ```typescript
  interface Order {
    id: string;
    orderNumber: string; // 由trigger生成
    userId: string;
    status: OrderStatus;
    subtotal: number;
    shippingFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number; // generated column
    shippingAddress: Address;
    billingAddress: Address;
    items: OrderItem[];
    createdAt: Date;
    paidAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
  }
  ```

- [ ] Order Service
  ```typescript
  class OrderService {
    createOrder(userId: string, cartId: string): Promise<Order>
    getOrder(orderId: string): Promise<Order>
    getUserOrders(userId: string): Promise<Order[]>
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>
    cancelOrder(orderId: string): Promise<Order>
  }
  ```

**前端 (Angular)**
- [ ] Order Models (`src/app/core/models/order.model.ts`)
- [ ] Order Service (`src/app/core/services/order.service.ts`)
- [ ] Checkout Page (`src/app/features/checkout/`)
  - 地址選擇/新增
  - 支付方式選擇
  - 訂單摘要
  - 確認下單
- [ ] Order Confirmation Page
- [ ] Order List Page (用戶訂單歷史)
- [ ] Order Detail Page (訂單詳情)

**資料庫**
- [ ] 執行 `001_add_order_number_trigger.sql`
- [ ] 測試訂單編號生成

---

#### Day 3-4: 支付系統 (Mock)
**目標**: 完成支付流程模擬

**支付方式配置**
```typescript
const PAYMENT_METHODS = [
  {
    id: 'credit_card',
    name: '信用卡',
    icon: 'credit_card',
    description: 'Visa, MasterCard, JCB',
    mockDelay: 2000, // 模擬處理延遲
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'paypal',
    mockDelay: 1500,
  },
  {
    id: 'bank_transfer',
    name: '銀行轉帳',
    icon: 'account_balance',
    mockDelay: 0, // 即時確認
  },
  {
    id: 'cod',
    name: '貨到付款',
    icon: 'local_shipping',
    mockDelay: 0,
  },
  // ... 其他方式
];
```

**實現**
- [ ] Payment Model
- [ ] Payment Service (Mock)
  ```typescript
  class MockPaymentService {
    async processPayment(orderId: string, method: PaymentMethod): Promise<PaymentResult> {
      // 模擬處理延遲
      await this.delay(method.mockDelay);

      // 90% 成功率模擬
      const success = Math.random() > 0.1;

      if (success) {
        return {
          status: 'success',
          transactionId: `TXN-${Date.now()}`,
          paidAt: new Date(),
        };
      } else {
        throw new Error('Payment failed (Mock)');
      }
    }
  }
  ```

- [ ] Payment UI 組件
  - 支付方式選擇卡片
  - 支付處理 Loading
  - 支付成功/失敗通知

---

#### Day 5: 整合測試與優化
**目標**: 完整購物流程測試

**測試場景**
- [ ] 新用戶註冊 → 瀏覽商品 → 加入購物車 → 結帳 → 支付 → 查看訂單
- [ ] 已登入用戶快速購買
- [ ] 多件商品結帳
- [ ] 支付失敗處理
- [ ] 訂單取消

**優化**
- [ ] Loading 狀態完善
- [ ] 錯誤處理統一化
- [ ] RxJS 訂閱管理 (使用 `takeUntilDestroyed`)
- [ ] 表單驗證

---

### **Week 2: 商品增強** (5天)

#### Day 6-7: 商品變體系統
**目標**: 支援顏色/尺寸選擇

**資料模型**
```typescript
interface ProductVariant {
  id: string;
  productId: string;
  variantType: 'color' | 'size' | 'style';
  variantValue: string; // 'Red', 'XL', etc.
  sku: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
}

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  availableColors: string[];
  availableSizes: string[];
}
```

**實現**
- [ ] Variant Model & Service
- [ ] 商品詳情頁變體選擇器
  - 顏色選擇（色塊按鈕）
  - 尺寸選擇（下拉或按鈕）
  - 即時更新價格/庫存
- [ ] 購物車變體顯示
- [ ] 訂單項目變體記錄

---

#### Day 8: 用戶地址管理
**目標**: CRUD 操作 + 預設地址

**實現**
- [ ] Address Model
  ```typescript
  interface UserAddress {
    id: string;
    userId: string;
    label: string; // 'home', 'office', 'other'
    isDefault: boolean;
    recipientName: string;
    recipientPhone: string;
    countryCode: string;
    postalCode: string;
    city: string;
    district: string;
    streetAddress: string;
    buildingFloor?: string;
  }
  ```

- [ ] Address Service (CRUD)
- [ ] Address Management Page
  - 地址列表
  - 新增/編輯地址表單
  - 設為預設
  - 刪除確認
- [ ] 結帳頁地址選擇整合

---

#### Day 9-10: 商品圖片 & 評價系統
**目標**: 多圖上傳 + 評價功能

**商品圖片**
- [ ] Product Images 模組
- [ ] 圖片輪播組件（商品詳情頁）
- [ ] 縮圖選擇器

**評價系統**
- [ ] Review Model
  ```typescript
  interface ProductReview {
    id: string;
    productId: string;
    userId: string;
    orderId: string; // 驗證已購買
    rating: number; // 1-5
    title: string;
    content: string;
    images: string[];
    isApproved: boolean; // 自動為 true
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    createdAt: Date;
  }
  ```

- [ ] Review Service
- [ ] 評價列表組件（商品詳情頁）
- [ ] 撰寫評價表單（訂單詳情頁）
- [ ] 評價圖片上傳

---

### **Week 3: 庫存、通知與優化** (5天)

#### Day 11-12: 庫存交易系統
**目標**: 記錄所有庫存變動

**實現**
- [ ] Inventory Transaction Model
  ```typescript
  interface InventoryTransaction {
    id: string;
    productId: string;
    variantId?: string;
    type: 'sale' | 'return' | 'adjustment';
    quantityChange: number; // 負數表示減少
    beforeQuantity: number;
    afterQuantity: number;
    referenceType: 'order' | 'manual';
    referenceId: string;
    note: string;
    createdBy: string;
    createdAt: Date;
  }
  ```

- [ ] Transaction Service
  - 訂單確認時自動創建 sale 交易
  - 訂單取消時創建 return 交易
  - 手動調整庫存（後台功能）
- [ ] 庫存歷史查詢頁面

---

#### Day 13-14: 通知系統
**目標**: 訂單狀態變更通知

**實現**
- [ ] Notification Model
  ```typescript
  interface UserNotification {
    id: string;
    userId: string;
    type: 'order_confirmed' | 'order_paid' | 'order_shipped' | 'order_delivered';
    title: string;
    message: string;
    data: any; // 關聯數據（如訂單ID）
    isRead: boolean;
    createdAt: Date;
  }
  ```

- [ ] Notification Service
  - 訂單狀態變更觸發通知
  - 標記為已讀
  - 刪除通知
- [ ] 通知中心 UI
  - Header 通知圖標（帶未讀數量徽章）
  - 通知下拉列表
  - 全部標記為已讀
- [ ] Email 通知（可選，使用 Resend/SendGrid）

---

#### Day 15: Angular Best Practices 重構
**目標**: 代碼品質提升

**重構項目**
- [ ] **RxJS 訂閱管理**
  ```typescript
  // ❌ Before
  ngOnInit() {
    this.service.getData().subscribe(data => {
      this.data = data;
    });
  }

  // ✅ After
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.service.getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.data = data;
      });
  }
  ```

- [ ] **統一錯誤處理**
  ```typescript
  // 創建 ErrorInterceptor
  class ErrorInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler) {
      return next.handle(req).pipe(
        catchError((error: HttpErrorResponse) => {
          // 統一錯誤處理邏輯
          this.handleError(error);
          return throwError(() => error);
        })
      );
    }
  }
  ```

- [ ] **Loading State 完善**
  ```typescript
  // 創建 LoadingService
  class LoadingService {
    private loadingSubject = new BehaviorSubject<boolean>(false);
    loading$ = this.loadingSubject.asObservable();

    show() { this.loadingSubject.next(true); }
    hide() { this.loadingSubject.next(false); }
  }

  // 創建 Loading Interceptor
  ```

- [ ] **表單驗證優化**
  - 統一驗證規則
  - 自定義驗證器
  - 即時錯誤提示

---

## 📊 進度追蹤

### 完成標準
- ✅ 功能正常運作
- ✅ UI/UX 符合 Gemini 設計
- ✅ 無 TypeScript 錯誤
- ✅ 無 Console 錯誤
- ✅ 響應式設計正常
- ✅ 代碼符合 Angular Best Practices

### 每日檢查點
- 早上：Review 昨日代碼
- 下午：功能實現
- 晚上：測試 + Git Commit

---

## 🎯 成功指標

### MVP 驗收標準 (Week 1-2)
- [ ] 用戶可以完整走完購物流程
- [ ] 訂單編號正確生成
- [ ] 支付模擬正常運作
- [ ] 購物車功能完善
- [ ] 訂單列表與詳情正確顯示
- [ ] 庫存正確扣減

### 完整版驗收標準 (Week 3)
- [ ] 商品變體選擇正常
- [ ] 地址管理功能完整
- [ ] 評價系統運作正常
- [ ] 庫存交易記錄完整
- [ ] 通知系統正常推送
- [ ] 無明顯 Bug
- [ ] 代碼品質達標

---

## 📝 技術債務記錄

### 已知限制 (MVP階段可接受)
1. 支付為 Mock，未接真實金流
2. 庫存無預留機制（可能超賣）
3. 無庫存預警
4. 評價無審核流程
5. 無促銷/優惠券系統
6. 無數據分析儀表板

### 後續優化方向
1. 整合真實支付金流（綠界/藍新）
2. 實現庫存預留機制（15分鐘過期）
3. 添加庫存預警通知
4. 實現評價審核工作流
5. 促銷活動管理
6. 數據分析儀表板
7. 電商後台完整實現

---

## 🚀 開始實現

### 環境準備
```bash
# 1. 執行資料庫 migration
psql -U postgres -d koopa_store -f migrations/001_add_order_number_trigger.sql

# 2. 確認環境變數
cp .env.example .env

# 3. 啟動開發服務器
npm start
```

### Git 工作流程
```bash
# 每個功能一個 commit
git add .
git commit -m "feat: 實現訂單創建功能"
git push
```

---

## 📞 問題討論

如遇到以下情況，需要討論：
1. Schema 設計需要調整
2. 技術選型有疑問
3. UI/UX 設計方向不明確
4. 工時估算偏差較大
5. 發現新的技術債務

---

**Created**: 2025-11-18
**Last Updated**: 2025-11-18
**Status**: 🚀 Ready to Start
