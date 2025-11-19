/**
 * Header Page Object Model
 *
 * Encapsulates interactions with the header/navigation bar for E2E testing
 */

import { Page, Locator } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly brandLink: Locator;
  readonly navigation: Locator;
  readonly themeToggle: Locator;
  readonly languageToggle: Locator;
  readonly loginButton: Locator;
  readonly userMenuButton: Locator;
  readonly profileButton: Locator;
  readonly settingsButton: Locator;
  readonly adminButton: Locator;
  readonly logoutButton: Locator;
  readonly mobileMenuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.brandLink = page.locator('[data-testid="header-brand-link"]');
    this.navigation = page.locator('[data-testid="header-nav"]');
    this.themeToggle = page.locator('[data-testid="header-theme-toggle"]');
    this.languageToggle = page.locator('[data-testid="header-language-toggle"]');
    this.loginButton = page.locator('[data-testid="header-login-button"]');
    this.userMenuButton = page.locator('[data-testid="header-user-menu-button"]');
    this.profileButton = page.locator('[data-testid="header-profile-button"]');
    this.settingsButton = page.locator('[data-testid="header-settings-button"]');
    this.adminButton = page.locator('[data-testid="header-admin-button"]');
    this.logoutButton = page.locator('[data-testid="header-logout-button"]');
    this.mobileMenuButton = page.locator('[data-testid="header-mobile-menu-button"]');
  }

  /**
   * Click on brand/logo to go home
   */
  async goHome() {
    await this.brandLink.click();
  }

  /**
   * Navigate to a specific page using header navigation
   */
  async navigateTo(path: string) {
    const normalizedPath = path.replace('/', '');
    await this.page.locator(`[data-testid="header-nav-${normalizedPath}"]`).click();
  }

  /**
   * Toggle theme (dark/light mode)
   */
  async toggleTheme() {
    await this.themeToggle.click();
  }

  /**
   * Toggle language
   */
  async toggleLanguage() {
    await this.languageToggle.click();
  }

  /**
   * Click login button (for unauthenticated users)
   */
  async clickLogin() {
    await this.loginButton.click();
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      return await this.userMenuButton.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.userMenuButton.click();
  }

  /**
   * Navigate to profile
   */
  async goToProfile() {
    await this.openUserMenu();
    await this.profileButton.click();
  }

  /**
   * Navigate to settings
   */
  async goToSettings() {
    await this.openUserMenu();
    await this.settingsButton.click();
  }

  /**
   * Navigate to admin panel (if available)
   */
  async goToAdmin() {
    await this.openUserMenu();
    await this.adminButton.click();
  }

  /**
   * Logout
   */
  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  /**
   * Toggle mobile menu
   */
  async toggleMobileMenu() {
    await this.mobileMenuButton.click();
  }

  /**
   * Check if login button is visible (user not logged in)
   */
  async isLoginButtonVisible(): Promise<boolean> {
    try {
      return await this.loginButton.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if admin button is available (user is admin)
   */
  async isAdminAvailable(): Promise<boolean> {
    await this.openUserMenu();
    try {
      return await this.adminButton.isVisible();
    } catch {
      return false;
    }
  }
}
