/**
 * 管理後台 Layout 組件
 * Admin Layout Component
 *
 * 提供管理後台的基礎佈局結構
 * Provides the basic layout structure for the admin panel
 */

import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

// Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationService);

  /**
   * 側邊欄是否打開
   */
  readonly sidenavOpened = signal(true);

  /**
   * 當前用戶
   */
  readonly currentUser = this.authService.currentUser;

  /**
   * 當前主題
   */
  readonly currentTheme = this.themeService.actualTheme;

  /**
   * 管理後台導航項目
   */
  readonly navItems = [
    {
      label: '儀表板',
      icon: 'dashboard',
      route: '/admin/dashboard',
      badge: null,
    },
    {
      label: '商品管理',
      icon: 'inventory_2',
      route: '/admin/products',
      badge: null,
    },
    {
      label: '訂單管理',
      icon: 'shopping_cart',
      route: '/admin/orders',
      badge: 5, // 待處理訂單數
    },
    {
      label: '用戶管理',
      icon: 'people',
      route: '/admin/users',
      badge: null,
    },
    {
      label: '評論管理',
      icon: 'rate_review',
      route: '/admin/reviews',
      badge: 2, // 待審核評論數
    },
    {
      label: '優惠券管理',
      icon: 'local_offer',
      route: '/admin/coupons',
      badge: null,
    },
    {
      label: '庫存管理',
      icon: 'inventory',
      route: '/admin/inventory',
      badge: null,
    },
    {
      label: '系統設定',
      icon: 'settings',
      route: '/admin/settings',
      badge: null,
    },
  ];

  /**
   * 切換側邊欄
   */
  toggleSidenav(): void {
    this.sidenavOpened.update(opened => !opened);
  }

  /**
   * 切換主題
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
    const newTheme = this.themeService.actualTheme();
    this.notificationService.info(
      newTheme === 'dark' ? '已切換至暗色模式' : '已切換至亮色模式',
      { duration: 2000, translate: false }
    );
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    const confirmed = await this.notificationService.confirm(
      '確定要登出嗎？',
      '確認登出'
    );

    if (confirmed) {
      this.authService.logout();
      this.notificationService.success('已成功登出');
    }
  }

  /**
   * 返回前台
   */
  goToFrontend(): void {
    this.router.navigate(['/home']);
  }
}
