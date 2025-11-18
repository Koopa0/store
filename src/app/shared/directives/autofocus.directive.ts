/**
 * 自動聚焦指令
 * Autofocus Directive
 *
 * 元件載入後自動聚焦到指定元素
 * Automatically focuses on element after component loads
 *
 * 教學重點 / Teaching Points:
 * 1. AfterViewInit 生命週期鉤子
 * 2. 條件式聚焦
 * 3. 延遲執行
 * 4. 無障礙考量
 */

import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  inject,
} from '@angular/core';

/**
 * 自動聚焦指令
 * Autofocus Directive
 *
 * 使用範例 / Usage Example:
 * ```html
 * <input type="text" appAutofocus>
 * <input type="text" [appAutofocus]="shouldFocus">
 * <input type="text" [appAutofocus]="true" [autofocusDelay]="500">
 * ```
 *
 * 教學說明：
 * - 預設會自動聚焦
 * - 可以透過條件控制是否聚焦
 * - 可以設定延遲時間
 */
@Directive({
  selector: '[appAutofocus]',
  standalone: true,
})
export class AutofocusDirective implements AfterViewInit {
  /**
   * 注入元素引用
   * Inject element reference
   */
  private readonly elementRef = inject(ElementRef);

  /**
   * 是否啟用自動聚焦
   * Enable autofocus
   *
   * 教學說明：
   * - true: 啟用聚焦
   * - false: 不聚焦
   * - 預設 true
   */
  @Input() appAutofocus: boolean | string = true;

  /**
   * 聚焦延遲時間（毫秒）
   * Focus delay in milliseconds
   *
   * 教學說明：
   * 有時需要延遲聚焦，例如等待動畫完成
   */
  @Input() autofocusDelay: number = 0;

  /**
   * 視圖初始化後執行
   * Execute after view init
   *
   * 教學說明：
   * - AfterViewInit 確保 DOM 已經準備好
   * - 使用 setTimeout 避免 ExpressionChangedAfterItHasBeenCheckedError
   */
  ngAfterViewInit(): void {
    // 檢查是否應該聚焦
    const shouldFocus =
      this.appAutofocus === true ||
      this.appAutofocus === '' ||
      this.appAutofocus === 'true';

    if (shouldFocus) {
      // 延遲聚焦
      setTimeout(() => {
        this.focusElement();
      }, this.autofocusDelay);
    }
  }

  /**
   * 聚焦元素
   * Focus element
   *
   * 教學說明：
   * - 使用 focus() 方法聚焦
   * - 檢查元素是否支援 focus 方法
   */
  private focusElement(): void {
    const element = this.elementRef.nativeElement;

    if (element && typeof element.focus === 'function') {
      element.focus();

      // 如果是輸入框，選取所有文字
      if (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.isContentEditable
      ) {
        if (typeof element.select === 'function') {
          element.select();
        }
      }
    }
  }
}
