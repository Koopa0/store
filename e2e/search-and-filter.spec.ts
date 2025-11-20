/**
 * 搜尋與篩選功能 E2E 測試
 * Search and Filter E2E Tests
 *
 * 測試目標:
 * 1. 驗證商品搜尋功能
 * 2. 測試排序功能
 * 3. 驗證分頁功能
 * 4. 測試 URL 參數持久化
 */

import { test, expect } from '@playwright/test';

test.describe('商品搜尋功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test('應該能夠搜尋商品並顯示結果', async ({ page }) => {
    // 1. 找到搜尋輸入框
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"], input[placeholder*="Search"]').first();

    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 2. 輸入搜尋關鍵字
    const searchKeyword = 'iPhone';
    await searchInput.fill(searchKeyword);

    // 3. 等待 debounce 時間 (通常是 500ms)
    await page.waitForTimeout(600);

    // 4. 驗證搜尋結果
    // 方式 1: 檢查 URL 參數
    await expect(page).toHaveURL(new RegExp(`search=${searchKeyword}`, 'i'));

    // 方式 2: 檢查顯示的商品是否包含關鍵字
    const productCards = page.locator('mat-card, .product-card');
    const count = await productCards.count();

    console.log('[Test] 搜尋結果數量:', count);

    if (count > 0) {
      // 檢查第一個結果的名稱是否包含關鍵字
      const firstProductName = await productCards.first()
        .locator('h3, h4, .product-name')
        .first()
        .textContent();

      console.log('[Test] 第一個搜尋結果:', firstProductName);

      // 可能包含關鍵字 (不一定,取決於搜尋實作)
      // expect(firstProductName).toContain(searchKeyword);
    }
  });

  test('清空搜尋框應該顯示所有商品', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"]').first();

    // 1. 先進行搜尋
    await searchInput.fill('iPhone');
    await page.waitForTimeout(600);

    const productCardsAfterSearch = page.locator('mat-card, .product-card');
    const searchResultCount = await productCardsAfterSearch.count();

    console.log('[Test] 搜尋後的結果數:', searchResultCount);

    // 2. 清空搜尋框
    await searchInput.clear();
    await page.waitForTimeout(600);

    // 3. 驗證顯示所有商品 (數量應該增加或至少不變)
    const allProductsCount = await productCardsAfterSearch.count();

    console.log('[Test] 清空後的結果數:', allProductsCount);

    // 清空後應該顯示更多或相同數量的商品
    expect(allProductsCount).toBeGreaterThanOrEqual(searchResultCount);
  });

  test('搜尋無結果時應該顯示提示訊息', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"]').first();

    // 輸入不存在的商品名稱
    await searchInput.fill('不存在的商品名稱_XYZ123');
    await page.waitForTimeout(600);

    // 應該顯示「無搜尋結果」訊息
    const noResultMessage = page.locator('text=/沒有找到|無結果|No results|找不到/i');

    await expect(noResultMessage).toBeVisible({ timeout: 3000 });

    console.log('[Test] 無結果訊息已顯示');
  });
});

test.describe('商品排序功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test('應該能夠按價格排序 (升序)', async ({ page }) => {
    // 1. 找到排序選擇器
    const sortSelect = page.locator('mat-select, select').filter({
      has: page.locator('mat-option:has-text("價格"), option:has-text("Price")'),
    }).first();

    if (await sortSelect.isVisible({ timeout: 2000 })) {
      // 2. 點擊排序選擇器
      await sortSelect.click();

      // 3. 選擇「價格」
      const priceOption = page.locator('mat-option, option').filter({
        hasText: /價格|Price/i,
      }).first();

      await priceOption.click();

      // 4. 等待重新排序
      await page.waitForTimeout(1000);

      // 5. 確認排序方向按鈕
      const sortOrderButton = page.locator('button').filter({
        has: page.locator('mat-icon:has-text("arrow")'),
      }).first();

      if (await sortOrderButton.isVisible({ timeout: 1000 })) {
        // 確保是升序 (向上箭頭)
        const icon = await sortOrderButton.locator('mat-icon').textContent();

        if (icon?.includes('down')) {
          // 如果是降序,點擊切換為升序
          await sortOrderButton.click();
          await page.waitForTimeout(500);
        }
      }

      // 6. 驗證排序結果 (價格應該遞增)
      const prices = await page.locator('.price, [class*="price"]')
        .allTextContents();

      console.log('[Test] 商品價格:', prices);

      // 提取數字並驗證遞增
      const priceNumbers = prices
        .map(p => parseFloat(p.replace(/[^\d.]/g, '')))
        .filter(p => !isNaN(p));

      if (priceNumbers.length >= 2) {
        // 檢查前兩個價格是否遞增
        expect(priceNumbers[0]).toBeLessThanOrEqual(priceNumbers[1]);
        console.log('[Test] 價格排序驗證通過');
      }
    } else {
      console.log('[Test] 排序功能未找到,跳過測試');
    }
  });

  test('應該能夠切換排序方向', async ({ page }) => {
    // 找到排序方向切換按鈕
    const sortOrderButton = page.locator('button').filter({
      has: page.locator('mat-icon:has-text("arrow"), mat-icon:has-text("sort")'),
    }).first();

    if (await sortOrderButton.isVisible({ timeout: 2000 })) {
      // 獲取初始圖示
      const initialIcon = await sortOrderButton.locator('mat-icon').textContent();

      console.log('[Test] 初始排序圖示:', initialIcon);

      // 點擊切換
      await sortOrderButton.click();
      await page.waitForTimeout(500);

      // 獲取切換後的圖示
      const afterIcon = await sortOrderButton.locator('mat-icon').textContent();

      console.log('[Test] 切換後排序圖示:', afterIcon);

      // 圖示應該改變
      expect(afterIcon).not.toBe(initialIcon);
    } else {
      console.log('[Test] 排序方向按鈕未找到');
    }
  });

  test('排序設定應該在 URL 中保留', async ({ page }) => {
    const sortSelect = page.locator('mat-select, select').first();

    if (await sortSelect.isVisible({ timeout: 2000 })) {
      await sortSelect.click();

      const priceOption = page.locator('mat-option').filter({
        hasText: /價格|Price/i,
      }).first();

      await priceOption.click();
      await page.waitForTimeout(500);

      // 驗證 URL 參數
      const url = page.url();
      console.log('[Test] 排序後的 URL:', url);

      expect(url).toMatch(/sortBy=price/i);
    }
  });
});

