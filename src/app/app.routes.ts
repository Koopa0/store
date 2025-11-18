/**
 * 應用程式路由配置
 * Application Routes Configuration
 *
 * 教學重點 / Teaching Points:
 * 1. 路由守衛的使用
 * 2. 懶載入模組
 * 3. 路由參數和查詢參數
 * 4. 重定向路由
 */

import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '@core/guards';

export const routes: Routes = [
  /**
   * 首頁路由
   * Home route
   */
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },

  /**
   * 認證路由（登入、註冊等）
   * Authentication routes (login, register, etc.)
   *
   * 教學說明：懶載入模組
   */
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      // 可以加入其他認證相關路由
      // {
      //   path: 'register',
      //   loadComponent: () => import('./features/auth/register/register.component'),
      // },
    ],
  },

  /**
   * 首頁路由（需要登入）
   * Home route (requires authentication)
   *
   * 教學說明：暫時使用 App 元件作為主頁面
   * 實際應用中應該建立專門的 HomePage 元件
   */
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./app').then((m) => m.App),
  },

  /**
   * 管理後台路由（需要管理員權限）
   * Admin routes (requires ADMIN role)
   */
  // {
  //   path: 'admin',
  //   canActivate: [authGuard, roleGuard],
  //   data: { roles: ['ADMIN'] },
  //   loadChildren: () => import('./features/admin/admin.routes'),
  // },

  /**
   * 404 頁面
   * 404 page
   */
  {
    path: '**',
    redirectTo: '/auth/login',
  },
];
