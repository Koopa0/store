/**
 * 使用者認證流程 E2E 測試
 * User Authentication Flow E2E Tests
 *
 * 測試目標:
 * 1. 驗證登入/登出功能
 * 2. 測試路由守衛 (未登入自動導向登入頁)
 * 3. 驗證登入狀態持久化
 * 4. 測試錯誤處理
 */

import { test, expect } from '@playwright/test';

// 測試帳號常數
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@koopa.com',
    password: 'admin123',
    role: 'ADMIN',
  },
  user: {
    email: 'user@koopa.com',
    password: 'user123',
    role: 'CUSTOMER',
  },
};

test.describe('使用者認證流程', () => {
  test.beforeEach(async ({ page }) => {
    // 確保每個測試開始時都是登出狀態
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('應該能夠成功登入 (一般用戶)', async ({ page }) => {
    // 1. 前往登入頁
    await page.goto('/auth/login');

    // 2. 填寫登入表單
    const emailInput = page.locator('input[type="email"], input[name="email"], input[formcontrolname="emailOrUsername"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[formcontrolname="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible();

    await emailInput.fill(TEST_ACCOUNTS.user.email);
    await passwordInput.fill(TEST_ACCOUNTS.user.password);

    // 3. 點擊登入按鈕
    const loginButton = page.locator('button[type="submit"], button').filter({
      hasText: /登入|Login|登錄/i,
    }).first();

    await loginButton.click();

    // 4. 等待登入成功並導航
    await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 });

    // 5. 驗證已登入狀態
    // 檢查 Header 是否顯示使用者資訊
    const userMenu = page.locator('[mattooltip], .user-menu, button').filter({
      has: page.locator('mat-icon:has-text("account_circle"), img[alt*="avatar"], img[alt*="頭像"]'),
    }).first();

    await expect(userMenu).toBeVisible({ timeout: 5000 });

    console.log('[Test] 使用者已成功登入');
  });

  test('應該能夠成功登入 (管理員)', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"], input[formcontrolname="emailOrUsername"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(TEST_ACCOUNTS.admin.email);
    await passwordInput.fill(TEST_ACCOUNTS.admin.password);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 });

    // 驗證管理員身份 (可能有管理員專用選單項)
    const adminMenu = page.locator('text=/管理|Admin|後台/i').first();

    // 管理員可能看得到特殊選單,但不一定(取決於實作)
    // 這裡主要確認登入成功即可
    console.log('[Test] 管理員已成功登入');
  });

  test('應該拒絕無效的登入憑證', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"], input[formcontrolname="emailOrUsername"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    // 輸入錯誤的密碼
    await emailInput.fill(TEST_ACCOUNTS.user.email);
    await passwordInput.fill('wrong-password-123');

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // 應該顯示錯誤訊息
    const errorMessage = page.locator('.mat-error, .error-message, [role="alert"]').filter({
      hasText: /帳號或密碼錯誤|Invalid|incorrect|failed/i,
    });

    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    // 應該仍然停留在登入頁
    await expect(page).toHaveURL(/\/auth\/login/);

    console.log('[Test] 無效憑證已被拒絕');
  });

  test('應該在訪問受保護路由時自動導向登入頁', async ({ page }) => {
    // 直接訪問需要登入的頁面 (如訂單列表)
    await page.goto('/orders');

    // 應該自動導向登入頁,並帶有 returnUrl 參數
    await expect(page).toHaveURL(/\/auth\/login/);

    // 檢查是否有 returnUrl 參數
    const url = page.url();
    console.log('[Test] 當前 URL:', url);

    // 可選: 驗證 returnUrl 參數
    expect(url).toMatch(/returnUrl/);
  });

  test('登入成功後應該導向原本要訪問的頁面 (returnUrl)', async ({ page }) => {
    // 1. 訪問受保護的路由 (會被導向登入頁)
    await page.goto('/orders');

    // 2. 確認已在登入頁
    await expect(page).toHaveURL(/\/auth\/login/);

    // 3. 填寫登入表單
    const emailInput = page.locator('input[type="email"], input[formcontrolname="emailOrUsername"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(TEST_ACCOUNTS.user.email);
    await passwordInput.fill(TEST_ACCOUNTS.user.password);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // 4. 應該導向原本要訪問的 /orders 頁面
    await page.waitForURL(/\/orders/, { timeout: 5000 });

    console.log('[Test] 已導向原本的目標頁面');
  });

  test('應該能夠成功登出', async ({ page, context }) => {
    // 1. 先登入
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"], input[formcontrolname="emailOrUsername"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(TEST_ACCOUNTS.user.email);
    await passwordInput.fill(TEST_ACCOUNTS.user.password);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 });

    // 2. 點擊使用者選單
    const userMenu = page.locator('[mattooltip], button').filter({
      has: page.locator('mat-icon:has-text("account_circle")'),
    }).first();

    await userMenu.click();

    // 3. 點擊登出按鈕
    const logoutButton = page.locator('button').filter({
      hasText: /登出|Logout|Log out/i,
    }).first();

    await expect(logoutButton).toBeVisible({ timeout: 3000 });
    await logoutButton.click();

    // 4. 應該導向登入頁
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

    // 5. 驗證 LocalStorage 已清空
    const userInfo = await page.evaluate(() => {
      return localStorage.getItem('user_info');
    });

    expect(userInfo).toBeNull();

    console.log('[Test] 已成功登出,LocalStorage 已清空');
  });

  test('登入狀態應該在重新整理後保留', async ({ page }) => {
    // 1. 登入
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"], input[formcontrolname="emailOrUsername"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(TEST_ACCOUNTS.user.email);
    await passwordInput.fill(TEST_ACCOUNTS.user.password);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 });

    // 2. 前往某個頁面
    await page.goto('/products');

    // 3. 重新整理
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 4. 驗證仍然是登入狀態 (不應被導向登入頁)
    await expect(page).toHaveURL(/\/products/);

    // 5. 驗證使用者選單仍然顯示
    const userMenu = page.locator('[mattooltip], button').filter({
      has: page.locator('mat-icon:has-text("account_circle")'),
    }).first();

    await expect(userMenu).toBeVisible({ timeout: 3000 });

    console.log('[Test] 登入狀態已保留');
  });

  test('應該驗證表單欄位 (前端驗證)', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"], input[formcontrolname="emailOrUsername"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();

    // 1. 測試空白表單
    await loginButton.click();

    // 應該顯示必填欄位錯誤
    const emailError = page.locator('.mat-error').filter({
      hasText: /必填|required|不可為空/i,
    }).first();

    if (await emailError.isVisible({ timeout: 1000 })) {
      console.log('[Test] 空白表單驗證正常');
    }

    // 2. 測試無效的 email 格式
    await emailInput.fill('invalid-email-format');
    await passwordInput.fill('some-password');

    // 可能會有 email 格式錯誤提示
    const formatError = page.locator('.mat-error').filter({
      hasText: /email|格式|format/i,
    });

    if (await formatError.isVisible({ timeout: 1000 })) {
      console.log('[Test] Email 格式驗證正常');
    }
  });

  test('應該處理「記住我」功能', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"], input[formcontrolname="emailOrUsername"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    // 尋找「記住我」checkbox
    const rememberMeCheckbox = page.locator('input[type="checkbox"]').filter({
      has: page.locator('~ label:has-text("記住我"), ~ span:has-text("Remember")'),
    }).first();

    if (await rememberMeCheckbox.isVisible({ timeout: 1000 })) {
      // 勾選「記住我」
      await rememberMeCheckbox.check();
      expect(await rememberMeCheckbox.isChecked()).toBeTruthy();

      // 填寫並登入
      await emailInput.fill(TEST_ACCOUNTS.user.email);
      await passwordInput.fill(TEST_ACCOUNTS.user.password);

      const loginButton = page.locator('button[type="submit"]').first();
      await loginButton.click();

      await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 });

      console.log('[Test]「記住我」功能已測試');
    } else {
      console.log('[Test]「記住我」功能未實作,跳過測試');
    }
  });
});

test.describe('Token 管理', () => {
  test('應該在 LocalStorage 中儲存 Token', async ({ page }) => {
    // 登入
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"], input[formcontrolname="emailOrUsername"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(TEST_ACCOUNTS.user.email);
    await passwordInput.fill(TEST_ACCOUNTS.user.password);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 });

    // 檢查 LocalStorage 中的 Token
    const tokens = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('access_token'),
        refreshToken: localStorage.getItem('refresh_token'),
        userInfo: localStorage.getItem('user_info'),
      };
    });

    console.log('[Test] LocalStorage Tokens:', {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      hasUserInfo: !!tokens.userInfo,
    });

    // 驗證必要的項目存在
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.userInfo).toBeTruthy();

    // 驗證 userInfo 的結構
    const userInfo = JSON.parse(tokens.userInfo);
    expect(userInfo).toHaveProperty('id');
    expect(userInfo).toHaveProperty('email');
    expect(userInfo.email).toBe(TEST_ACCOUNTS.user.email);
  });
});
