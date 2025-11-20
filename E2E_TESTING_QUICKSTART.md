# E2E 測試快速開始指南
# E2E Testing Quickstart Guide

> 5 分鐘快速上手 Playwright E2E 測試

---

## 📦 安裝與設定

### 1. 安裝依賴

```bash
# 安裝 npm 套件 (如果還沒安裝)
npm install

# 安裝 Playwright 瀏覽器
npx playwright install
```

### 2. 啟動開發伺服器

**在一個終端機視窗中執行:**

```bash
npm start
```

等待出現 `✔ Application bundle generation complete.` 訊息,確認伺服器運行在 `http://localhost:4200`

---

## 🚀 執行測試

### 基本命令

```bash
# 執行所有測試 (Headless 模式)
npx playwright test

# 以 UI 模式執行 (視覺化介面,推薦!)
npx playwright test --ui

# 以 Headed 模式執行 (顯示瀏覽器視窗)
npx playwright test --headed

# 偵錯模式 (逐步執行)
npx playwright test --debug
```

### 執行特定測試

```bash
# 執行完整購物流程測試
npx playwright test complete-shopping-flow

# 執行認證流程測試
npx playwright test user-authentication

# 執行搜尋功能測試
npx playwright test search-and-filter

# 執行響應式設計測試
npx playwright test responsive-and-accessibility
```

### 只在特定瀏覽器執行

```bash
# 只在 Chromium 執行
npx playwright test --project=chromium

# 只在 Firefox 執行
npx playwright test --project=firefox

# 只在 WebKit (Safari) 執行
npx playwright test --project=webkit
```

---

## 📊 查看測試報告

```bash
# 產生並開啟 HTML 報告
npx playwright show-report
```

報告包含:
- ✅ 通過/失敗的測試
- 📸 失敗時的截圖
- 🎬 失敗時的影片
- 📋 詳細的錯誤訊息
- ⏱️ 執行時間

---

## 🎯 測試檔案說明

| 檔案 | 測試內容 | 優先級 |
|------|---------|--------|
| `complete-shopping-flow.spec.ts` | 完整購物流程<br>購物車操作<br>計算驗證<br>持久化測試 | 🔴 高 |
| `user-authentication.spec.ts` | 登入/登出<br>路由守衛<br>Token 管理<br>表單驗證 | 🔴 高 |
| `search-and-filter.spec.ts` | 商品搜尋<br>排序功能<br>分頁<br>URL 參數 | 🟡 中 |
| `responsive-and-accessibility.spec.ts` | 響應式設計<br>無障礙測試<br>鍵盤導航<br>色彩對比 | 🟢 低 |

---

## 🛠️ 測試輔助工具

在 `e2e/helpers/test-helpers.ts` 中提供了許多輔助函數:

```typescript
import { login, logout, addProductToCart, clearAllStorage } from './helpers/test-helpers';

test('使用輔助函數的測試', async ({ page }) => {
  // 快速登入
  await login(page, 'user');

  // 加入商品到購物車
  await addProductToCart(page, 0); // 第一個商品

  // 登出
  await logout(page);
});
```

---

## 📝 撰寫新測試

### 範例: 測試新功能

