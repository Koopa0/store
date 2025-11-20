/**
 * E2E 測試輔助工具
 * E2E Test Helpers
 *
 * 提供常用的測試工具函數,減少重複程式碼
 */

import { Page, expect } from '@playwright/test';

/**
 * 測試帳號
 */
export const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@koopa.com',
    password: 'admin123',
    role: 'ADMIN',
    name: '系統管理員',
  },
  user: {
    email: 'user@koopa.com',
    password: 'user123',
    role: 'CUSTOMER',
    name: '一般用戶',
  },
  test: {
    email: 'test@koopa.com',
    password: 'test123',
    role: 'CUSTOMER',
    name: '測試用戶',
  },
} as const;

/**
 * 登入輔助函數
 *
 * @param page Playwright Page 物件
 * @param account 測試帳號 (admin, user, 或 test)
 */
export async function login(page: Page, account: keyof typeof TEST_ACCOUNTS = 'user') {
  const credentials = TEST_ACCOUNTS[account];

  // 前往登入頁
  await page.goto('/auth/login');

  // 填寫表單
  const emailInput = page.locator('input[type="email"], input[formcontrolname="emailOrUsername"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);

  // 點擊登入
  const loginButton = page.locator('button[type="submit"]').first();
  await loginButton.click();

  // 等待登入成功 (離開登入頁)
  await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 });

  console.log(`[Helper] 已登入: ${credentials.name}`);
}

/**
 * 登出輔助函數
 *
 * @param page Playwright Page 物件
 */
export async function logout(page: Page) {
  // 點擊使用者選單
  const userMenu = page.locator('button').filter({
    has: page.locator('mat-icon:has-text("account_circle")'),
  }).first();

  await userMenu.click();

  // 點擊登出
  const logoutButton = page.locator('button').filter({
    hasText: /登出|Logout/i,
  }).first();

  await logoutButton.click();

  // 等待導向登入頁
  await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

  console.log('[Helper] 已登出');
}

/**
 * 清除所有儲存資料 (LocalStorage, SessionStorage, Cookies)
 *
 * @param page Playwright Page 物件
 */
export async function clearAllStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.context().clearCookies();

  console.log('[Helper] 已清除所有儲存資料');
}

/**
 * 加入商品到購物車
 *
 * @param page Playwright Page 物件
 * @param productIndex 商品索引 (從 0 開始),預設第一個商品
 */
export async function addProductToCart(page: Page, productIndex: number = 0) {
  // 前往商品列表
  await page.goto('/products');
  await page.waitForLoadState('networkidle');

  // 點擊指定的商品
  const productCards = page.locator('mat-card, .product-card');
  await productCards.nth(productIndex).click();

  // 等待商品詳情頁載入
  await page.waitForURL(/\/products\/.+/);

  // 點擊「加入購物車」
  const addToCartButton = page.locator('button').filter({
    hasText: /加入購物車|Add to Cart/i,
  }).first();

  await addToCartButton.click();

  // 等待成功訊息
  await page.waitForTimeout(1000);

  console.log(`[Helper] 已加入商品 #${productIndex} 到購物車`);
}

/**
 * 等待 API 請求完成
 *
 * @param page Playwright Page 物件
 * @param urlPattern API URL 的 pattern
 * @param method HTTP 方法,預設 GET
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  method: string = 'GET'
) {
  const response = await page.waitForResponse(
    (response) =>
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) &&
      response.request().method() === method,
    { timeout: 10000 }
  );

  console.log(`[Helper] API 回應: ${response.url()} - ${response.status()}`);

  return response;
}

/**
 * 截圖輔助函數 (用於偵錯)
 *
 * @param page Playwright Page 物件
 * @param name 截圖名稱
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });

  console.log(`[Helper] 已截圖: ${name}`);
}

/**
 * 等待元素並驗證可見
 *
 * @param page Playwright Page 物件
 * @param selector 選擇器
 * @param timeout 超時時間 (ms)
 */
