/**
 * 載入攔截器
 * Loading Interceptor
 *
 * 追蹤 HTTP 請求的載入狀態
 * Tracks loading state of HTTP requests
 *
 * 教學重點 / Teaching Points:
 * 1. 使用 Signal 追蹤載入狀態
 * 2. RxJS finalize 操作符的使用
 * 3. 計數器模式管理多個請求
 * 4. 跳過特定請求的載入指示器
 * 5. 防抖動（Debounce）避免閃爍
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, delay } from 'rxjs';
import { LoadingService } from '@core/services/loading.service';

/**
 * 載入攔截器函數
 * Loading interceptor function
 *
 * @param req HTTP 請求
 * @param next 下一個處理器
 * @returns Observable<HttpEvent<unknown>>
 *
 * 教學說明：
 * 此攔截器會在請求開始時顯示載入指示器，
 * 在請求完成（成功或失敗）後隱藏載入指示器
 */
export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  /**
   * 注入載入服務
   * Inject loading service
   */
  const loadingService = inject(LoadingService);

  /**
   * 檢查是否應該顯示載入指示器
   * Check if loading indicator should be shown
   *
   * 教學說明：
   * 某些請求可能不需要顯示全域載入指示器
   * 例如：背景輪詢、自動儲存等
   */
  if (shouldSkipLoading(req)) {
    return next(req);
  }

  /**
   * 開始載入
   * Start loading
   */
  loadingService.show();

  console.log('[LoadingInterceptor] Request started:', {
    url: req.url,
    method: req.method,
  });

  /**
   * 處理請求並在完成後隱藏載入指示器
   * Handle request and hide loading indicator when complete
   *
   * 教學說明：
   * - finalize() 操作符會在 Observable 完成時執行
   * - 無論請求成功或失敗都會執行
   * - 確保載入指示器一定會被隱藏
   */
  return next(req).pipe(
    finalize(() => {
      /**
       * 請求完成，隱藏載入指示器
       * Request complete, hide loading indicator
       */
      loadingService.hide();

      console.log('[LoadingInterceptor] Request completed:', {
        url: req.url,
        method: req.method,
      });
    })
  );
};

/**
 * 檢查是否應該跳過載入指示器
 * Check if loading indicator should be skipped
 *
 * @param req HTTP 請求
 * @returns 是否跳過
 *
 * 教學說明：
 * 通過自定義 Header 或 URL 模式決定是否跳過
 */
function shouldSkipLoading(req: HttpRequest<unknown>): boolean {
  /**
   * 檢查自定義 Header
   * Check custom header
   *
   * 教學說明：
   * 呼叫者可以添加 'X-Skip-Loading: true' header 來跳過載入指示器
   */
  if (req.headers.has('X-Skip-Loading')) {
    return true;
  }

  /**
   * 跳過的 URL 模式
   * URL patterns to skip
   *
   * 教學說明：某些端點不應該顯示全域載入指示器
   */
  const skipPatterns = [
    '/polling/',        // 輪詢請求
    '/heartbeat',       // 心跳檢測
    '/analytics/',      // 分析追蹤
    '/auto-save',       // 自動儲存
  ];

  /**
   * 檢查 URL 是否匹配跳過模式
   * Check if URL matches skip pattern
   */
  return skipPatterns.some((pattern) => req.url.includes(pattern));
}
