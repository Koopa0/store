/**
 * Login Page Object Model
 *
 * Encapsulates interactions with the login page for E2E testing
 */

import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordToggle: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="login-email-input"]');
    this.passwordInput = page.locator('[data-testid="login-password-input"]');
    this.passwordToggle = page.locator('[data-testid="login-password-toggle"]');
    this.rememberMeCheckbox = page.locator('[data-testid="login-remember-me"]');
    this.forgotPasswordLink = page.locator('[data-testid="login-forgot-password"]');
    this.submitButton = page.locator('[data-testid="login-submit-button"]');
    this.registerLink = page.locator('[data-testid="login-register-link"]');
    this.errorMessage = page.locator('[data-testid="login-error-message"]');
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto('/auth/login');
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.submitButton.click();
  }

  /**
   * Toggle password visibility
   */
  async togglePassword() {
    await this.passwordToggle.click();
  }

  /**
   * Get password input type (to verify visibility)
   */
  async getPasswordInputType(): Promise<string | null> {
    return await this.passwordInput.getAttribute('type');
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Click register link
   */
  async clickRegister() {
    await this.registerLink.click();
  }

  /**
   * Check if error message is visible
   */
  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
}