export async function waitAndExpectVisible(
  page: Page,
  selector: string,
  timeout: number = 5000
) {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible({ timeout });
  return element;
}

/**
 * 取得購物車數量
 *
 * @param page Playwright Page 物件
 * @returns 購物車項目數量
 */
export async function getCartCount(page: Page): Promise<number> {
  const cartBadge = page.locator('.mat-badge-content, .cart-badge, [matbadge]').first();

  const isVisible = await cartBadge.isVisible({ timeout: 1000 }).catch(() => false);

  if (!isVisible) {
    return 0;
  }

  const text = await cartBadge.textContent();

  return text ? parseInt(text, 10) : 0;
}

/**
 * 填寫結帳表單
 *
 * @param page Playwright Page 物件
 * @param data 表單資料
 */
export async function fillCheckoutForm(
  page: Page,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    paymentMethod?: 'credit' | 'paypal' | 'cod';
  } = {}
) {
  const defaults = {
    name: '測試用戶',
    phone: '0912345678',
    address: '台北市信義區信義路五段7號',
    paymentMethod: 'credit' as const,
  };

  const formData = { ...defaults, ...data };

  // 填寫收件人資訊
  const nameInput = page.locator('input').filter({
    has: page.locator('~ label:has-text("姓名"), ~ span:has-text("Name")'),
  }).first();

  if (await nameInput.isVisible({ timeout: 1000 })) {
    await nameInput.fill(formData.name);
  }

  const phoneInput = page.locator('input').filter({
    has: page.locator('~ label:has-text("電話"), ~ span:has-text("Phone")'),
  }).first();

  if (await phoneInput.isVisible({ timeout: 1000 })) {
    await phoneInput.fill(formData.phone);
  }

  const addressInput = page.locator('input, textarea').filter({
    has: page.locator('~ label:has-text("地址"), ~ span:has-text("Address")'),
  }).first();

  if (await addressInput.isVisible({ timeout: 1000 })) {
    await addressInput.fill(formData.address);
  }

  // 選擇付款方式
  const paymentMethodRadio = page.locator('input[type="radio"]').filter({
    has: page.locator(`~ label:has-text("${formData.paymentMethod}")`),
  }).first();

  if (await paymentMethodRadio.isVisible({ timeout: 1000 })) {
    await paymentMethodRadio.check();
  }

  console.log('[Helper] 已填寫結帳表單');
}

/**
 * 從文字中提取數字
 *
 * @param text 包含數字的文字
 * @returns 數字
 */
export function extractNumber(text: string | null): number {
  if (!text) return 0;

  const match = text.match(/[\d,]+(\.\d+)?/);

  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
}

/**
 * 模擬延遲 (用於觀察測試過程)
 *
 * @param ms 延遲時間 (毫秒)
 */
export async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 驗證通知訊息出現
 *
 * @param page Playwright Page 物件
 * @param message 預期的訊息文字 (可使用正則表達式)
 * @param type 訊息類型 (success, error, warning, info)
 */
export async function expectNotification(
  page: Page,
  message: string | RegExp,
  type?: 'success' | 'error' | 'warning' | 'info'
) {
  const snackbar = page.locator('.mat-mdc-snack-bar-container, [role="alert"]');

  await expect(snackbar).toBeVisible({ timeout: 3000 });

  if (typeof message === 'string') {
    await expect(snackbar).toContainText(message);
  } else {
    const text = await snackbar.textContent();
    expect(text).toMatch(message);
  }

  console.log(`[Helper] 通知訊息已驗證: ${message}`);
}

/**
 * 驗證 URL 參數
 *
 * @param page Playwright Page 物件
 * @param params 預期的 URL 參數
 */
export async function expectUrlParams(
  page: Page,
  params: Record<string, string>
) {
  const url = new URL(page.url());

  for (const [key, value] of Object.entries(params)) {
    const actualValue = url.searchParams.get(key);
    expect(actualValue).toBe(value);
  }

  console.log('[Helper] URL 參數已驗證');
}
