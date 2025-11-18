/**
 * 防抖指令
 * Debounce Directive
 *
 * 延遲執行事件，避免頻繁觸發
 * Delays event execution to avoid frequent triggers
 *
 * 教學重點 / Teaching Points:
 * 1. Debounce 概念
 * 2. RxJS Subject 的使用
 * 3. debounceTime 操作符
 * 4. 事件處理優化
 * 5. 記憶體洩漏防止
 */

import {
  Directive,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * 防抖指令
 * Debounce Directive
 *
 * 使用範例 / Usage Example:
 * ```html
 * <!-- 輸入框搜尋 -->
 * <input
 *   type="text"
 *   (input)="onSearch($event)"
 *   [debounceTime]="500"
 *   (debounceEvent)="onDebounceSearch($event)"
 * >
 *
 * <!-- 點擊按鈕 -->
 * <button
 *   (click)="onClick()"
 *   [debounceTime]="1000"
 *   [debounceEvent]="'click'"
 *   (debounceEmit)="onDebounceClick()"
 * >
 *   Click me
 * </button>
 * ```
 *
 * 教學說明：
 * - debounceTime: 延遲時間（毫秒）
 * - debounceEvent: 要防抖的事件類型
 * - debounceEmit: 防抖後觸發的事件
 *
 * Debounce vs Throttle:
 * - Debounce: 只執行最後一次（適合搜尋輸入）
 * - Throttle: 固定時間內只執行一次（適合滾動事件）
 */
@Directive({
  selector: '[debounceTime]',
  standalone: true,
})
export class DebounceDirective implements OnInit, OnDestroy {
  /**
   * 防抖延遲時間（毫秒）
   * Debounce delay time in milliseconds
   *
   * 教學說明：
   * 預設 300ms，可以根據需求調整
   * - 搜尋框：300-500ms
   * - 表單驗證：500-1000ms
   * - 自動儲存：1000-3000ms
   */
  @Input() debounceTime: number = 300;

  /**
   * 要防抖的事件類型
   * Event type to debounce
   */
  @Input() debounceEvent: string = 'input';

  /**
   * 防抖後觸發的事件
   * Event emitted after debounce
   */
  @Output() debounceEmit = new EventEmitter<any>();

  /**
   * 事件主題
   * Event subject
   *
   * 教學說明：
   * Subject 是 RxJS 中的特殊 Observable
   * 可以手動觸發事件
   */
  private eventSubject = new Subject<any>();

  /**
   * 訂閱
   * Subscription
   */
  private subscription?: Subscription;

  /**
   * 初始化
   * Initialize
   *
   * 教學說明：
   * - 訂閱 eventSubject
   * - 使用 debounceTime 操作符延遲執行
   */
  ngOnInit(): void {
    this.subscription = this.eventSubject
      .pipe(debounceTime(this.debounceTime))
      .subscribe((event) => {
        this.debounceEmit.emit(event);
      });
  }

  /**
   * 銷毀
   * Destroy
   *
   * 教學說明：
   * 取消訂閱以避免記憶體洩漏
   */
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.eventSubject.complete();
  }

  /**
   * 監聽輸入事件
   * Listen to input event
   */
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    if (this.debounceEvent === 'input') {
      event.preventDefault();
      event.stopPropagation();
      this.eventSubject.next(event);
    }
  }

  /**
   * 監聽點擊事件
   * Listen to click event
   */
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.debounceEvent === 'click') {
      event.preventDefault();
      event.stopPropagation();
      this.eventSubject.next(event);
    }
  }

  /**
   * 監聽鍵盤事件
   * Listen to keyup event
   */
  @HostListener('keyup', ['$event'])
  onKeyup(event: KeyboardEvent): void {
    if (this.debounceEvent === 'keyup') {
      event.preventDefault();
      event.stopPropagation();
      this.eventSubject.next(event);
    }
  }
}

/**
 * 節流指令
 * Throttle Directive
 *
 * 固定時間內只執行一次
 * Execute only once within a fixed time period
 *
 * 使用範例 / Usage Example:
 * ```html
 * <div
 *   (scroll)="onScroll()"
 *   [throttleTime]="200"
 *   (throttleEmit)="onThrottleScroll($event)"
 * >
 *   Scrollable content
 * </div>
 * ```
 *
 * 教學說明：
 * 適合用於高頻事件，如：
 * - 滾動事件
 * - 視窗大小調整
 * - 滑鼠移動
 */
@Directive({
  selector: '[throttleTime]',
  standalone: true,
})
export class ThrottleDirective implements OnInit, OnDestroy {
  /**
   * 節流時間（毫秒）
   * Throttle time in milliseconds
   */
  @Input() throttleTime: number = 200;

  /**
   * 節流後觸發的事件
   * Event emitted after throttle
   */
  @Output() throttleEmit = new EventEmitter<any>();

  /**
   * 是否正在節流中
   * Is throttling
   */
  private isThrottling = false;

  /**
   * 計時器
   * Timer
   */
  private timer: any = null;

  /**
   * 銷毀
   * Destroy
   */
  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  /**
   * 初始化
   * Initialize
   */
  ngOnInit(): void {}

  /**
   * 監聽滾動事件
   * Listen to scroll event
   */
  @HostListener('scroll', ['$event'])
  onScroll(event: Event): void {
    this.handleEvent(event);
  }

  /**
   * 監聽滑鼠移動事件
   * Listen to mousemove event
   */
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.handleEvent(event);
  }

  /**
   * 監聽視窗大小調整事件
   * Listen to window resize event
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.handleEvent(event);
  }

  /**
   * 處理事件
   * Handle event
   *
   * 教學說明：
   * Throttle 實現邏輯：
   * 1. 如果正在節流中，忽略事件
   * 2. 否則立即執行事件
   * 3. 設定節流狀態
   * 4. 在指定時間後解除節流狀態
   */
  private handleEvent(event: any): void {
    if (!this.isThrottling) {
      this.throttleEmit.emit(event);
      this.isThrottling = true;

      this.timer = setTimeout(() => {
        this.isThrottling = false;
      }, this.throttleTime);
    }
  }
}
