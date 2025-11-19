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
   * 商品路由
   * Product routes
   *
   * 教學說明：懶載入商品相關元件
   */
  {
    path: 'products',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/product/pages/product-list/product-list.component').then(
            (m) => m.ProductListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/product/pages/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent
          ),
      },
    ],
  },

  /**
   * 購物車路由
   * Cart route
   *
   * 教學說明：購物車頁面
   */
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cart/pages/cart/cart.component').then(
        (m) => m.CartComponent
      ),
  },

  /**
   * 結帳路由
   * Checkout route
   *
   * 教學說明：結帳頁面
   */
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/pages/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },

  /**
   * 訂單路由
   * Order routes
   *
   * 教學說明：訂單相關頁面
   */
  {
    path: 'orders',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/order/pages/order-list/order-list.component').then(
            (m) => m.OrderListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/order/pages/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent
          ),
      },
    ],
  },

  /**
   * 訂單確認路由
   * Order confirmation route
   *
   * 教學說明：訂單確認頁面（完成結帳後顯示）
   */
  {
    path: 'order-confirmation/:orderNumber',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/order/pages/order-confirmation/order-confirmation.component').then(
        (m) => m.OrderConfirmationComponent
      ),
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
