/**
 * 角色守衛
 * Role Guard
 *
 * 根據用戶角色保護路由
 * Protects routes based on user roles
 *
 * 教學重點 / Teaching Points:
 * 1. 使用 route.data 傳遞所需角色
 * 2. 角色權限檢查
 * 3. 權限不足時的處理
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@core/services';
import { UserRole } from '@core/models/user.model';

/**
 * 角色守衛函數
 * Role guard function
 *
 * @param route 啟動的路由快照
 * @param state 路由狀態
 * @returns 是否允許訪問
 *
 * 教學說明：
 * 在路由配置中使用 data: { roles: ['ADMIN'] } 指定所需角色
 * 例如：
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['ADMIN'] }
 * }
 * ```
 */
export const roleGuard: CanActivateFn = (
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
   *
   * 教學說明：
   * 角色守衛通常與認證守衛一起使用
   * 但為了安全起見，這裡也檢查登入狀態
   */
  if (!authService.isAuthenticated()) {
    console.log('[RoleGuard] User is not authenticated, redirecting to login');
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  /**
   * 從路由配置中取得所需角色
   * Get required roles from route data
   */
  const requiredRoles = route.data['roles'] as UserRole[] | undefined;

  /**
   * 如果沒有指定所需角色，允許訪問
   * If no roles specified, allow access
   */
  if (!requiredRoles || requiredRoles.length === 0) {
    console.log('[RoleGuard] No roles required, allowing access');
    return true;
  }

  /**
   * 檢查用戶是否有任一所需角色
   * Check if user has any of the required roles
   */
  if (authService.hasAnyRole(requiredRoles)) {
    console.log('[RoleGuard] User has required role, allowing access');
    return true;
  }

  /**
   * 用戶沒有所需角色，導向無權限頁面
   * User doesn't have required role, redirect to forbidden page
   */
  console.log('[RoleGuard] User does not have required role, redirecting to forbidden');

  // 可以導向專門的 403 頁面
  // router.navigate(['/403']);

  // 或導向首頁
  router.navigate(['/']);

  return false;
};
