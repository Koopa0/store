/**
 * 卡片元件
 * Card Component
 *
 * 擴展 Angular Material Card，加入自訂樣式和功能
 * Extends Angular Material Card with custom styles and features
 *
 * 教學重點 / Teaching Points:
 * 1. 內容投影 (Content Projection) 的高級應用
 * 2. 多插槽內容投影
 * 3. Component API 設計
 * 4. 可選功能的實現
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
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

/**
 * 卡片變體
 * Card variant
 */
export type CardVariant = 'default' | 'outlined' | 'elevated';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  /**
   * 卡片標題
   * Card title
   */
  @Input() title?: string;

  /**
   * 卡片副標題
   * Card subtitle
   */
  @Input() subtitle?: string;

  /**
   * 卡片變體
   * Card variant
   */
  @Input() variant: CardVariant = 'default';

  /**
   * 是否可點擊
   * Is clickable
   *
   * 教學說明：可點擊的卡片會有 hover 效果和游標變化
   */
  @Input() clickable = false;

  /**
   * 是否顯示分隔線
   * Show divider
   *
   * 教學說明：在標題和內容之間顯示分隔線
   */
  @Input() showDivider = false;

  /**
   * 是否顯示圖片
   * Show image
   */
  @Input() imageUrl?: string;

  /**
   * 圖片替代文字
   * Image alt text
   */
  @Input() imageAlt = '';

  /**
   * 自訂 CSS 類別
   * Custom CSS class
   */
  @Input() customClass = '';

  /**
   * 是否禁用內邊距
   * Disable padding
   *
   * 教學說明：有時需要完全控制內容的佈局
   */
  @Input() noPadding = false;

  /**
   * 卡片點擊事件
   * Card click event
   */
  @Output() cardClick = new EventEmitter<MouseEvent>();

  /**
   * 處理卡片點擊
   * Handle card click
   */
  onCardClick(event: MouseEvent): void {
    if (this.clickable) {
      this.cardClick.emit(event);
    }
  }

  /**
   * 取得卡片 CSS 類別
   * Get card CSS class
   */
  get cardClass(): string {
    const classes = ['app-card', `app-card--${this.variant}`];

    if (this.clickable) {
      classes.push('app-card--clickable');
    }

    if (this.noPadding) {
      classes.push('app-card--no-padding');
    }

    if (this.customClass) {
      classes.push(this.customClass);
    }

    return classes.join(' ');
  }

  /**
   * 是否顯示頭部
   * Should show header
   */
  get showHeader(): boolean {
    return !!(this.title || this.subtitle);
  }
}
