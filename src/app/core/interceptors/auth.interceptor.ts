/**
 * 認證攔截器
 * Authentication Interceptor
 *
 * 自動為 HTTP 請求添加 Authorization Token
 * Automatically adds Authorization token to HTTP requests
 *
 * 教學重點 / Teaching Points:
 * 1. HTTP Interceptor 基礎
 * 2. 使用 inject() 函數注入服務
 * 3. 條件性添加 Header
 * 4. Token 管理最佳實踐
 * 5. 跳過特定請求的攔截
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '@core/services';
import { STORAGE_KEYS } from '@core/constants/app.constants';
import { environment } from '@environments/environment';

/**
 * 認證攔截器函數
 * Authentication interceptor function
 *
 * 教學說明：
 * Angular v15+ 使用函數式攔截器取代類別式攔截器
 * 優點：
 * 1. 更簡潔的語法
 * 2. 更好的 tree-shaking
 * 3. 更容易組合和測試
 *
 * @param req HTTP 請求
 * @param next 下一個處理器
 * @returns Observable<HttpEvent<unknown>>
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  /**
   * 注入儲存服務
   * Inject storage service
   *
   * 教學說明：使用 inject() 在函數中注入依賴
   */
  const storageService = inject(StorageService);

  /**
   * 檢查是否需要添加 Token
   * Check if token should be added
   *
   * 教學說明：以下情況不需要添加 Token：
   * 1. 請求不是發往我們的 API
   * 2. 請求已經有 Authorization header
   * 3. 請求 URL 包含在跳過清單中
   */
  if (!shouldAddToken(req)) {
    return next(req);
  }

  /**
   * 從儲存中取得 Token
   * Get token from storage
   */
  const token = storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);

  /**
   * 如果沒有 Token，直接繼續
   * If no token, proceed without modification
   */
  if (!token) {
    return next(req);
  }

  /**
   * 複製請求並添加 Authorization Header
   * Clone request and add Authorization header
   *
   * 教學說明：
   * - HttpRequest 是不可變的（immutable）
   * - 必須使用 clone() 方法建立新的請求
   * - setHeaders 會合併現有的 headers
   */
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('[AuthInterceptor] Added token to request:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
  });

  /**
   * 繼續處理修改後的請求
   * Proceed with modified request
   */
  return next(authReq);
};

/**
 * 檢查是否應該添加 Token
 * Check if token should be added
 *
 * @param req HTTP 請求
 * @returns 是否應該添加 Token
 *
 * 教學說明：實作業務邏輯決定哪些請求需要 Token
 */
function shouldAddToken(req: HttpRequest<unknown>): boolean {
  /**
   * 跳過的 URL 模式
   * URL patterns to skip
   *
   * 教學說明：這些端點通常不需要 Token
   */
  const skipUrls = [
    '/auth/login',      // 登入端點
    '/auth/register',   // 註冊端點
    '/auth/refresh',    // 刷新 Token 端點
    '/public/',         // 公開資源
  ];

  /**
   * 檢查請求是否發往我們的 API
   * Check if request is to our API
   */
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  if (!isApiRequest) {
    return false;
  }

  /**
   * 檢查是否已經有 Authorization header
   * Check if already has Authorization header
   */
  if (req.headers.has('Authorization')) {
    return false;
  }

  /**
   * 檢查是否在跳過清單中
   * Check if in skip list
   */
  const shouldSkip = skipUrls.some((url) => req.url.includes(url));
  if (shouldSkip) {
    return false;
  }

  /**
   * 其他情況都添加 Token
   * Add token in all other cases
   */
  return true;
}
