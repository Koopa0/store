/**
 * 頂部導航元件
 * Header Component
 *
 * 應用程式的頂部導航列
 * Application's top navigation bar
 *
 * 教學重點 / Teaching Points:
 * 1. Material Toolbar 的使用
 * 2. 響應式導航設計
 * 3. 整合認證狀態
 * 4. 語言和主題切換
 * 5. 用戶選單
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// ngx-translate
import { TranslateModule } from '@ngx-translate/core';

// 服務
import {
  AuthService,
  ThemeService,
  TranslationService,
  NotificationService,
  LoggerService,
} from '@core/services';

// 組件
import { NotificationCenterComponent } from '@core/components';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    NotificationCenterComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  /**
   * 注入服務
   * Inject services
   */
  protected readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly translationService = inject(TranslationService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  /**
   * 當前用戶
   * Current user
   */
  currentUser = this.authService.currentUser;

  /**
   * 是否已登入
   * Is authenticated
   */
  isAuthenticated = this.authService.isAuthenticated;

  /**
   * 是否為管理員
   * Is admin
   */
  isAdmin = this.authService.isAdmin;

  /**
   * 當前主題
   * Current theme
   */
  currentTheme = this.themeService.actualTheme;

  /**
   * 當前語言
   * Current language
   */
  currentLanguage = this.translationService.currentLanguage;

  /**
   * 是否顯示手機選單
   * Show mobile menu
   */
  showMobileMenu = signal(false);

  /**
   * 導航項目
   * Navigation items
   *
   * 教學說明：
   * 定義導航選單項目
   * 可根據用戶角色動態顯示
   */
  navItems = [
    {
      label: 'nav.products',
      path: '/products',
      icon: 'shopping_bag',
      requireAuth: true,
    },
    {
      label: 'nav.categories',
      path: '/categories',
      icon: 'category',
      requireAuth: false,
    },
    {
      label: 'nav.cart',
      path: '/cart',
      icon: 'shopping_cart',
      badge: 3, // 示範徽章
      requireAuth: true,
    },
    {
      label: 'nav.orders',
      path: '/orders',
      icon: 'receipt_long',
      requireAuth: true,
    },
  ];

  /**
   * 切換手機選單
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.showMobileMenu.update((show) => !show);
  }

  /**
   * 切換主題
   * Toggle theme
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
   * 切換語言
   * Toggle language
   */
  toggleLanguage(): void {
    this.translationService.toggleLanguage();
    const newLang = this.translationService.currentLanguage();
    this.notificationService.info(
      newLang === 'zh-TW' ? '已切換至繁體中文' : 'Switched to English',
      { duration: 2000, translate: false }
    );
  }

  /**
   * 登出
   * Logout
   */
  async logout(): Promise<void> {
    try {
      const confirmed = await this.notificationService.confirm(
        'auth.logout.confirm',
        'common.confirm'
      );

      if (confirmed) {
        this.authService.logout();
        this.notificationService.success('auth.logout.success');
      }
    } catch (error) {
      this.logger.error('[Header] Logout error:', error);
      this.notificationService.error('common.error');
    }
  }

  /**
   * 導航到個人資料
   * Navigate to profile
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * 導航到設定
   * Navigate to settings
   */
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * 導航到管理後台
   * Navigate to admin
   */
  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  /**
   * 檢查導航項目是否應該顯示
   * Check if nav item should be shown
   */
  shouldShowNavItem(item: any): boolean {
    if (item.requireAuth) {
      return this.isAuthenticated();
    }
    return true;
  }
}
