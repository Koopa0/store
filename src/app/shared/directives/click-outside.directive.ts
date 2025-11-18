/**
 * 點擊外部指令
 * Click Outside Directive
 *
 * 偵測使用者點擊元素外部的事件
 * Detects when user clicks outside an element
 *
 * 教學重點 / Teaching Points:
 * 1. Custom Directive 的建立
 * 2. HostListener 的使用
 * 3. ElementRef 的應用
 * 4. 事件處理
 * 5. 實用的 UI 互動模式
 */

import {
  Directive,
  ElementRef,
  Output,
  EventEmitter,
  HostListener,
  inject,
} from '@angular/core';

/**
 * 點擊外部指令
 * Click Outside Directive
 *
 * 使用範例 / Usage Example:
 * ```html
 * <div (clickOutside)="onClickOutside()">
 *   <!-- 下拉選單內容 -->
 * </div>
 * ```
 *
 * 教學說明：
 * 常用於關閉下拉選單、對話框、彈出視窗等
 * 當使用者點擊元素外部時觸發事件
 */
@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  /**
   * 注入元素引用
   * Inject element reference
   */
  private readonly elementRef = inject(ElementRef);

  /**
   * 點擊外部事件
   * Click outside event
   *
   * 教學說明：
   * 使用 EventEmitter 發送事件給父元件
   */
  @Output() clickOutside = new EventEmitter<MouseEvent>();

  /**
   * 監聽文檔點擊事件
   * Listen to document click event
   *
   * @param event 滑鼠事件
   *
   * 教學說明：
   * - HostListener 用於監聽 DOM 事件
   * - 'document:click' 監聽整個文檔的點擊事件
   * - $event 是滑鼠事件物件
   * - event.target 是被點擊的元素
   */
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;

    if (!targetElement) {
      return;
    }

    // 檢查點擊是否在元素內部
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);

    if (!clickedInside) {
      // 點擊在元素外部，觸發事件
      this.clickOutside.emit(event);
    }
  }
}