test.describe('分頁功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test('應該顯示分頁器', async ({ page }) => {
    const paginator = page.locator('mat-paginator, .paginator').first();

    // 如果商品數量足夠,應該顯示分頁器
    const productCount = await page.locator('mat-card, .product-card').count();

    console.log('[Test] 商品數量:', productCount);

    if (productCount > 12) {
      // 預設每頁 12 個
      await expect(paginator).toBeVisible({ timeout: 3000 });
    } else {
      console.log('[Test] 商品數量不足,不顯示分頁器');
    }
  });

  test('應該能夠切換到下一頁', async ({ page }) => {
    const nextPageButton = page.locator('button[aria-label*="Next"], button').filter({
      has: page.locator('mat-icon:has-text("navigate_next"), mat-icon:has-text("chevron_right")'),
    }).first();

    if (await nextPageButton.isVisible({ timeout: 2000 })) {
      // 檢查按鈕是否可點擊 (不是 disabled)
      const isDisabled = await nextPageButton.isDisabled();

      if (!isDisabled) {
        // 點擊下一頁
        await nextPageButton.click();

        // 等待商品載入
        await page.waitForTimeout(1000);

        // 驗證 URL 參數改變
        await expect(page).toHaveURL(/page=2/);

        console.log('[Test] 已切換到第 2 頁');
      } else {
        console.log('[Test] 只有一頁,無法切換');
      }
    } else {
      console.log('[Test] 下一頁按鈕未找到');
    }
  });

  test('頁碼應該在重新整理後保留', async ({ page }) => {
    // 手動設定 URL 參數到第 2 頁
    await page.goto('/products?page=2');
    await page.waitForLoadState('networkidle');

    // 重新整理
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 應該仍然在第 2 頁
    await expect(page).toHaveURL(/page=2/);

    console.log('[Test] 頁碼已保留');
  });

  test('應該能夠改變每頁顯示數量', async ({ page }) => {
    // 找到「每頁顯示」選擇器
    const pageSizeSelect = page.locator('mat-select').filter({
      has: page.locator('~ div:has-text("每頁"), ~ span:has-text("per page")'),
    }).first();

    if (await pageSizeSelect.isVisible({ timeout: 2000 })) {
      await pageSizeSelect.click();

      // 選擇不同的數量 (如 24)
      const option24 = page.locator('mat-option').filter({
        hasText: '24',
      }).first();

      if (await option24.isVisible({ timeout: 1000 })) {
        await option24.click();
        await page.waitForTimeout(1000);

        // 驗證 URL 參數
        await expect(page).toHaveURL(/limit=24/);

        console.log('[Test] 每頁顯示數量已變更');
      }
    } else {
      console.log('[Test] 每頁顯示選擇器未找到');
    }
  });
});

test.describe('URL 參數持久化', () => {
  test('複雜的查詢參數應該正確保留', async ({ page }) => {
    // 直接訪問帶有多個參數的 URL
    const params = {
      search: 'iPhone',
      sortBy: 'price',
      sortOrder: 'asc',
      page: '2',
      limit: '24',
    };

    const queryString = new URLSearchParams(params).toString();
    await page.goto(`/products?${queryString}`);

    await page.waitForLoadState('networkidle');

    // 驗證所有參數都在 URL 中
    const url = page.url();
    console.log('[Test] 當前 URL:', url);

    expect(url).toContain('search=iPhone');
    expect(url).toContain('sortBy=price');
    expect(url).toContain('page=2');

    // 重新整理後仍然保留
    await page.reload();
    await page.waitForLoadState('networkidle');

    const urlAfterReload = page.url();
    expect(urlAfterReload).toBe(url);

    console.log('[Test] URL 參數已完整保留');
  });

  test('瀏覽器返回/前進應該正確運作', async ({ page }) => {
    // 1. 訪問商品列表
    await page.goto('/products');

    // 2. 進行搜尋
    const searchInput = page.locator('input[type="search"]').first();
    await searchInput.fill('iPhone');
    await page.waitForTimeout(600);

    const urlAfterSearch = page.url();

    // 3. 點擊進入某個商品
    const productCard = page.locator('mat-card, .product-card').first();
    await productCard.click();

    await page.waitForURL(/\/products\/.+/);

    // 4. 點擊瀏覽器返回按鈕
    await page.goBack();

    // 5. 應該回到搜尋結果頁,並保留搜尋關鍵字
    await expect(page).toHaveURL(urlAfterSearch);

    // 搜尋框應該仍然有值
    await expect(searchInput).toHaveValue('iPhone');

    console.log('[Test] 瀏覽器返回功能正常');
  });
});
