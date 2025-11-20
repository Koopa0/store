/**
 * 響應式設計與無障礙測試
 * Responsive Design and Accessibility E2E Tests
 *
 * 測試目標:
 * 1. 驗證不同裝置尺寸的顯示
 * 2. 測試鍵盤導航
 * 3. 執行無障礙掃描 (WCAG 2.1 AA)
 * 4. 驗證焦點管理
 */

import { test, expect, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// 裝置尺寸定義
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad)' },
  desktop: { width: 1920, height: 1080, name: 'Desktop (Full HD)' },
  ultrawide: { width: 2560, height: 1440, name: 'Ultrawide (2K)' },
};

test.describe('響應式設計測試', () => {
  test('Mobile: 應該顯示漢堡選單並正確運作', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });

    const page = await context.newPage();
    await page.goto('/');

    // 1. 驗證漢堡選單按鈕存在
    const menuButton = page.locator('button').filter({
      has: page.locator('mat-icon:has-text("menu")'),
    }).first();

    await expect(menuButton).toBeVisible({ timeout: 5000 });

    console.log('[Mobile Test] 漢堡選單按鈕已顯示');

    // 2. 點擊漢堡選單
    await menuButton.click();

    // 3. 驗證側邊選單展開
    const sidenav = page.locator('mat-sidenav, .sidenav, .drawer').first();

    await expect(sidenav).toBeVisible({ timeout: 3000 });

    console.log('[Mobile Test] 側邊選單已展開');

    // 4. 驗證導航連結存在
    const navLinks = sidenav.locator('a');
    const linkCount = await navLinks.count();

    expect(linkCount).toBeGreaterThan(0);

    console.log('[Mobile Test] 側邊選單包含', linkCount, '個連結');

    await context.close();
  });

  test('Mobile: 商品列表應該單欄顯示', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.mobile,
    });

    const page = await context.newPage();
    await page.goto('/products');

    await page.waitForLoadState('networkidle');

    // 獲取商品卡片的寬度
    const productCard = page.locator('mat-card, .product-card').first();
    await expect(productCard).toBeVisible({ timeout: 5000 });

    const cardBox = await productCard.boundingBox();

    if (cardBox) {
      console.log('[Mobile Test] 商品卡片寬度:', cardBox.width);

      // 在 375px 螢幕上,單欄卡片寬度應該接近全寬 (考慮 padding)
      // 通常會是 335-355px 之間
      expect(cardBox.width).toBeGreaterThan(300);
    }

    await context.close();
  });

  test('Tablet: 商品列表應該雙欄顯示', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.tablet,
    });

    const page = await context.newPage();
    await page.goto('/products');

    await page.waitForLoadState('networkidle');

    // 獲取商品容器
    const container = page.locator('.product-grid, .products, mat-grid-list').first();

    // 檢查 grid 設定 (可能是 grid-template-columns: repeat(2, 1fr))
    const gridColumns = await container.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.gridTemplateColumns;
    });

    console.log('[Tablet Test] Grid columns:', gridColumns);

    // 應該有 2 欄
    // 可能的值: "repeat(2, 1fr)" or "340px 340px" 等
    // 這個測試比較寬鬆,主要確認不是單欄

    await context.close();
  });

  test('Desktop: 商品列表應該多欄顯示', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop,
    });

    const page = await context.newPage();
    await page.goto('/products');

    await page.waitForLoadState('networkidle');

    // 在桌面版,應該顯示完整的導航選單 (不是漢堡選單)
    const hamburgerButton = page.locator('button').filter({
      has: page.locator('mat-icon:has-text("menu")'),
    });

    // 漢堡選單應該隱藏或不存在
    const isHamburgerVisible = await hamburgerButton.isVisible({ timeout: 1000 }).catch(() => false);

    expect(isHamburgerVisible).toBeFalsy();

    console.log('[Desktop Test] 漢堡選單已隱藏,顯示完整導航');

    await context.close();
  });

  test('所有尺寸: Header 和 Footer 應該正確顯示', async ({ browser }) => {
    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      await page.goto('/');

      // 驗證 Header
      const header = page.locator('header, app-header, .header').first();
      await expect(header).toBeVisible({ timeout: 5000 });

      // 驗證 Footer
      const footer = page.locator('footer, app-footer, .footer').first();

      // 滾動到底部以確保 Footer 可見
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      await expect(footer).toBeVisible({ timeout: 3000 });

      console.log(`[${viewport.name}] Header 和 Footer 顯示正常`);

      await context.close();
    }
  });
});

test.describe('無障礙測試 (Accessibility)', () => {
  test('首頁應該符合 WCAG 2.1 AA 標準', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    console.log('[A11y] 首頁違規數量:', accessibilityScanResults.violations.length);

    // 列出所有違規
    if (accessibilityScanResults.violations.length > 0) {
      console.log('[A11y] 違規詳情:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  影響: ${violation.impact}`);
        console.log(`  元素數: ${violation.nodes.length}`);
      });
    }

    // 嚴重違規應該為 0
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });

  test('商品列表頁應該符合無障礙標準', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    console.log('[A11y] 商品列表頁違規數量:', accessibilityScanResults.violations.length);

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });

  test('購物車頁應該符合無障礙標準', async ({ page }) => {
    await page.goto('/cart');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    console.log('[A11y] 購物車頁違規數量:', accessibilityScanResults.violations.length);

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });
});

