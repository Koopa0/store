/**
 * 完整購物流程 E2E 測試
 * Complete Shopping Flow E2E Tests
 *
 * 測試目標:
 * 1. 驗證從瀏覽商品到完成訂單的完整流程
 * 2. 確保購物車計算正確
 * 3. 驗證結帳流程順暢
 */

import { test, expect, Page } from '@playwright/test';

test.describe('完整購物流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每個測試前都訪問首頁
    await page.goto('/');
  });

  test('應該能夠從首頁導航到商品列表', async ({ page }) => {
    // 驗證首頁載入
    await expect(page).toHaveTitle(/Koopa Store/);

    // 點擊導航選單的「商品列表」
    // 使用多種選擇器策略,提高穩定性
    const productListLink = page.locator('a[href="/products"]').first();
    await expect(productListLink).toBeVisible();
    await productListLink.click();

    // 驗證導航成功
    await expect(page).toHaveURL(/\/products/);

    // 驗證頁面標題
    await expect(page.locator('h1, h2').filter({ hasText: /商品列表|產品目錄/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('應該能夠瀏覽商品詳情並加入購物車', async ({ page }) => {
    // 1. 前往商品列表
    await page.goto('/products');

    // 2. 等待商品卡片載入
    const productCards = page.locator('mat-card, .product-card, [class*="product"]').filter({
      has: page.locator('button:has-text("加入購物車"), button:has-text("Add to Cart")'),
    });

    await expect(productCards.first()).toBeVisible({ timeout: 10000 });

    // 3. 獲取第一個商品的名稱 (用於後續驗證)
    const firstProductName = await productCards.first().locator('h3, h4, .product-name').first().textContent();
    console.log('[Test] 點擊商品:', firstProductName);

    // 4. 點擊第一個商品 (點擊卡片本身,不是按鈕)
    await productCards.first().click();

    // 5. 等待商品詳情頁載入
    await page.waitForURL(/\/products\/.+/);

    // 6. 驗證商品詳情頁元素
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // 7. 查找「加入購物車」按鈕 (使用多種可能的文字)
    const addToCartButton = page.locator('button').filter({
      hasText: /加入購物車|Add to Cart|添加至購物車/i,
    });

    await expect(addToCartButton).toBeVisible({ timeout: 5000 });

    // 8. 點擊加入購物車
    await addToCartButton.click();

    // 9. 等待並驗證成功訊息 (Snackbar 或其他通知)
    // Material Snackbar 通常有這個 class
    const snackbar = page.locator('.mat-mdc-snack-bar-container, .mat-snack-bar-container, [role="alert"]');
    await expect(snackbar).toBeVisible({ timeout: 5000 });

    // 10. 驗證購物車圖示顯示數量徽章
    const cartBadge = page.locator('[matbadge], .mat-badge-content, .cart-badge, .badge').filter({
      hasText: /^[1-9]\d*$/, // 數字 1 或更多
    });

    // 徽章可能需要一點時間更新
    await expect(cartBadge.first()).toBeVisible({ timeout: 3000 });
  });

  test('應該能夠在購物車中調整商品數量', async ({ page }) => {
    // 1. 先加入商品到購物車
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const productCard = page.locator('mat-card, .product-card').first();
    await productCard.click();

    const addToCartButton = page.locator('button').filter({
      hasText: /加入購物車|Add to Cart/i,
    });
    await addToCartButton.click();

    // 等待加入成功
    await page.waitForTimeout(1000);

    // 2. 前往購物車
    await page.goto('/cart');

    // 3. 等待購物車項目載入
    const cartItems = page.locator('.cart-item, mat-card').filter({
      has: page.locator('button, input[type="number"]'),
    });

    await expect(cartItems.first()).toBeVisible({ timeout: 5000 });

    // 4. 找到數量輸入框或 +/- 按鈕
    const quantityInput = page.locator('input[type="number"]').first();

    if (await quantityInput.isVisible()) {
      // 方式 1: 直接輸入數量
      const currentQuantity = await quantityInput.inputValue();
      console.log('[Test] 當前數量:', currentQuantity);

      await quantityInput.fill('2');

      // 等待重新計算
      await page.waitForTimeout(500);

      // 驗證數量已更新
      await expect(quantityInput).toHaveValue('2');
    } else {
      // 方式 2: 使用 + 按鈕
      const increaseButton = page.locator('button').filter({
        hasText: /\+|增加|plus/i,
      }).first();

      if (await increaseButton.isVisible()) {
        await increaseButton.click();
        await page.waitForTimeout(500);
      }
    }

    // 5. 驗證小計有更新 (小計應該 > 0)
    const subtotal = page.locator('text=/小計|Subtotal/i').first();
    await expect(subtotal).toBeVisible();
  });

  test('應該能夠從購物車移除商品', async ({ page }) => {
    // 1. 先加入商品
    await page.goto('/products');
    const productCard = page.locator('mat-card, .product-card').first();
    await productCard.click();

    const addToCartButton = page.locator('button').filter({
      hasText: /加入購物車/i,
    });
    await addToCartButton.click();
    await page.waitForTimeout(1000);

    // 2. 前往購物車
    await page.goto('/cart');

    // 3. 獲取初始購物車項目數量
    const cartItems = page.locator('.cart-item, mat-card').filter({
      has: page.locator('button'),
    });

    const initialCount = await cartItems.count();
    console.log('[Test] 初始購物車項目數:', initialCount);

    expect(initialCount).toBeGreaterThan(0);

    // 4. 點擊移除按鈕 (可能是垃圾桶圖示或「移除」文字)
    const removeButton = page.locator('button').filter({
      hasText: /移除|刪除|Remove|Delete|🗑️/i,
    }).first();

    await removeButton.click();

    // 5. 可能有確認對話框
    const confirmButton = page.locator('button').filter({
      hasText: /確認|是|Yes|OK/i,
    });

    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }

    // 6. 等待項目被移除
    await page.waitForTimeout(1000);

    // 7. 驗證購物車項目減少或顯示空購物車訊息
    const emptyMessage = page.locator('text=/購物車是空的|Cart is empty|沒有商品/i');

    // 如果只有一個商品,移除後應該看到空購物車訊息
    if (initialCount === 1) {
      await expect(emptyMessage).toBeVisible({ timeout: 3000 });
    } else {
      // 否則項目數應該減少
      const newCount = await cartItems.count();
      expect(newCount).toBeLessThan(initialCount);
    }
  });

  test('應該正確計算購物車總額 (小計 + 稅額 + 運費)', async ({ page }) => {
    // 1. 加入商品到購物車
    await page.goto('/products');
    const productCard = page.locator('mat-card, .product-card').first();
    await productCard.click();

    const addToCartButton = page.locator('button').filter({
      hasText: /加入購物車/i,
    });
    await addToCartButton.click();
    await page.waitForTimeout(1000);

    // 2. 前往購物車
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // 3. 獲取各項金額
    const subtotalText = await page.locator('text=/小計.*NT\$|Subtotal.*NT\$/i')
      .first()
      .textContent();

    const taxText = await page.locator('text=/稅額.*NT\$|Tax.*NT\$/i')
      .first()
      .textContent();

    const shippingText = await page.locator('text=/運費.*NT\$|Shipping.*NT\$/i')
      .first()
      .textContent();

    const totalText = await page.locator('text=/總計.*NT\$|Total.*NT\$/i')
      .first()
      .textContent();

    console.log('[Test] 小計:', subtotalText);
    console.log('[Test] 稅額:', taxText);
    console.log('[Test] 運費:', shippingText);
    console.log('[Test] 總計:', totalText);

    // 4. 提取數字 (移除 NT$, $, 逗號等)
    const extractNumber = (text: string | null): number => {
      if (!text) return 0;
      const match = text.match(/[\d,]+/);
      return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
    };

    const subtotal = extractNumber(subtotalText);
    const tax = extractNumber(taxText);
    const shipping = extractNumber(shippingText);
    const total = extractNumber(totalText);

    console.log('[Test] 數值 - 小計:', subtotal, '稅額:', tax, '運費:', shipping, '總計:', total);

    // 5. 驗證計算正確
    expect(subtotal).toBeGreaterThan(0);
    expect(total).toBe(subtotal + tax + shipping);

    // 6. 驗證稅額約為 5% (台灣營業稅)
    const expectedTax = Math.round(subtotal * 0.05);
    expect(tax).toBe(expectedTax);

    // 7. 驗證運費邏輯 (假設滿 1000 免運,否則 100)
    const expectedShipping = subtotal >= 1000 ? 0 : 100;
    expect(shipping).toBe(expectedShipping);
  });
});

test.describe('購物車持久化', () => {
  test('應該在重新整理後保留購物車資料', async ({ page }) => {
    // 1. 加入商品到購物車
    await page.goto('/products');
    const productCard = page.locator('mat-card, .product-card').first();
    await productCard.click();

    const addToCartButton = page.locator('button').filter({
      hasText: /加入購物車/i,
    });
    await addToCartButton.click();
    await page.waitForTimeout(1000);

    // 2. 前往購物車並獲取項目數
    await page.goto('/cart');
    const cartItems = page.locator('.cart-item, mat-card').filter({
      has: page.locator('button'),
    });

    const beforeReloadCount = await cartItems.count();
    console.log('[Test] 重新整理前的購物車項目數:', beforeReloadCount);

    expect(beforeReloadCount).toBeGreaterThan(0);

    // 3. 重新整理頁面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 4. 驗證購物車項目仍然存在
    const afterReloadCount = await cartItems.count();
    console.log('[Test] 重新整理後的購物車項目數:', afterReloadCount);

    expect(afterReloadCount).toBe(beforeReloadCount);
  });

  test('應該在 LocalStorage 中正確儲存購物車', async ({ page, context }) => {
    // 1. 加入商品到購物車
    await page.goto('/products');
    const productCard = page.locator('mat-card, .product-card').first();
    await productCard.click();

    const addToCartButton = page.locator('button').filter({
      hasText: /加入購物車/i,
    });
    await addToCartButton.click();
    await page.waitForTimeout(1000);

    // 2. 檢查 LocalStorage
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('cart_items');
      return data ? JSON.parse(data) : null;
    });

    console.log('[Test] LocalStorage 購物車資料:', cartData);

    // 3. 驗證資料結構
    expect(cartData).toBeTruthy();
    expect(Array.isArray(cartData)).toBeTruthy();
    expect(cartData.length).toBeGreaterThan(0);

    // 4. 驗證第一個項目的必要欄位
    const firstItem = cartData[0];
    expect(firstItem).toHaveProperty('productId');
    expect(firstItem).toHaveProperty('quantity');
    expect(firstItem).toHaveProperty('unitPrice');
    expect(firstItem).toHaveProperty('subtotal');
  });
});
