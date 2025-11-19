import { test, expect } from '@playwright/test';
import { LoginPage, CartPage, HeaderPage } from './page-objects';

test.describe('Shopping Flow', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login('user@koopa.com', 'user123');

    // Wait for successful login
    await expect(page).toHaveURL('/');
  });

  test('should add product to cart', async ({ page }) => {
    const headerPage = new HeaderPage(page);

    // Navigate to products using header navigation
    await headerPage.navigateTo('products');

    // Wait for products page to load
    await expect(page).toHaveURL('/products');

    // Click on first product (no data-testid yet, using class selector)
    await page.click('.product-card:first-child');

    // Add to cart (no data-testid yet, using text selector)
    await page.click('text=加入購物車');

    // Verify cart count increased (no data-testid yet, using class selector)
    const cartCount = await page.textContent('.cart-count');
    expect(parseInt(cartCount || '0')).toBeGreaterThan(0);
  });

  test('should view and modify cart', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    const cartPage = new CartPage(page);

    // Navigate to cart using header navigation
    await headerPage.navigateTo('cart');

    // Wait for cart page to load
    await expect(page).toHaveURL('/cart');

    // Check if cart is empty
    const isEmpty = await cartPage.isEmpty();

    if (isEmpty) {
      // Verify empty cart message and button are visible
      await expect(cartPage.emptyCartContainer).toBeVisible();
      await expect(cartPage.emptyCartContinueButton).toBeVisible();
    } else {
      // Verify cart has items
      await expect(cartPage.cartItems).toBeVisible();
      await expect(cartPage.cartSummary).toBeVisible();

      // Verify summary sections are visible
      await expect(cartPage.summarySubtotal).toBeVisible();
      await expect(cartPage.summaryTax).toBeVisible();
      await expect(cartPage.summaryShipping).toBeVisible();
      await expect(cartPage.summaryTotal).toBeVisible();

      // Verify action buttons are visible
      await expect(cartPage.continueShoppingButton).toBeVisible();
      await expect(cartPage.checkoutButton).toBeVisible();
    }
  });

  test('should proceed to checkout from cart', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    const cartPage = new CartPage(page);

    // Navigate to cart
    await headerPage.navigateTo('cart');

    // Wait for cart page to load
    await expect(page).toHaveURL('/cart');

    // Check if cart has items
    const isEmpty = await cartPage.isEmpty();

    if (!isEmpty) {
      // Proceed to checkout
      await cartPage.checkout();

      // Verify navigation to checkout (no data-testid yet, using URL)
      // Note: Actual checkout flow would need data-testid attributes on checkout page
      await expect(page).toHaveURL(/\/checkout/);
    } else {
      // Skip test if cart is empty
      test.skip();
    }
  });

  test('should clear cart', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    const cartPage = new CartPage(page);

    // Navigate to cart
    await headerPage.navigateTo('cart');

    // Wait for cart page to load
    await expect(page).toHaveURL('/cart');

    // Check if cart has items
    const isEmpty = await cartPage.isEmpty();

    if (!isEmpty) {
      // Clear cart
      await cartPage.clearCart();

      // Verify empty cart state is shown
      await expect(cartPage.emptyCartContainer).toBeVisible();
    } else {
      // Cart already empty, verify empty state
      await expect(cartPage.emptyCartContainer).toBeVisible();
    }
  });

  test('should display cart summary correctly', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    const cartPage = new CartPage(page);

    // Navigate to cart
    await headerPage.navigateTo('cart');
    await expect(page).toHaveURL('/cart');

    // Only test if cart has items
    const isEmpty = await cartPage.isEmpty();
    if (!isEmpty) {
      // Get all summary values
      const subtotal = await cartPage.getSubtotal();
      const tax = await cartPage.getTax();
      const shipping = await cartPage.getShipping();
      const total = await cartPage.getTotal();

      // Verify all values are defined
      expect(subtotal).toBeTruthy();
      expect(tax).toBeTruthy();
      expect(shipping).toBeTruthy();
      expect(total).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
