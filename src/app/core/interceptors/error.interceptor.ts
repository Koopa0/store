/**
 * 錯誤攔截器
 * Error Interceptor
 *
 * 全域處理 HTTP 錯誤
 * Globally handles HTTP errors
 *
 * 教學重點 / Teaching Points:
 * 1. HTTP 錯誤處理最佳實踐
 * 2. RxJS 錯誤處理操作符
 * 3. 錯誤分類和處理策略
 * 4. 使用者友善的錯誤訊息
 * 5. 錯誤記錄和監控
 */

import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, Observable } from 'rxjs';
import { StorageService } from '@core/services';
import { STORAGE_KEYS } from '@core/constants/app.constants';

/**
 * 錯誤回應介面
 * Error response interface
 *
 * 教學說明：定義後端 API 的錯誤回應格式
 */
interface ApiErrorResponse {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
}

/**
 * 錯誤攔截器函數
 * Error interceptor function
 *
 * @param req HTTP 請求
 * @param next 下一個處理器
 * @returns Observable<HttpEvent<unknown>>
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  /**
   * 注入服務
   * Inject services
   */
  const router = inject(Router);
  const storageService = inject(StorageService);

  /**
   * 處理請求並捕獲錯誤
   * Handle request and catch errors
   *
   * 教學說明：
   * - catchError 是 RxJS 操作符，用於捕獲 Observable 中的錯誤
   * - 必須返回一個 Observable（通常使用 throwError）
   */
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      /**
       * 處理錯誤
       * Handle error
       */
      handleError(error, router, storageService, req);

      /**
       * 重新拋出錯誤
       * Re-throw error
       *
       * 教學說明：
       * 讓呼叫者也能處理錯誤（例如顯示特定的錯誤訊息）
       */
      return throwError(() => error);
    })
  );
};

/**
 * 處理 HTTP 錯誤
 * Handle HTTP error
 *
 * @param error HTTP 錯誤回應
 * @param router 路由器
 * @param storageService 儲存服務
 * @param req 原始請求
 *
 * 教學說明：根據不同的錯誤狀態碼執行不同的處理邏輯
 */
function handleError(
  error: HttpErrorResponse,
  router: Router,
  storageService: StorageService,
  req: HttpRequest<unknown>
): void {
  console.error('[ErrorInterceptor] HTTP Error:', {
    url: req.url,
    method: req.method,
    status: error.status,
    message: error.message,
  });

  /**
   * 根據 HTTP 狀態碼處理
   * Handle by HTTP status code
   */
  switch (error.status) {
    case 0:
      /**
       * 網路錯誤（無法連接到伺服器）
       * Network error (cannot connect to server)
       */
      handleNetworkError(error);
      break;

    case 400:
      /**
       * 錯誤的請求（Bad Request）
       * Bad request
       */
      handleBadRequest(error);
      break;

    case 401:
      /**
       * 未授權（Unauthorized）
       * Unauthorized
       */
      handleUnauthorized(error, router, storageService);
      break;

    case 403:
      /**
       * 禁止訪問（Forbidden）
       * Forbidden
       */
      handleForbidden(error, router);
      break;

    case 404:
      /**
       * 找不到資源（Not Found）
       * Not found
       */
      handleNotFound(error);
      break;

    case 422:
      /**
       * 驗證錯誤（Unprocessable Entity）
       * Validation error
       */
      handleValidationError(error);
      break;

    case 429:
      /**
       * 請求過於頻繁（Too Many Requests）
       * Too many requests
       */
      handleTooManyRequests(error);
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      /**
       * 伺服器錯誤（Server Error）
       * Server error
       */
      handleServerError(error);
      break;

    default:
      /**
       * 其他錯誤
       * Other errors
       */
      handleUnknownError(error);
      break;
  }
}

/**
 * 處理網路錯誤
 * Handle network error
 */
function handleNetworkError(error: HttpErrorResponse): void {
  console.error('[ErrorInterceptor] Network error - cannot connect to server');

  // TODO: 顯示使用者友善的錯誤訊息
  // 例如：「無法連接到伺服器，請檢查您的網路連線」
}

/**
 * 處理錯誤請求
 * Handle bad request
 */
function handleBadRequest(error: HttpErrorResponse): void {
  console.error('[ErrorInterceptor] Bad request:', error.error);

  const apiError = error.error as ApiErrorResponse;
  const message = apiError?.message || '請求參數錯誤';

  // TODO: 顯示錯誤訊息
  console.log('[ErrorInterceptor] Message:', message);
}

/**
 * 處理未授權錯誤
 * Handle unauthorized error
 *
 * 教學說明：
 * 當收到 401 錯誤時，通常表示 Token 過期或無效
 * 應該：
 * 1. 清除本地的認證資料
 * 2. 導向登入頁面
 * 3. 保存當前頁面路徑（登入後返回）
 */
