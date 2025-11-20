/**
 * 通知服務
 * Notification Service
 *
 * 使用 Material Snackbar 顯示通知訊息
 * Uses Material Snackbar to display notification messages
 *
 * 教學重點 / Teaching Points:
 * 1. Angular Material Snackbar 的使用
 * 2. 多種通知類型（成功、錯誤、警告、資訊）
 * 3. 可配置的通知選項
 * 4. i18n 支援
 * 5. Queue 管理（避免通知重疊）
 */

import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

/**
 * 通知類型
 * Notification type
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * 通知選項
 * Notification options
 */
export interface NotificationOptions {
  /** 顯示時長（毫秒），預設 3000 */
  duration?: number;
  /** 水平位置 */
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  /** 垂直位置 */
  verticalPosition?: 'top' | 'bottom';
  /** 自定義 CSS 類別 */
  panelClass?: string | string[];
  /** 動作按鈕文字 */
  action?: string;
  /** 是否需要翻譯訊息 */
  translate?: boolean;
}

/**
 * 通知服務
 * Notification service
 */
@Injectable({
  providedIn: 'root', // 單例服務
})
export class NotificationService {
  /**
   * 注入服務
   * Inject services
   */
  private readonly snackBar = inject(MatSnackBar);
  private readonly translateService = inject(TranslateService);

  /**
   * 當前顯示的 Snackbar 引用
   * Current snackbar reference
   */
  private currentSnackBar: MatSnackBarRef<any> | null = null;

