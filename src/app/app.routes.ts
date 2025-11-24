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
import { UserRole } from '@core/models/user.model';

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
   * 首頁路由（公開訪問）
   * Home route (public access)
   *
   * 教學說明：電商首頁應該公開，不需要登入
   */
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },

  /**
   * 商品路由（公開訪問）
   * Product routes (public access)
   *
   * 教學說明：商品瀏覽應該公開，讓訪客可以瀏覽商品
   * 只有加入購物車等操作才需要登入
   */
  {
    path: 'products',
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
   * 分類路由（公開訪問）
   * Categories route (public access)
   */
  {
    path: 'categories',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/product/pages/product-list/product-list.component').then(
            (m) => m.ProductListComponent
          ),
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./features/product/pages/product-list/product-list.component').then(
            (m) => m.ProductListComponent
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
   * 個人資料路由
   * Profile routes
   */
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user/pages/address-management/address-management.component').then(
        (m) => m.AddressManagementComponent
      ),
  },

  /**
   * 設定路由
   * Settings route
   */
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user/pages/address-management/address-management.component').then(
        (m) => m.AddressManagementComponent
      ),
  },

  /**
   * 管理後台路由
   * Admin routes
   */
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/pages/product-management/product-management.component').then(
            (m) => m.ProductManagementComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/pages/order-management/order-management.component').then(
            (m) => m.OrderManagementComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/pages/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
    ],
  },

  /**
   * 404 頁面
   * 404 page
   *
   * 教學說明：找不到頁面時導向首頁，而不是登入頁
   */
  {
    path: '**',
    redirectTo: '/home',
  },
];