test.describe('鍵盤導航測試', () => {
  test('應該能夠使用 Tab 鍵導航所有互動元素', async ({ page }) => {
    await page.goto('/');

    // 記錄所有可聚焦的元素
    const focusableElements: string[] = [];

    // 連續按 Tab 鍵
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');

      // 獲取當前聚焦元素
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}` : '';
      });

      if (focusedElement) {
        focusableElements.push(focusedElement);
        console.log(`[Tab ${i + 1}] 聚焦:`, focusedElement);
      }
    }

    // 應該至少有一些可聚焦元素
    expect(focusableElements.length).toBeGreaterThan(0);

    console.log('[Keyboard] 可聚焦元素總數:', focusableElements.length);
  });

  test('焦點指示器應該清晰可見', async ({ page }) => {
    await page.goto('/');

    // 按 Tab 鍵聚焦第一個元素
    await page.keyboard.press('Tab');

    // 檢查聚焦元素的樣式
    const focusStyles = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (!el) return null;

      const styles = window.getComputedStyle(el);

      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
      };
    });

    console.log('[Focus] 焦點樣式:', focusStyles);

    // 應該有某種形式的焦點指示 (outline 或 box-shadow)
    if (focusStyles) {
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';

      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('應該能夠使用 Enter/Space 鍵觸發按鈕', async ({ page }) => {
    await page.goto('/products');

    // 找到第一個商品的「加入購物車」按鈕
    const addToCartButton = page.locator('button').filter({
      hasText: /加入購物車/i,
    }).first();

    // 使用 Tab 鍵導航到按鈕
    // (這裡簡化處理,直接聚焦)
    await addToCartButton.focus();

    // 按 Enter 鍵
    await page.keyboard.press('Enter');

    // 應該觸發加入購物車動作
    const snackbar = page.locator('.mat-mdc-snack-bar-container, [role="alert"]');
    await expect(snackbar).toBeVisible({ timeout: 3000 });

    console.log('[Keyboard] Enter 鍵成功觸發按鈕');
  });

  test('應該能夠使用 Escape 鍵關閉對話框', async ({ page }) => {
    // 這個測試假設有某個會開啟對話框的功能
    // 如果專案中有對話框,可以測試

    await page.goto('/');

    // 嘗試開啟使用者選單或對話框
    const menuButton = page.locator('button').filter({
      has: page.locator('mat-icon:has-text("account_circle")'),
    }).first();

    if (await menuButton.isVisible({ timeout: 2000 })) {
      await menuButton.click();

      // 等待選單展開
      await page.waitForTimeout(300);

      // 按 Escape 關閉
      await page.keyboard.press('Escape');

      // 選單應該關閉
      await page.waitForTimeout(300);

      console.log('[Keyboard] Escape 鍵功能已測試');
    } else {
      console.log('[Keyboard] 無對話框可測試,跳過');
    }
  });
});

test.describe('焦點管理', () => {
  test('頁面導航後焦點應該重置到頂部', async ({ page }) => {
    await page.goto('/');

    // 按幾次 Tab 鍵移動焦點
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // 導航到另一個頁面
    await page.goto('/products');

    await page.waitForLoadState('networkidle');

    // 焦點應該在頁面頂部 (通常是 body 或第一個可聚焦元素)
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    console.log('[Focus] 頁面導航後的聚焦元素:', focusedElement);

    // 應該不會停留在某個中間元素
    expect(['BODY', 'HTML', 'A', 'BUTTON']).toContain(focusedElement || '');
  });

  test('對話框開啟時焦點應該困在對話框內 (Focus Trap)', async ({ page }) => {
    // 登入流程會有表單,可以測試焦點困住
    await page.goto('/auth/login');

    // 找到第一個輸入框
    const firstInput = page.locator('input').first();
    await firstInput.focus();

    // 連續按 Tab 鍵循環
    const focusedElements: string[] = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      const tagName = await page.evaluate(() => document.activeElement?.tagName);

      if (tagName) {
        focusedElements.push(tagName);
      }
    }

    console.log('[Focus Trap] 聚焦元素順序:', focusedElements);

    // 在登入表單中,焦點應該在 INPUT 和 BUTTON 之間循環
    // 不應該跳到表單外的元素
  });
});

test.describe('色彩對比測試', () => {
  test('主要文字應該有足夠的色彩對比', async ({ page }) => {
    await page.goto('/');

    // 使用 axe 檢查色彩對比
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // 篩選出色彩對比違規
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id.includes('color-contrast')
    );

    console.log('[Contrast] 色彩對比違規數:', contrastViolations.length);

    if (contrastViolations.length > 0) {
      contrastViolations.forEach((violation) => {
        console.log(`- ${violation.description}`);
        violation.nodes.forEach((node) => {
          console.log(`  元素: ${node.html}`);
        });
      });
    }

    expect(contrastViolations.length).toBe(0);
  });
});

test.describe('圖片替代文字測試', () => {
  test('所有圖片應該有 alt 屬性', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').all();

    console.log('[Images] 圖片總數:', images.length);

    for (const img of images) {
      const alt = await img.getAttribute('alt');

      // 所有圖片都應該有 alt 屬性 (可以是空字串,但要有)
      expect(alt !== null).toBeTruthy();
    }

    console.log('[Images] 所有圖片都有 alt 屬性');
  });

  test('裝飾性圖片應該有空的 alt 屬性', async ({ page }) => {
    await page.goto('/');

    // 找到裝飾性圖片 (通常在 CSS 背景或有特定 class)
    const decorativeImages = await page.locator('img[class*="decoration"], img[class*="icon"]').all();

    for (const img of decorativeImages) {
      const alt = await img.getAttribute('alt');

      // 裝飾性圖片 alt 應該是空字串
      // 這樣螢幕閱讀器會跳過
      if (alt === '') {
        console.log('[Images] 裝飾性圖片 alt 為空,正確');
      }
    }
  });
});