function handleUnauthorized(
  error: HttpErrorResponse,
  router: Router,
  storageService: StorageService
): void {
  console.error('[ErrorInterceptor] Unauthorized - clearing auth data');

  // 清除認證資料
  storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
  storageService.remove(STORAGE_KEYS.USER_INFO);

  // 保存當前頁面路徑
  const currentUrl = router.url;
  storageService.set(STORAGE_KEYS.REDIRECT_URL, currentUrl);

  // 導向登入頁面
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: currentUrl },
  });
}

/**
 * 處理禁止訪問錯誤
 * Handle forbidden error
 *
 * 教學說明：
 * 403 表示已登入但沒有權限訪問該資源
 */
function handleForbidden(error: HttpErrorResponse, router: Router): void {
  console.error('[ErrorInterceptor] Forbidden - no permission');

  // TODO: 顯示「您沒有權限訪問此資源」訊息

  // 可以導向到權限不足頁面
  // router.navigate(['/403']);
}

/**
 * 處理找不到資源錯誤
 * Handle not found error
 */
function handleNotFound(error: HttpErrorResponse): void {
  console.error('[ErrorInterceptor] Resource not found');

  const apiError = error.error as ApiErrorResponse;
  const message = apiError?.message || '找不到請求的資源';

  // TODO: 顯示錯誤訊息
  console.log('[ErrorInterceptor] Message:', message);
}

/**
 * 處理驗證錯誤
 * Handle validation error
 *
 * 教學說明：
 * 422 通常用於表單驗證錯誤
 * 後端會返回詳細的欄位錯誤訊息
 */
function handleValidationError(error: HttpErrorResponse): void {
  console.error('[ErrorInterceptor] Validation error');

  const apiError = error.error as ApiErrorResponse;

  if (apiError?.errors) {
    // 處理欄位級別的錯誤
    Object.entries(apiError.errors).forEach(([field, messages]) => {
      console.log(`[ErrorInterceptor] Field '${field}':`, messages);
      // TODO: 在表單中顯示對應欄位的錯誤訊息
    });
  } else {
    const message = apiError?.message || '資料驗證失敗';
    // TODO: 顯示一般錯誤訊息
    console.log('[ErrorInterceptor] Message:', message);
  }
}

/**
 * 處理請求過於頻繁錯誤
 * Handle too many requests error
 *
 * 教學說明：
 * 429 表示請求頻率超過限制（Rate Limiting）
 */
function handleTooManyRequests(error: HttpErrorResponse): void {
  console.error('[ErrorInterceptor] Too many requests - rate limit exceeded');

  // 從 Header 中取得重試時間
  const retryAfter = error.headers.get('Retry-After');
  const message = retryAfter
    ? `請求過於頻繁，請在 ${retryAfter} 秒後重試`
    : '請求過於頻繁，請稍後再試';

  // TODO: 顯示錯誤訊息
  console.log('[ErrorInterceptor] Message:', message);
}

/**
 * 處理伺服器錯誤
 * Handle server error
 *
 * 教學說明：
 * 5xx 錯誤表示伺服器端出現問題
 */
function handleServerError(error: HttpErrorResponse): void {
  console.error('[ErrorInterceptor] Server error:', error.status);

  const messages: Record<number, string> = {
    500: '伺服器內部錯誤',
    502: '閘道錯誤',
    503: '服務暫時無法使用',
    504: '閘道逾時',
  };

  const message = messages[error.status] || '伺服器錯誤';

  // TODO: 顯示錯誤訊息
  console.log('[ErrorInterceptor] Message:', message);

  // 可以記錄到錯誤監控系統（例如 Sentry）
  // logErrorToMonitoring(error);
}

/**
 * 處理未知錯誤
 * Handle unknown error
 */
function handleUnknownError(error: HttpErrorResponse): void {
  console.error('[ErrorInterceptor] Unknown error:', error);

  // TODO: 顯示一般錯誤訊息
  console.log('[ErrorInterceptor] Message: 發生未知錯誤，請稍後再試');
}

/**
 * 取得使用者友善的錯誤訊息
 * Get user-friendly error message
 *
 * @param error HTTP 錯誤回應
 * @returns 使用者友善的錯誤訊息
 *
 * 教學說明：
 * 將技術性的錯誤訊息轉換為使用者容易理解的描述
 */
export function getUserFriendlyErrorMessage(error: HttpErrorResponse): string {
  // 如果後端提供了訊息，優先使用
  const apiError = error.error as ApiErrorResponse;
  if (apiError?.message) {
    return apiError.message;
  }

  // 根據狀態碼返回預設訊息
  const defaultMessages: Record<number, string> = {
    0: '無法連接到伺服器，請檢查您的網路連線',
    400: '請求參數錯誤',
    401: '請先登入',
    403: '您沒有權限執行此操作',
    404: '找不到請求的資源',
    422: '資料驗證失敗',
    429: '請求過於頻繁，請稍後再試',
    500: '伺服器發生錯誤',
    502: '閘道錯誤',
    503: '服務暫時無法使用',
    504: '請求逾時',
  };

  return defaultMessages[error.status] || '發生錯誤，請稍後再試';
}