```typescript
// e2e/my-new-feature.spec.ts
import { test, expect } from '@playwright/test';
import { login } from './helpers/test-helpers';

test.describe('我的新功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('應該能夠...', async ({ page }) => {
    // 1. 準備 (Arrange)
    await login(page, 'user');

    // 2. 執行 (Act)
    await page.locator('button').filter({ hasText: '我的按鈕' }).click();

    // 3. 驗證 (Assert)
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### 最佳實踐

1. **使用語義化選擇器**
   ```typescript
   // ✅ 好
   page.getByRole('button', { name: '登入' })
   page.getByLabel('Email')
   page.getByText('歡迎')

   // ❌ 不好
   page.locator('.btn-primary')
   page.locator('#email')
   ```

2. **避免硬編碼等待**
   ```typescript
   // ❌ 不好
   await page.waitForTimeout(2000);

   // ✅ 好
   await expect(page.locator('.element')).toBeVisible();
   await page.waitForURL('/expected-url');
   ```

3. **每個測試保持獨立**
   ```typescript
   // ✅ 好 - 每個測試都清理狀態
   test.beforeEach(async ({ page }) => {
     await clearAllStorage(page);
   });
   ```

---

## 🐛 偵錯技巧

### 方法 1: Playwright Inspector

```bash
npx playwright test --debug
```

功能:
- 逐步執行測試
- 查看 DOM 結構
- 測試選擇器
- 查看 console 日誌

### 方法 2: 使用 page.pause()

```typescript
test('偵錯測試', async ({ page }) => {
  await page.goto('/');

  // 暫停在這裡,手動檢查
  await page.pause();

  await page.locator('button').click();
});
```

### 方法 3: 截圖

```typescript
import { takeScreenshot } from './helpers/test-helpers';

test('截圖測試', async ({ page }) => {
  await page.goto('/products');

  // 截圖
  await takeScreenshot(page, 'products-page');
});
```

### 方法 4: Console 日誌

```typescript
test('顯示日誌', async ({ page }) => {
  // 監聽瀏覽器 console
  page.on('console', (msg) => console.log('瀏覽器:', msg.text()));

  await page.goto('/');
});
```

---

## 🎥 錄製測試

Playwright 可以自動錄製使用者操作並生成測試程式碼!

```bash
# 啟動錄製工具
npx playwright codegen http://localhost:4200
```

步驟:
1. 在開啟的瀏覽器中操作應用程式
2. Playwright 會即時生成測試程式碼
3. 複製程式碼到測試檔案
4. 修改和優化程式碼

---

## 📈 CI/CD 整合

### GitHub Actions 範例

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📚 常見問題 FAQ

### Q1: 測試失敗時如何查看發生了什麼?

A: 查看 `playwright-report/` 目錄中的:
- 截圖 (`screenshots/`)
- 影片 (`videos/`)
- 追蹤檔案 (`traces/`)

### Q2: 如何加速測試執行?

A:
```bash
# 增加平行工作數 (預設 4)
npx playwright test --workers=8

# 只執行變更相關的測試
npx playwright test --only-changed

# 只在 Chromium 執行 (不跑 Firefox 和 WebKit)
npx playwright test --project=chromium
```

### Q3: 如何測試行動裝置?

A:
```typescript
import { devices } from '@playwright/test';

test.use(devices['iPhone 12']);

test('行動裝置測試', async ({ page }) => {
  await page.goto('/');
  // 測試會在 iPhone 12 尺寸和 User-Agent 下執行
});
```

### Q4: 測試資料如何管理?

A:
1. 使用 `test-helpers.ts` 中的 `TEST_ACCOUNTS` 常數
2. 在測試前清理 LocalStorage
3. 每個測試使用獨立的狀態

### Q5: 如何處理 Flaky Tests (不穩定的測試)?

A:
```typescript
// 1. 使用自動重試
test.describe.configure({ retries: 2 });

// 2. 使用更可靠的等待
await expect(page.locator('.element')).toBeVisible();

// 3. 避免競爭條件
await page.waitForLoadState('networkidle');
```

---

## 🎯 下一步

1. ✅ 執行現有測試,確保通過
2. 📝 為新功能撰寫測試
3. 🔄 整合到 CI/CD 流程
4. 📊 定期查看測試報告
5. 🛠️ 持續優化測試效能

---

## 📖 參考資源

- [Playwright 官方文檔](https://playwright.dev/)
- [測試選擇器指南](https://playwright.dev/docs/locators)
- [無障礙測試](https://playwright.dev/docs/accessibility-testing)
- [最佳實踐](https://playwright.dev/docs/best-practices)

---

**祝測試愉快! 🚀**

有任何問題,請參考 `FRONTEND_TESTING_GUIDE.md` 獲取更詳細的指導。