  /**
   * 預設配置
   * Default configuration
   */
  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
  };

  /**
   * 顯示成功通知
   * Show success notification
   *
   * @param message 訊息內容
   * @param options 選項
   *
   * 教學說明：
   * 成功訊息通常用於操作完成的反饋
   * 例如：「儲存成功」、「登入成功」
   */
  public success(message: string, options?: NotificationOptions): void {
    this.show(message, 'success', options);
  }

  /**
   * 顯示錯誤通知
   * Show error notification
   *
   * @param message 訊息內容
   * @param options 選項
   *
   * 教學說明：
   * 錯誤訊息用於操作失敗的反饋
   * 例如：「登入失敗」、「網路錯誤」
   */
  public error(message: string, options?: NotificationOptions): void {
    this.show(message, 'error', {
      ...options,
      duration: options?.duration || 5000, // 錯誤訊息顯示較久
    });
  }

  /**
   * 顯示警告通知
   * Show warning notification
   *
   * @param message 訊息內容
   * @param options 選項
   *
   * 教學說明：
   * 警告訊息用於提醒用戶注意
   * 例如：「資料將被刪除」、「即將過期」
   */
  public warning(message: string, options?: NotificationOptions): void {
    this.show(message, 'warning', options);
  }

  /**
   * 顯示資訊通知
   * Show info notification
   *
   * @param message 訊息內容
   * @param options 選項
   *
   * 教學說明：
   * 資訊訊息用於一般性提示
   * 例如：「新版本可用」、「提示訊息」
   */
  public info(message: string, options?: NotificationOptions): void {
    this.show(message, 'info', options);
  }

  /**
   * 顯示通知
   * Show notification
   *
   * @param message 訊息內容
   * @param type 通知類型
   * @param options 選項
   */
  private show(
    message: string,
    type: NotificationType,
    options?: NotificationOptions
  ): void {
    // 關閉當前顯示的通知（避免重疊）
    this.dismiss();

    // 處理翻譯
    const displayMessage = options?.translate !== false
      ? this.translateService.instant(message)
      : message;

    // 處理動作按鈕文字
    const actionText = options?.action
      ? (options.translate !== false
          ? this.translateService.instant(options.action)
          : options.action)
      : undefined;

    // 合併配置
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...(options?.duration !== undefined && { duration: options.duration }),
      ...(options?.horizontalPosition && { horizontalPosition: options.horizontalPosition }),
      ...(options?.verticalPosition && { verticalPosition: options.verticalPosition }),
      panelClass: this.getPanelClass(type, options?.panelClass),
    };

    // 顯示 Snackbar
    this.currentSnackBar = this.snackBar.open(
      displayMessage,
      actionText,
      config
    );

    console.log(`[NotificationService] ${type.toUpperCase()}: ${displayMessage}`);
  }

  /**
   * 關閉當前通知
   * Dismiss current notification
   */
  public dismiss(): void {
    if (this.currentSnackBar) {
      this.currentSnackBar.dismiss();
      this.currentSnackBar = null;
    }
  }

  /**
   * 取得面板 CSS 類別
   * Get panel CSS class
   *
   * @param type 通知類型
   * @param customClass 自定義類別
   * @returns CSS 類別陣列
   *
   * 教學說明：
   * 根據通知類型添加不同的 CSS 類別
   * 可以在全域樣式中定義這些類別的樣式
   */
  private getPanelClass(
    type: NotificationType,
    customClass?: string | string[]
  ): string[] {
    const baseClass = 'notification';
    const typeClass = `notification-${type}`;

    const classes = [baseClass, typeClass];

    if (customClass) {
      if (Array.isArray(customClass)) {
        classes.push(...customClass);
      } else {
        classes.push(customClass);
      }
    }

    return classes;
  }

  /**
   * 顯示確認對話框（使用 Snackbar）
   * Show confirmation dialog (using Snackbar)
   *
   * @param message 訊息內容
   * @param confirmText 確認按鈕文字
   * @param options 選項
   * @returns Promise<boolean> 用戶是否確認
   *
   * 教學說明：
   * 這是簡化版的確認對話框
   * 實際應用中建議使用 MatDialog
   */
  public async confirm(
    message: string,
    confirmText: string = 'common.confirm',
    options?: NotificationOptions
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // 處理翻譯
      const displayMessage = options?.translate !== false
        ? this.translateService.instant(message)
        : message;

      const actionText = options?.translate !== false
        ? this.translateService.instant(confirmText)
        : confirmText;

      // 合併配置
      const config: MatSnackBarConfig = {
        ...this.defaultConfig,
        duration: 0, // 不自動關閉
        horizontalPosition: options?.horizontalPosition,
        verticalPosition: options?.verticalPosition,
        panelClass: this.getPanelClass('warning', options?.panelClass),
      };

      // 顯示 Snackbar
      const snackBarRef = this.snackBar.open(
        displayMessage,
        actionText,
        config
      );

      // 監聽動作按鈕點擊
      snackBarRef.onAction().subscribe(() => {
        resolve(true);
      });

      // 監聽關閉事件
      snackBarRef.afterDismissed().subscribe((info) => {
        if (!info.dismissedByAction) {
          resolve(false);
        }
      });
    });
  }

  /**
   * 顯示載入中通知
   * Show loading notification
   *
   * @param message 訊息內容
   * @param options 選項
   * @returns 關閉函數
   *
   * 教學說明：
   * 載入中通知不會自動關閉
   * 需要手動呼叫返回的關閉函數
   */
  public showLoading(
    message: string = 'common.loading',
    options?: NotificationOptions
  ): () => void {
    // 處理翻譯
    const displayMessage = options?.translate !== false
      ? this.translateService.instant(message)
      : message;

    // 合併配置
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: 0, // 不自動關閉
      horizontalPosition: options?.horizontalPosition,
      verticalPosition: options?.verticalPosition,
      panelClass: this.getPanelClass('info', [
        ...(Array.isArray(options?.panelClass) ? options.panelClass : [options?.panelClass || '']),
        'notification-loading',
      ]),
    };

    // 顯示 Snackbar
    this.currentSnackBar = this.snackBar.open(
      displayMessage,
      undefined,
      config
    );

    console.log(`[NotificationService] LOADING: ${displayMessage}`);

    // 返回關閉函數
    return () => this.dismiss();
  }

  /**
   * 顯示持久通知（不自動關閉）
   * Show persistent notification (doesn't auto-dismiss)
   *
   * @param message 訊息內容
   * @param type 通知類型
   * @param closeText 關閉按鈕文字
   * @param options 選項
   */
  public showPersistent(
    message: string,
    type: NotificationType = 'info',
    closeText: string = 'common.close',
    options?: NotificationOptions
  ): void {
    this.show(message, type, {
      ...options,
      duration: 0,
      action: closeText,
    });
  }
}
