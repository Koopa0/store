/**
 * 權限指令
 * Permission Directive
 *
 * 根據使用者權限控制元素的顯示與隱藏
 * Controls element visibility based on user permissions
 *
 * 教學重點 / Teaching Points:
 * 1. Structural Directive 的建立
 * 2. TemplateRef 和 ViewContainerRef 的使用
 * 3. 權限管理模式
 * 4. 依賴注入
 */

import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services';
import { UserRole } from '@core/models/user.model';

/**
 * 權限指令
 * Permission Directive
 *
 * 使用範例 / Usage Example:
 * ```html
 * <!-- 只有管理員可見 -->
 * <button *appHasRole="'ADMIN'">管理員功能</button>
 *
 * <!-- 多個角色，任一符合即可見 -->
 * <div *appHasRole="['ADMIN', 'SELLER']">賣家功能</div>
 *
 * <!-- 需要所有角色都符合 -->
 * <div *appHasRole="['ADMIN', 'SUPER_ADMIN']" [requireAll]="true">
 *   超級管理員功能
 * </div>
 * ```
 *
 * 教學說明：
 * - 這是結構型指令（Structural Directive）
 * - 使用 * 語法糖
 * - 可以完全移除或插入 DOM 元素
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit, OnDestroy {
  /**
   * 注入服務
   * Inject services
   */
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);

  /**
   * 需要的角色
   * Required roles
   *
   * 教學說明：
   * 可以是單一角色字串或角色陣列
   */
  @Input() appHasRole: UserRole | UserRole[] = [];

  /**
   * 是否需要所有角色都符合
   * Require all roles to match
   *
   * 教學說明：
   * - true: 需要擁有所有指定角色（AND 邏輯）
   * - false: 擁有任一角色即可（OR 邏輯）
   */
  @Input() requireAll: boolean = false;

  /**
   * 當前是否已顯示
   * Currently showing
   */
  private isShowing = false;

  /**
   * 訂閱
   * Subscription
   */
  private subscription?: Subscription;

  /**
   * 初始化
   * Initialize
   */
  ngOnInit(): void {
    // 訂閱使用者狀態變化
    // 使用 toObservable 將 Signal 轉換為 Observable
    this.subscription = toObservable(this.authService.currentUser).subscribe(() => {
      this.updateView();
    });

    // 初始更新視圖
    this.updateView();
  }

  /**
   * 銷毀
   * Destroy
   */
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * 更新視圖
   * Update view
   *
   * 教學說明：
   * - 根據權限判斷是否顯示元素
   * - 使用 ViewContainerRef 動態插入或移除元素
   */
  private updateView(): void {
    const hasPermission = this.checkPermission();

    if (hasPermission && !this.isShowing) {
      // 有權限且未顯示，插入元素
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isShowing = true;
    } else if (!hasPermission && this.isShowing) {
      // 沒有權限且已顯示，移除元素
      this.viewContainer.clear();
      this.isShowing = false;
    }
  }

  /**
   * 檢查權限
   * Check permission
   *
   * @returns 是否有權限
   */
  private checkPermission(): boolean {
    if (!this.appHasRole) {
      return true;
    }

    const roles = Array.isArray(this.appHasRole)
      ? this.appHasRole
      : [this.appHasRole];

    if (roles.length === 0) {
      return true;
    }

    if (this.requireAll) {
      // 需要所有角色都符合（AND）
      return roles.every((role) => this.authService.hasRole(role));
    } else {
      // 任一角色符合即可（OR）
      return roles.some((role) => this.authService.hasRole(role));
    }
  }
}

/**
 * 已登入指令
 * Authenticated Directive
 *
 * 只有已登入使用者可見
 * Visible only to authenticated users
 *
 * 使用範例 / Usage Example:
 * ```html
 * <div *appAuthenticated>
 *   登入後才能看到的內容
 * </div>
 * ```
 */
@Directive({
  selector: '[appAuthenticated]',
  standalone: true,
})
export class AuthenticatedDirective implements OnInit, OnDestroy {
  /**
   * 注入服務
   * Inject services
   */
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);

  /**
   * 當前是否已顯示
   * Currently showing
   */
  private isShowing = false;

  /**
   * 訂閱
   * Subscription
   */
  private subscription?: Subscription;

  /**
   * 初始化
   * Initialize
   */
  ngOnInit(): void {
    // 使用 toObservable 將 Signal 轉換為 Observable
    this.subscription = toObservable(this.authService.isAuthenticated).subscribe(() => {
      this.updateView();
    });

    this.updateView();
  }

  /**
   * 銷毀
   * Destroy
   */
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * 更新視圖
   * Update view
   */
  private updateView(): void {
    const isAuthenticated = this.authService.isAuthenticated();

    if (isAuthenticated && !this.isShowing) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isShowing = true;
    } else if (!isAuthenticated && this.isShowing) {
      this.viewContainer.clear();
      this.isShowing = false;
    }
  }
}

/**
 * 未登入指令
 * Guest Directive
 *
 * 只有未登入使用者可見
 * Visible only to guest (non-authenticated) users
 *
 * 使用範例 / Usage Example:
 * ```html
 * <div *appGuest>
 *   未登入時才能看到的內容（例如：登入按鈕）
 * </div>
 * ```
 */
@Directive({
  selector: '[appGuest]',
  standalone: true,
})
export class GuestDirective implements OnInit, OnDestroy {
  /**
   * 注入服務
   * Inject services
   */
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);

  /**
   * 當前是否已顯示
   * Currently showing
   */
  private isShowing = false;

  /**
   * 訂閱
   * Subscription
   */
  private subscription?: Subscription;

  /**
   * 初始化
   * Initialize
   */
  ngOnInit(): void {
    // 使用 toObservable 將 Signal 轉換為 Observable
    this.subscription = toObservable(this.authService.isAuthenticated).subscribe(() => {
      this.updateView();
    });

    this.updateView();
  }

  /**
   * 銷毀
   * Destroy
   */
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * 更新視圖
   * Update view
   */
  private updateView(): void {
    const isAuthenticated = this.authService.isAuthenticated();

    // 與 AuthenticatedDirective 相反
    if (!isAuthenticated && !this.isShowing) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isShowing = true;
    } else if (isAuthenticated && this.isShowing) {
      this.viewContainer.clear();
      this.isShowing = false;
    }
  }
}
