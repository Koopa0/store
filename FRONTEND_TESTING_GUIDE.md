# 前端測試與質量保證完整指南
# Frontend Testing & Quality Assurance Guide

> **目標**: 確保 Koopa Store 前端應用程式的功能正確性、使用者體驗品質和長期可維護性

---

## 📋 目錄

1. [測試金字塔策略](#測試金字塔策略)
2. [E2E 測試 (Playwright)](#e2e-測試-playwright)
3. [關鍵使用者流程測試場景](#關鍵使用者流程測試場景)
4. [測試實作指南](#測試實作指南)
5. [質量保證檢查清單](#質量保證檢查清單)
6. [常見問題排查](#常見問題排查)

---

## 🎯 測試金字塔策略

### 測試層次劃分

```
        /\
       /  \      E2E Tests (10%)
      /    \     - 關鍵使用者流程
     /------\    - 跨頁面整合測試
    /        \
   /          \  Integration Tests (30%)
  /            \ - 元件整合
 /--------------\- 服務與 API 整合
/                \
------------------  Unit Tests (60%)
   單元測試         - 服務邏輯
                    - 工具函數
                    - Pipes
```

### 為什麼需要多層次測試？

| 測試類型 | 目的 | 速度 | 維護成本 | 信心度 |
|---------|------|------|---------|--------|
| **Unit Tests** | 驗證個別函數/方法的邏輯 | 🚀 極快 | 💚 低 | 💛 中 |
| **Integration Tests** | 驗證元件與服務的整合 | 🏃 快 | 💛 中 | 💚 高 |
| **E2E Tests** | 驗證完整使用者流程 | 🐢 慢 | ❤️ 高 | 💚 極高 |

---

## 🎭 E2E 測試 (Playwright)

### 為什麼選擇 Playwright？

✅ **跨瀏覽器支援**: Chromium, Firefox, WebKit
✅ **自動等待**: 無需手動 `sleep()` 或 `waitFor()`
✅ **強大的選擇器**: CSS, XPath, Text, Role-based
✅ **自動重試**: 減少 flaky tests
✅ **無障礙測試**: 整合 @axe-core/playwright
✅ **影片錄製**: 失敗時自動錄影
✅ **平行執行**: 大幅縮短測試時間

### 當前專案的 Playwright 配置

**位置**: `/playwright.config.ts`

```typescript
// 關鍵配置
{
  testDir: './e2e',              // 測試檔案目錄
  fullyParallel: true,           // 平行執行測試
  retries: 2,                    // 失敗時重試 2 次
  workers: 4,                    // 4 個平行工作
  use: {
    baseURL: 'http://localhost:4200',  // 開發伺服器
    screenshot: 'only-on-failure',     // 失敗時截圖
    video: 'retain-on-failure',        // 失敗時保留影片
    trace: 'on-first-retry',           // 首次重試時記錄追蹤
  },
  projects: [
    { name: 'chromium' },        // Chrome/Edge
    { name: 'firefox' },         // Firefox
    { name: 'webkit' },          // Safari
  ],
}
```

---

## 🛒 關鍵使用者流程測試場景

### 場景 1: 完整購物流程 (Happy Path)

**目標**: 驗證從瀏覽商品到完成訂單的完整流程

**步驟**:
```
1. 訪問首頁 (http://localhost:4200)
   ✓ 檢查: 頁面標題正確
   ✓ 檢查: Header 顯示 Logo 和導航選單
   ✓ 檢查: 顯示特色商品

2. 點擊「商品列表」或首頁的商品
   ✓ 導向: /products
   ✓ 檢查: 顯示商品網格
   ✓ 檢查: 分頁器存在

3. 點擊任一商品卡片
   ✓ 導向: /products/{product-id}
   ✓ 檢查: 顯示商品名稱
   ✓ 檢查: 顯示價格
   ✓ 檢查: 顯示商品圖片
   ✓ 檢查: 「加入購物車」按鈕存在

4. 選擇商品規格 (如有)
   ✓ 操作: 選擇顏色、尺寸等
   ✓ 檢查: 規格按鈕變為已選取狀態

5. 點擊「加入購物車」
   ✓ 檢查: 顯示成功通知 (Snackbar)
   ✓ 檢查: Header 購物車圖示顯示數量徽章

6. 點擊 Header 購物車圖示
   ✓ 導向: /cart
   ✓ 檢查: 顯示剛加入的商品
   ✓ 檢查: 顯示正確的小計、稅額、運費
   ✓ 檢查: 顯示總計

7. 調整商品數量
   ✓ 操作: 點擊 +/- 按鈕
   ✓ 檢查: 數量更新
   ✓ 檢查: 小計自動重新計算

8. 點擊「前往結帳」
   ✓ 條件: 若未登入，應先導向登入頁
   ✓ 導向: /checkout (已登入時)

9. 填寫收件資訊
   ✓ 操作: 填寫姓名、電話、地址
   ✓ 檢查: 表單驗證正常運作

10. 選擇付款方式
    ✓ 操作: 選擇信用卡/PayPal/貨到付款
    ✓ 檢查: 付款方式選項正常切換

11. 點擊「確認訂單」
    ✓ 檢查: 顯示載入狀態
    ✓ 導向: /orders/confirmation/{order-id}
    ✓ 檢查: 顯示訂單號碼
    ✓ 檢查: 顯示訂單摘要

12. 點擊「查看訂單詳情」
    ✓ 導向: /orders/{order-id}
    ✓ 檢查: 顯示完整訂單資訊
```

---

### 場景 2: 使用者認證流程

**步驟**:
```
1. 訪問需要登入的頁面 (如 /orders)
   ✓ 自動導向: /auth/login?returnUrl=/orders
   ✓ 檢查: 顯示登入表單

2. 輸入無效的帳號密碼
   ✓ 操作: 輸入錯誤憑證並提交
   ✓ 檢查: 顯示錯誤訊息
   ✓ 檢查: 不應跳轉頁面

3. 輸入正確的帳號密碼
   測試帳號:
   - admin@koopa.com / admin123 (管理員)
   - user@koopa.com / user123 (一般用戶)

   ✓ 操作: 輸入正確憑證並提交
   ✓ 檢查: 顯示成功訊息
   ✓ 導向: 原本要訪問的頁面 (returnUrl)
   ✓ 檢查: Header 顯示使用者頭像/名稱

4. 點擊使用者選單 -> 登出
   ✓ 檢查: 顯示確認對話框 (optional)
   ✓ 導向: /auth/login
   ✓ 檢查: LocalStorage 清空 (token, user info)
```

---

### 場景 3: 購物車持久化測試

**目標**: 驗證購物車資料在 LocalStorage 中正確保存

**步驟**:
```
1. 加入商品到購物車 (未登入狀態)
   ✓ 操作: 加入 3 個不同商品
   ✓ 檢查: 購物車顯示 3 個項目

2. 重新整理頁面 (F5)
   ✓ 檢查: 購物車資料保留
   ✓ 檢查: 數量和小計正確

3. 關閉並重新開啟瀏覽器 (模擬)
   ✓ 檢查: 使用 context.storageState() 驗證
   ✓ 檢查: 資料仍然存在

4. 清除其中一個商品
   ✓ 操作: 點擊移除按鈕
   ✓ 檢查: 該商品消失
   ✓ 檢查: LocalStorage 同步更新
```

---

### 場景 4: 搜尋與篩選功能

**步驟**:
```
1. 進入商品列表頁
   ✓ 檢查: 顯示所有商品 (初始狀態)

2. 輸入搜尋關鍵字
   ✓ 操作: 在搜尋框輸入 "iPhone"
   ✓ 等待: 500ms (debounce)
   ✓ 檢查: 只顯示包含 "iPhone" 的商品

3. 清空搜尋框
   ✓ 操作: 刪除搜尋文字
   ✓ 檢查: 恢復顯示所有商品

4. 使用排序功能
   ✓ 操作: 選擇「價格」排序
   ✓ 檢查: 商品按價格排序 (預設降序)
   ✓ 操作: 切換升序/降序
   ✓ 檢查: 排序順序改變

5. 分頁測試
   ✓ 操作: 點擊下一頁
   ✓ 檢查: URL 參數更新 (?page=2)
   ✓ 檢查: 顯示第二頁商品
   ✓ 操作: 重新整理頁面
   ✓ 檢查: 保持在第二頁
```

---

### 場景 5: 響應式設計測試

**目標**: 驗證不同裝置尺寸的顯示和互動

**裝置尺寸**:
```typescript
const devices = {
  mobile: { width: 375, height: 667 },    // iPhone SE
  tablet: { width: 768, height: 1024 },   // iPad
  desktop: { width: 1920, height: 1080 }, // Full HD
};
```

**測試步驟**:
```
1. Mobile (375px)
   ✓ 檢查: Header 顯示漢堡選單 (≡)
   ✓ 檢查: 商品列表為單欄顯示
   ✓ 操作: 點擊漢堡選單
   ✓ 檢查: 側邊選單展開

2. Tablet (768px)
   ✓ 檢查: 商品列表為 2 欄顯示
   ✓ 檢查: Header 顯示完整導航選單

3. Desktop (1920px)
   ✓ 檢查: 商品列表為 3-4 欄顯示
   ✓ 檢查: 所有功能正常運作
```

---

### 場景 6: 錯誤處理測試

**步驟**:
```
1. 訪問不存在的商品頁
   ✓ 訪問: /products/invalid-id
   ✓ 檢查: 顯示 404 錯誤訊息
   ✓ 檢查: 提供返回首頁的連結

2. 模擬網路錯誤
   ✓ 操作: 使用 Playwright 攔截 API 並返回錯誤
   ✓ 檢查: 顯示錯誤提示
   ✓ 檢查: 提供重試按鈕

3. 表單驗證錯誤
   ✓ 操作: 提交空白表單
   ✓ 檢查: 顯示必填欄位錯誤訊息
   ✓ 操作: 輸入無效格式 (如錯誤的 email)
   ✓ 檢查: 顯示格式錯誤訊息
```

---

### 場景 7: 無障礙測試 (A11y)

**目標**: 確保符合 WCAG 2.1 AA 標準

**測試項目**:
```
1. 鍵盤導航
   ✓ 操作: 只使用 Tab 鍵導航整個頁面
   ✓ 檢查: 所有互動元素都可到達
   ✓ 檢查: 焦點指示器清晰可見
   ✓ 操作: 按 Enter/Space 觸發按鈕

2. 螢幕閱讀器
   ✓ 檢查: 所有圖片有 alt 文字
   ✓ 檢查: 表單有正確的 label
   ✓ 檢查: ARIA 屬性正確設定

3. 自動化無障礙掃描
   ✓ 使用: @axe-core/playwright
   ✓ 檢查: 無 critical/serious 違規

4. 色彩對比
   ✓ 檢查: 文字與背景對比度 ≥ 4.5:1
   ✓ 檢查: 大文字對比度 ≥ 3:1
```

---

## 💻 測試實作指南

### 步驟 1: 設定開發環境

```bash
# 確保已安裝依賴
npm install

# 安裝 Playwright 瀏覽器
npx playwright install

# 驗證安裝
npx playwright --version
```

### 步驟 2: 啟動開發伺服器

```bash
# Terminal 1: 啟動 Angular 開發伺服器
npm start

# 等待訊息: "Application bundle generation complete."
# 開發伺服器運行在 http://localhost:4200
```

### 步驟 3: 撰寫第一個 E2E 測試

**檔案位置**: `/e2e/shopping-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('完整購物流程', () => {

  test.beforeEach(async ({ page }) => {
    // 每個測試前都訪問首頁
    await page.goto('/');
  });

  test('應該能夠從首頁瀏覽商品並加入購物車', async ({ page }) => {
    // 1. 驗證首頁載入
    await expect(page).toHaveTitle(/Koopa Store/);

    // 2. 點擊商品列表連結
    await page.getByRole('link', { name: '商品列表' }).click();

    // 3. 等待導航到商品列表頁
    await expect(page).toHaveURL(/\/products/);

    // 4. 驗證商品卡片存在
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible();

    // 5. 點擊第一個商品
    await productCards.first().click();

    // 6. 驗證商品詳情頁
    await expect(page.locator('h1')).toBeVisible();

    // 7. 加入購物車
    const addToCartButton = page.getByRole('button', { name: /加入購物車/i });
    await addToCartButton.click();

    // 8. 驗證成功訊息
    await expect(page.locator('.mat-mdc-snack-bar-container')).toBeVisible();

    // 9. 驗證購物車徽章顯示數量
    const cartBadge = page.locator('.cart-badge');
    await expect(cartBadge).toHaveText('1');
  });

  test('應該能夠完成結帳流程', async ({ page }) => {
    // 1. 先登入
    await page.goto('/auth/login');
    await page.getByLabel('帳號').fill('user@koopa.com');
    await page.getByLabel('密碼').fill('user123');
    await page.getByRole('button', { name: '登入' }).click();

    // 2. 等待登入成功
    await expect(page).toHaveURL('/');

    // 3. 加入商品到購物車 (簡化版本)
    await page.goto('/products');
    await page.locator('.product-card').first().click();
    await page.getByRole('button', { name: /加入購物車/i }).click();

    // 4. 前往購物車
    await page.getByRole('link', { name: /購物車/i }).click();
    await expect(page).toHaveURL('/cart');

    // 5. 前往結帳
    await page.getByRole('button', { name: /前往結帳/i }).click();
    await expect(page).toHaveURL('/checkout');

    // 6. 填寫收件資訊 (如果需要)
    const nameInput = page.getByLabel('收件人姓名');
    if (await nameInput.isVisible()) {
      await nameInput.fill('測試用戶');
      await page.getByLabel('電話').fill('0912345678');
      await page.getByLabel('地址').fill('台北市信義區信義路五段7號');
    }

    // 7. 選擇付款方式
    await page.getByLabel('信用卡').check();

    // 8. 確認訂單
    await page.getByRole('button', { name: /確認訂單/i }).click();

    // 9. 驗證導向訂單確認頁
    await expect(page).toHaveURL(/\/orders\/confirmation/);

    // 10. 驗證訂單號碼存在
    await expect(page.getByText(/訂單編號/i)).toBeVisible();
  });
});
```

### 步驟 4: 執行測試

```bash
# 執行所有測試 (headless 模式)
npx playwright test

# 執行特定測試檔案
npx playwright test shopping-flow

# 以 UI 模式執行 (可視化)
npx playwright test --ui

# 以 headed 模式執行 (顯示瀏覽器)
npx playwright test --headed

# 只在 Chromium 執行
npx playwright test --project=chromium

# 偵錯模式
npx playwright test --debug
```

### 步驟 5: 查看測試報告

```bash
# 產生 HTML 報告
npx playwright show-report

# 會自動開啟瀏覽器顯示詳細報告
# 包含：
# - 測試結果 (通過/失敗)
# - 截圖 (失敗時)
# - 影片 (失敗時)
# - 追蹤檔案 (重試時)
```

---

## 🎯 改進當前測試的建議

### 問題 1: 缺少 data-testid 屬性

**當前問題**:
```typescript
// 不可靠的選擇器 (容易因樣式變更而失效)
await page.locator('.product-card').click();
await page.locator('button.add-to-cart').click();
```

**建議改進**:
```typescript
// 步驟 1: 在 HTML 中加入 data-testid
<!-- product-card.component.html -->
<div class="product-card" data-testid="product-card">
  <h3 data-testid="product-name">{{ product.name }}</h3>
  <button data-testid="add-to-cart-btn">加入購物車</button>
</div>

// 步驟 2: 在測試中使用穩定的選擇器
await page.getByTestId('product-card').click();
await page.getByTestId('add-to-cart-btn').click();
```

**優點**:
- ✅ 不受 CSS class 變更影響
- ✅ 語義清晰
- ✅ 容易維護

### 問題 2: 硬編碼的等待時間

**當前問題**:
```typescript
await page.waitForTimeout(2000); // ❌ 不穩定
```

**建議改進**:
```typescript
// 等待特定元素出現
await page.waitForSelector('[data-testid="product-list"]');

// 等待網路請求完成
await page.waitForResponse(response =>
  response.url().includes('/api/products') && response.status() === 200
);

// 等待導航完成
await page.waitForURL('/products');

// Playwright 的自動等待 (推薦)
await page.getByTestId('product-card').click(); // 自動等待元素可點擊
```

### 問題 3: 未實作 Page Object Model

**當前問題**: 測試程式碼重複,難以維護

**建議改進**: 使用 Page Object Pattern

```typescript
// e2e/pages/product-list.page.ts
export class ProductListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/products');
  }

  async searchProduct(keyword: string) {
    await this.page.getByTestId('search-input').fill(keyword);
  }

  async clickProduct(index: number) {
    await this.page.getByTestId('product-card').nth(index).click();
  }

  async getProductCount() {
    return await this.page.getByTestId('product-card').count();
  }
}

// 在測試中使用
test('搜尋商品', async ({ page }) => {
  const productListPage = new ProductListPage(page);

  await productListPage.goto();
  await productListPage.searchProduct('iPhone');

  expect(await productListPage.getProductCount()).toBeGreaterThan(0);

  await productListPage.clickProduct(0);
});
```

---

## ✅ 質量保證檢查清單

### 功能正確性

- [ ] 所有按鈕都能正常觸發預期行為
- [ ] 表單驗證正確運作 (必填欄位、格式檢查)
- [ ] 頁面導航符合預期 (URL、瀏覽歷史)
- [ ] 資料正確顯示 (商品資訊、價格、庫存)
- [ ] 購物車計算正確 (小計、稅額、運費、總計)
- [ ] 錯誤處理適當 (顯示友善訊息、提供重試)

### 使用者體驗

- [ ] 載入狀態指示器顯示 (Spinner、Progress bar)
- [ ] 操作回饋及時 (成功/錯誤訊息)
- [ ] 互動元素有 hover/focus 效果
- [ ] 動畫流暢不卡頓
- [ ] 響應式設計在各尺寸正常顯示
- [ ] 無障礙功能完整 (鍵盤導航、ARIA)

### 效能

- [ ] 初始載入時間 < 3 秒
- [ ] 頁面切換流暢 (使用 Lazy Loading)
- [ ] 圖片有載入優化 (Lazy loading、適當尺寸)
- [ ] Bundle 大小在預算內 (已修復 ✅)
- [ ] 無記憶體洩漏 (使用 Chrome DevTools 檢查)

### 安全性

- [ ] 敏感資料不暴露在 URL
- [ ] Token 安全儲存 (HttpOnly cookies 更佳,但目前使用 LocalStorage)
- [ ] XSS 防護 (Angular 預設已防護)
- [ ] CSRF 防護 (生產環境需實作)
- [ ] 登入狀態正確管理 (過期自動登出)

### 瀏覽器相容性

- [ ] Chrome/Edge (Chromium) ✅
- [ ] Firefox ✅
- [ ] Safari (WebKit) ✅
- [ ] 行動瀏覽器 (iOS Safari, Chrome Mobile)

---

## 🔧 常見問題排查

### 問題 1: E2E 測試隨機失敗 (Flaky Tests)

**可能原因**:
1. 網路請求時間不穩定
2. 動畫導致元素位置改變
3. 資料競爭條件

**解決方案**:
```typescript
// ❌ 錯誤做法
await page.click('button');
await page.locator('.success-message').textContent(); // 可能還未出現

// ✅ 正確做法
await page.click('button');
await expect(page.locator('.success-message')).toBeVisible(); // 自動等待

// ✅ 增加重試次數 (playwright.config.ts)
retries: process.env.CI ? 2 : 0, // CI 環境重試 2 次
```

### 問題 2: 無法找到元素

**解決方案**:
```typescript
// 1. 使用 Playwright Inspector 偵錯
npx playwright test --debug

// 2. 增加等待時間 (最後手段)
await page.waitForLoadState('networkidle');

// 3. 檢查元素是否在 iframe 中
const frame = page.frameLocator('iframe');
await frame.getByTestId('element').click();

// 4. 檢查是否被其他元素遮擋
await page.getByTestId('element').click({ force: true }); // 強制點擊 (不推薦)
```

### 問題 3: 測試太慢

**優化建議**:
```typescript
// 1. 平行執行測試 (playwright.config.ts)
fullyParallel: true,
workers: process.env.CI ? 2 : 4,

// 2. 重複使用已登入狀態
// setup/auth.setup.ts
test('authenticate', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'user@koopa.com');
  await page.fill('[name="password"]', 'user123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');

  // 儲存登入狀態
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// 在其他測試中重複使用
test.use({ storageState: 'playwright/.auth/user.json' });

// 3. 只測試必要的瀏覽器 (開發時)
npx playwright test --project=chromium
```

---

## 📊 測試覆蓋率目標

### 當前狀態

| 測試類型 | 當前覆蓋率 | 目標 | 狀態 |
|---------|-----------|------|------|
| Unit Tests (Services) | 75-85% | 80% | ✅ 達標 |
| Unit Tests (Components) | 40% | 70% | ⚠️ 需改進 |
| E2E Tests | 3 個基礎測試 | 10+ 關鍵流程 | ⚠️ 需擴充 |
| Accessibility Tests | 基礎掃描 | 所有頁面 | ⚠️ 需擴充 |

### 優先改進項目

1. **高優先級**: 補充關鍵使用者流程的 E2E 測試
2. **中優先級**: 提升元件測試覆蓋率
3. **低優先級**: 增加邊緣案例測試

---

## 🚀 下一步行動

### 立即可做

1. **加入 data-testid**: 為所有互動元素加入測試 ID
2. **實作 Page Objects**: 重構現有測試使用 POM 模式
3. **擴充 E2E 測試**: 實作本文檔列出的 7 大場景

### 短期目標 (1-2 週)

4. **整合 CI/CD**: 在 GitHub Actions 中自動執行測試
5. **視覺回歸測試**: 使用 Playwright 的 screenshot 比對
6. **效能測試**: 使用 Lighthouse CI

### 長期目標 (1 個月)

7. **監控和告警**: 設定測試失敗通知
8. **測試資料管理**: 建立測試資料庫
9. **跨團隊培訓**: 教育團隊成員撰寫測試

---

## 📚 參考資源

- [Playwright 官方文檔](https://playwright.dev/)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Google Web Vitals](https://web.dev/vitals/)

---

## 💡 測試哲學

> "測試不是為了證明程式沒有 bug,而是為了更有信心地重構和擴展功能。"

**好測試的特徵**:
- ✅ **可讀性**: 任何人都能理解測試意圖
- ✅ **可靠性**: 不會隨機失敗 (No flaky tests)
- ✅ **獨立性**: 測試之間不相互依賴
- ✅ **快速**: 開發者願意經常執行
- ✅ **有意義**: 測試真實使用者場景,不只是為了覆蓋率

---

**文件版本**: 1.0
**最後更新**: 2025-11-20
**維護者**: Koopa Store 開發團隊
