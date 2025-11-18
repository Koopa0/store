/**
 * 自訂按鈕元件
 * Custom Button Component
 *
 * 擴展 Angular Material 按鈕，加入載入狀態和自訂變體
 * Extends Angular Material button with loading states and custom variants
 *
 * 教學重點 / Teaching Points:
 * 1. Component Input 裝飾器
 * 2. Component Output 裝飾器
 * 3. 內容投影 (Content Projection)
 * 4. 條件渲染
 * 5. 事件處理
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

/**
 * 按鈕類型
 * Button type
 */
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * 按鈕變體
 * Button variant
 *
 * 教學說明：
 * - basic: 基本按鈕
 * - raised: 凸起按鈕（有陰影）
 * - flat: 扁平按鈕
 * - stroked: 線框按鈕
 * - icon: 圖標按鈕
 * - fab: 浮動動作按鈕
 * - mini-fab: 小型浮動動作按鈕
 */
export type ButtonVariant =
  | 'basic'
  | 'raised'
  | 'flat'
  | 'stroked'
  | 'icon'
  | 'fab'
  | 'mini-fab';

/**
 * 按鈕顏色
 * Button color
 */
export type ButtonColor = 'primary' | 'accent' | 'warn' | undefined;

/**
 * 按鈕大小
 * Button size
 */
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  /**
   * 按鈕類型
   * Button type
   *
   * 教學說明：決定按鈕的 HTML type 屬性
   */
  @Input() type: ButtonType = 'button';

  /**
   * 按鈕變體
   * Button variant
   *
   * 教學說明：決定按鈕的外觀樣式
   */
  @Input() variant: ButtonVariant = 'raised';

  /**
   * 按鈕顏色
   * Button color
   *
   * 教學說明：使用 Material 主題顏色
   */
  @Input() color: ButtonColor = 'primary';

  /**
   * 按鈕大小
   * Button size
   */
  @Input() size: ButtonSize = 'medium';

  /**
   * 是否禁用
   * Is disabled
   */
  @Input() disabled = false;

  /**
   * 是否載入中
   * Is loading
   *
   * 教學說明：載入中時會顯示載入動畫並禁用按鈕
   */
  @Input() loading = false;

  /**
   * 圖標名稱
   * Icon name
   *
   * 教學說明：Material Icons 的圖標名稱
   */
  @Input() icon?: string;

  /**
   * 圖標位置
   * Icon position
   */
  @Input() iconPosition: 'left' | 'right' = 'left';

  /**
   * 是否全寬
   * Is full width
   */
  @Input() fullWidth = false;

  /**
   * 自訂 CSS 類別
   * Custom CSS class
   */
  @Input() customClass = '';

  /**
   * 點擊事件
   * Click event
   *
   * 教學說明：
   * - 使用 EventEmitter 發送事件給父元件
   * - 載入中時不會觸發事件
   */
  @Output() clicked = new EventEmitter<MouseEvent>();

  /**
   * 處理點擊事件
   * Handle click event
   *
   * @param event 滑鼠事件
   */
  onButtonClick(event: MouseEvent): void {
    // 載入中或禁用時不觸發事件
    if (this.loading || this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.clicked.emit(event);
  }

  /**
   * 取得按鈕 CSS 類別
   * Get button CSS class
   */
  get buttonClass(): string {
    const classes = ['app-button', `app-button--${this.size}`];

    if (this.fullWidth) {
      classes.push('app-button--full-width');
    }

    if (this.customClass) {
      classes.push(this.customClass);
    }

    return classes.join(' ');
  }

  /**
   * 是否為圖標按鈕
   * Is icon button
   */
  get isIconButton(): boolean {
    return this.variant === 'icon' || this.variant === 'fab' || this.variant === 'mini-fab';
  }

  /**
   * 取得載入動畫直徑
   * Get loading spinner diameter
   */
  get spinnerDiameter(): number {
    switch (this.size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  }
}
