/**
 * Cart Page Object Model
 *
 * Encapsulates interactions with the cart page for E2E testing
 */

import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly emptyCartContainer: Locator;
  readonly emptyCartContinueButton: Locator;
  readonly cartItems: Locator;
  readonly clearCartButton: Locator;
  readonly cartSummary: Locator;
  readonly summarySubtotal: Locator;
  readonly summaryTax: Locator;
  readonly summaryShipping: Locator;
  readonly summaryTotal: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emptyCartContainer = page.locator('[data-testid="cart-empty"]');
    this.emptyCartContinueButton = page.locator('[data-testid="cart-empty-continue-shopping"]');
    this.cartItems = page.locator('[data-testid="cart-items"]');
    this.clearCartButton = page.locator('[data-testid="cart-clear-button"]');
    this.cartSummary = page.locator('[data-testid="cart-summary"]');
    this.summarySubtotal = page.locator('[data-testid="cart-summary-subtotal"]');
    this.summaryTax = page.locator('[data-testid="cart-summary-tax"]');
    this.summaryShipping = page.locator('[data-testid="cart-summary-shipping"]');
    this.summaryTotal = page.locator('[data-testid="cart-summary-total"]');
    this.continueShoppingButton = page.locator('[data-testid="cart-continue-shopping"]');
    this.checkoutButton = page.locator('[data-testid="cart-checkout-button"]');
  }

  /**
   * Navigate to the cart page
   */
  async goto() {
    await this.page.goto('/cart');
  }

  /**
   * Check if cart is empty
   */
  async isEmpty(): Promise<boolean> {
    try {
      return await this.emptyCartContainer.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get cart item by ID
   */
  getCartItem(itemId: string): Locator {
    return this.page.locator(`[data-testid="cart-item-${itemId}"]`);
  }

  /**
   * Get quantity input for a cart item
   */
  getItemQuantityInput(itemId: string): Locator {
    return this.page.locator(`[data-testid="cart-item-quantity-${itemId}"]`);
  }

  /**
   * Increase quantity for a cart item
   */
  async increaseQuantity(itemId: string) {
    await this.page.locator(`[data-testid="cart-item-increase-${itemId}"]`).click();
  }

  /**
   * Decrease quantity for a cart item
   */
  async decreaseQuantity(itemId: string) {
    await this.page.locator(`[data-testid="cart-item-decrease-${itemId}"]`).click();
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string) {
    await this.page.locator(`[data-testid="cart-item-remove-${itemId}"]`).click();
  }

  /**
   * Update item quantity manually
   */
  async updateItemQuantity(itemId: string, quantity: number) {
    const input = this.getItemQuantityInput(itemId);
    await input.fill(quantity.toString());
    await input.press('Enter');
  }

  /**
   * Clear all items from cart
   */
  async clearCart() {
    await this.clearCartButton.click();
  }

  /**
   * Continue shopping
   */
  async continueShopping() {
    if (await this.isEmpty()) {
      await this.emptyCartContinueButton.click();
    } else {
      await this.continueShoppingButton.click();
    }
  }

  /**
   * Proceed to checkout
   */
  async checkout() {
    await this.checkoutButton.click();
  }

  /**
   * Get subtotal amount
   */
  async getSubtotal(): Promise<string> {
    return await this.summarySubtotal.textContent() || '';
  }

  /**
   * Get tax amount
   */
  async getTax(): Promise<string> {
    return await this.summaryTax.textContent() || '';
  }

  /**
   * Get shipping amount
   */
  async getShipping(): Promise<string> {
    return await this.summaryShipping.textContent() || '';
  }

  /**
   * Get total amount
   */
  async getTotal(): Promise<string> {
    return await this.summaryTotal.textContent() || '';
  }

  /**
   * Get count of items in cart
   */
  async getItemCount(): Promise<number> {
    if (await this.isEmpty()) {
      return 0;
    }
    const items = await this.page.locator('[data-testid^="cart-item-"]').count();
    return items;
  }

  /**
   * Check if checkout button is enabled
   */
  async isCheckoutEnabled(): Promise<boolean> {
    return await this.checkoutButton.isEnabled();
  }
}
