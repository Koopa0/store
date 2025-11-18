/**
 * 認證守衛
 * Authentication Guard
 *
 * 保護需要登入才能訪問的路由
 * Protects routes that require authentication
 *
 * 教學重點 / Teaching Points:
 * 1. 函數式路由守衛 (Functional Route Guard)
 * 2. 使用 inject() 注入服務
 * 3. 未登入自動導向登入頁
 * 4. 保存原始 URL 以便登入後返回
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@core/services';

/**
 * 認證守衛函數
 * Authentication guard function
 *
 * @param route 啟動的路由快照
 * @param state 路由狀態
 * @returns 是否允許訪問
 *
 * 教學說明：
 * Angular v15+ 推薦使用函數式守衛取代類別式守衛
 * 優點：
 * 1. 更簡潔的語法
 * 2. 更好的 tree-shaking
 * 3. 更容易組合和測試
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  /**
   * 注入服務
   * Inject services
   */
  const authService = inject(AuthService);
  const router = inject(Router);

  /**
   * 檢查是否已登入
   * Check if authenticated
   */
  if (authService.isAuthenticated()) {
    console.log('[AuthGuard] User is authenticated, allowing access');
    return true;
  }

  /**
   * 未登入，導向登入頁
   * Not authenticated, redirect to login
   *
   * 教學說明：
   * 保存當前 URL (returnUrl)，登入成功後可以返回
   */
  console.log('[AuthGuard] User is not authenticated, redirecting to login');

  // 導向登入頁，並附帶 returnUrl 參數
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });

  return false;
};
