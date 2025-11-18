/**
 * 對話框服務
 * Dialog Service
 *
 * 封裝 Angular Material Dialog，提供更簡單的 API
 * Wraps Angular Material Dialog to provide simpler API
 *
 * 教學重點 / Teaching Points:
 * 1. Material Dialog 的使用
 * 2. Generic Types 的應用
 * 3. Promise 和 Observable 的轉換
 * 4. 服務層的設計模式
 */

import { Injectable, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

/**
 * 對話框配置
 * Dialog configuration
 */
export interface DialogConfig extends MatDialogConfig {
  /** 是否需要翻譯標題 */
  translateTitle?: boolean;
  /** 是否需要翻譯內容 */
  translateContent?: boolean;
}

/**
 * 確認對話框資料
 * Confirm dialog data
 */
export interface ConfirmDialogData {
  /** 標題 */
  title: string;
  /** 內容 */
  message: string;
  /** 確認按鈕文字 */
  confirmText?: string;
  /** 取消按鈕文字 */
  cancelText?: string;
  /** 確認按鈕顏色 */
  confirmColor?: 'primary' | 'accent' | 'warn';
  /** 是否顯示取消按鈕 */
  showCancel?: boolean;
}

/**
 * 警告對話框資料
 * Alert dialog data
 */
export interface AlertDialogData {
  /** 標題 */
  title: string;
  /** 內容 */
  message: string;
  /** 確認按鈕文字 */
  confirmText?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  /**
   * 注入服務
   * Inject services
   */
  private readonly dialog = inject(MatDialog);
  private readonly translateService = inject(TranslateService);

  /**
   * 開啟對話框
   * Open dialog
   *
   * @param component 對話框元件
   * @param config 對話框配置
   * @returns 對話框引用
   *
   * 教學說明：
   * 這是最基本的對話框開啟方法
   * 可以傳入任何元件作為對話框內容
   */
  open<T, D = any, R = any>(
    component: ComponentType<T>,
    config?: DialogConfig
  ): MatDialogRef<T, R> {
    return this.dialog.open(component, config);
  }

  /**
   * 開啟確認對話框
   * Open confirm dialog
   *
   * @param data 對話框資料
   * @param config 對話框配置
   * @returns Promise<boolean> 用戶是否確認
   *
   * 教學說明：
   * 確認對話框用於需要用戶確認的操作
   * 例如：刪除、登出、取消訂單等
   */
  async confirm(
    data: ConfirmDialogData,
    config?: DialogConfig
  ): Promise<boolean> {
    // 處理翻譯
    const translatedData = {
      ...data,
      title: config?.translateTitle !== false
        ? this.translateService.instant(data.title)
        : data.title,
      message: config?.translateContent !== false
        ? this.translateService.instant(data.message)
        : data.message,
      confirmText: data.confirmText
        ? (config?.translateContent !== false
            ? this.translateService.instant(data.confirmText)
            : data.confirmText)
        : this.translateService.instant('common.confirm'),
      cancelText: data.cancelText
        ? (config?.translateContent !== false
            ? this.translateService.instant(data.cancelText)
            : data.cancelText)
        : this.translateService.instant('common.cancel'),
    };

    // 開啟對話框
    // 注意：ConfirmDialogComponent 需要另外建立
    // const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    //   width: '400px',
    //   data: translatedData,
    //   ...config,
    // });

    // 暫時使用瀏覽器原生確認對話框
    // 實際應用中應該使用自訂的 ConfirmDialogComponent
    return Promise.resolve(
      confirm(`${translatedData.title}\n\n${translatedData.message}`)
    );

    // 正式版本應該這樣寫：
    // return firstValueFrom(dialogRef.afterClosed()).then(
    //   (result) => result === true
    // );
  }

  /**
   * 開啟警告對話框
   * Open alert dialog
   *
   * @param data 對話框資料
   * @param config 對話框配置
   *
   * 教學說明：
   * 警告對話框用於顯示重要訊息
   * 只有一個確認按鈕
   */
  async alert(data: AlertDialogData, config?: DialogConfig): Promise<void> {
    // 處理翻譯
    const translatedData = {
      ...data,
      title: config?.translateTitle !== false
        ? this.translateService.instant(data.title)
        : data.title,
      message: config?.translateContent !== false
        ? this.translateService.instant(data.message)
        : data.message,
      confirmText: data.confirmText
        ? (config?.translateContent !== false
            ? this.translateService.instant(data.confirmText)
            : data.confirmText)
        : this.translateService.instant('common.ok'),
    };

    // 暫時使用瀏覽器原生警告對話框
    alert(`${translatedData.title}\n\n${translatedData.message}`);

    // 正式版本應該這樣寫：
    // const dialogRef = this.dialog.open(AlertDialogComponent, {
    //   width: '400px',
    //   data: translatedData,
    //   ...config,
    // });
    //
    // await firstValueFrom(dialogRef.afterClosed());
  }

  /**
   * 開啟自訂對話框並等待結果
   * Open custom dialog and wait for result
   *
   * @param component 對話框元件
   * @param config 對話框配置
   * @returns Promise<結果>
   *
   * 教學說明：
   * 將 Observable 轉換為 Promise
   * 方便使用 async/await 語法
   */
  async openAndWait<T, R = any>(
    component: ComponentType<T>,
    config?: DialogConfig
  ): Promise<R | undefined> {
    const dialogRef = this.open<T, any, R>(component, config);
    return firstValueFrom(dialogRef.afterClosed());
  }

  /**
   * 關閉所有對話框
   * Close all dialogs
   *
   * 教學說明：
   * 用於特殊情況，例如用戶登出時
   */
  closeAll(): void {
    this.dialog.closeAll();
  }

  /**
   * 取得已開啟的對話框數量
   * Get number of opened dialogs
   */
  get openDialogsCount(): number {
    return this.dialog.openDialogs.length;
  }

  /**
   * 取得所有已開啟的對話框
   * Get all opened dialogs
   */
  get openDialogs(): MatDialogRef<any>[] {
    return this.dialog.openDialogs;
  }
}
