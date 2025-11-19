import { test, expect } from '@playwright/test';
import { LoginPage, HeaderPage } from './page-objects';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const headerPage = new HeaderPage(page);

    // Navigate to home and click login button
    await page.goto('/');
    await headerPage.clickLogin();

    // Verify we're on the login page
    await expect(page).toHaveURL('/auth/login');

    // Login with valid credentials
    await loginPage.login('admin@koopa.com', 'admin123');

    // Verify logged in - should redirect to /home (not /) and show user menu
    await expect(page).toHaveURL('/home');
    await expect(await headerPage.isLoggedIn()).toBe(true);

    // Verify homepage content is visible (not duplicate header)
    await expect(page.locator('.hero-section')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const headerPage = new HeaderPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login('admin@koopa.com', 'admin123');

    // Wait for redirect to home
    await expect(page).toHaveURL('/home');

    // Logout
    await headerPage.logout();

    // Verify logged out - should show login button
    await expect(await headerPage.isLoginButtonVisible()).toBe(true);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Login with invalid credentials
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Verify error message is shown
    await expect(await loginPage.isErrorVisible()).toBe(true);
  });

  test('should toggle password visibility', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Password should be hidden by default
    let passwordType = await loginPage.getPasswordInputType();
    expect(passwordType).toBe('password');

    // Toggle to show password
    await loginPage.togglePassword();
    passwordType = await loginPage.getPasswordInputType();
    expect(passwordType).toBe('text');

    // Toggle to hide password again
    await loginPage.togglePassword();
    passwordType = await loginPage.getPasswordInputType();
    expect(passwordType).toBe('password');
  });

  test('should login with remember me option', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const headerPage = new HeaderPage(page);

    await loginPage.goto();

    // Login with remember me checked
    await loginPage.login('user@koopa.com', 'user123', true);

    // Verify logged in - should redirect to /home
    await expect(page).toHaveURL('/home');
    await expect(await headerPage.isLoggedIn()).toBe(true);
  });
});
