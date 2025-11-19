import { test, expect } from '@playwright/test';
import { LoginPage, HeaderPage } from './page-objects';

/**
 * 煙霧測試 (Smoke Tests)
 *
 * 確保登入後所有關鍵頁面都可以正常訪問
 * 這些測試應該最先運行，快速發現基礎問題
 */
test.describe('Smoke Tests - All Pages Accessible', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login('admin@koopa.com', 'admin123');
  });

  test('should access homepage after login', async ({ page }) => {
    // ✅ 這個測試會發現雙 header 問題！
    await expect(page).toHaveURL('/home');

    // Verify homepage content exists
    await expect(page.locator('.hero-section')).toBeVisible();
    await expect(page.locator('.categories-section')).toBeVisible();
    await expect(page.locator('.featured-section')).toBeVisible();

    // Verify no duplicate header (should only have ONE app-header)
    const headerCount = await page.locator('app-header').count();
    expect(headerCount).toBe(1);

    // Verify mat-toolbar exists
    const toolbarCount = await page.locator('mat-toolbar').count();
    expect(toolbarCount).toBe(1);
  });

  test('should access products page', async ({ page }) => {
    const headerPage = new HeaderPage(page);

    await headerPage.navigateTo('products');
    await expect(page).toHaveURL('/products');

    // Should not show error or redirect to login
    await expect(page).not.toHaveURL('/auth/login');
  });

  test('should access categories page', async ({ page }) => {
    // ✅ 這個測試會發現分類路由缺失問題！
    const headerPage = new HeaderPage(page);

    await headerPage.navigateTo('categories');
    await expect(page).toHaveURL('/categories');

    // Should not redirect to login (404 → login)
    await expect(page).not.toHaveURL('/auth/login');
  });

  test('should access cart page', async ({ page }) => {
    const headerPage = new HeaderPage(page);

    await headerPage.navigateTo('cart');
    await expect(page).toHaveURL('/cart');

    // Should show cart page (empty or with items)
    const hasEmptyState = await page.locator('[data-testid="cart-empty"]').isVisible().catch(() => false);
    const hasCartItems = await page.locator('[data-testid="cart-items"]').isVisible().catch(() => false);

    expect(hasEmptyState || hasCartItems).toBe(true);
  });

  test('should access orders page', async ({ page }) => {
    const headerPage = new HeaderPage(page);

    await headerPage.navigateTo('orders');
    await expect(page).toHaveURL('/orders');

    // Should not show error
    await expect(page).not.toHaveURL('/auth/login');
  });

  test('all navigation links should work', async ({ page }) => {
    // ✅ 這個測試會發現所有導航問題！
    const headerPage = new HeaderPage(page);

    const navLinks = [
      { name: 'products', expectedUrl: '/products' },
      { name: 'categories', expectedUrl: '/categories' },
      { name: 'cart', expectedUrl: '/cart' },
      { name: 'orders', expectedUrl: '/orders' },
    ];

    for (const { name, expectedUrl } of navLinks) {
      await headerPage.navigateTo(name);
      await expect(page).toHaveURL(expectedUrl);

      // Verify not 404 or error page
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).not.toContain('404');
      expect(bodyText).not.toContain('Page not found');
    }
  });
});

/**
 * 首頁內容測試
 * Homepage Content Tests
 */
test.describe('Homepage Content', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@koopa.com', 'admin123');
  });

  test('should display hero section', async ({ page }) => {
    await expect(page).toHaveURL('/home');

    const heroSection = page.locator('.hero-section');
    await expect(heroSection).toBeVisible();

    // Verify hero content
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.hero-subtitle')).toBeVisible();
    await expect(page.locator('.hero-cta')).toBeVisible();
  });

  test('should display categories grid', async ({ page }) => {
    await expect(page).toHaveURL('/home');

    const categoriesGrid = page.locator('.categories-grid');
    await expect(categoriesGrid).toBeVisible();

    // Should have 6 categories
    const categoryCards = page.locator('.category-card');
    const count = await categoryCards.count();
    expect(count).toBe(6);
  });

  test('should display featured products', async ({ page }) => {
    await expect(page).toHaveURL('/home');

    const featuredSection = page.locator('.featured-section');
    await expect(featuredSection).toBeVisible();

    // Should have featured products
    const featuredProducts = featuredSection.locator('.product-card');
    const count = await featuredProducts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display new arrivals', async ({ page }) => {
    await expect(page).toHaveURL('/home');

    const newArrivalsSection = page.locator('.new-arrivals-section');
    await expect(newArrivalsSection).toBeVisible();

    // Should have new arrival products
    const newProducts = newArrivalsSection.locator('.product-card');
    const count = await newProducts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to category when clicked', async ({ page }) => {
    await expect(page).toHaveURL('/home');

    // Click first category card
    const firstCategory = page.locator('.category-card').first();
    await firstCategory.click();

    // Should navigate to categories page
    await expect(page).toHaveURL(/\/categories\/.+/);
  });

  test('should navigate to product detail when clicked', async ({ page }) => {
    await expect(page).toHaveURL('/home');

    // Click first product card
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.click();

    // Should navigate to product detail page
    await expect(page).toHaveURL(/\/products\/.+/);
  });
});

/**
 * 視覺回歸測試 (可選)
 * Visual Regression Tests
 */
test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@koopa.com', 'admin123');
  });

  test('homepage should match snapshot', async ({ page }) => {
    await expect(page).toHaveURL('/home');

    // Wait for all images to load
    await page.waitForLoadState('networkidle');

    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
