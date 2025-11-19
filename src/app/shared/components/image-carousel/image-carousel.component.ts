/**
 * 圖片輪播組件
 * Image Carousel Component
 *
 * 用於商品圖片展示和評價圖片展示
 * Used for product images and review images
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. 圖片輪播邏輯
 * 3. 鍵盤導航支援
 * 4. 縮圖選擇器
 */

import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './image-carousel.component.html',
  styleUrl: './image-carousel.component.scss',
  host: {
    '(document:keydown)': 'onKeyDown($event)',
  },
})
export class ImageCarouselComponent {
  /**
   * 圖片 URLs 陣列
   * Image URLs array
   */
  @Input({ required: true }) set images(value: string[]) {
    this.imagesSignal.set(value);
    // 重置到第一張圖片
    this.currentIndexSignal.set(0);
  }

  /**
   * 是否顯示縮圖
   * Show thumbnails
   */
  @Input() showThumbnails = true;

  /**
   * 是否自動播放
   * Auto play
   */
  @Input() autoPlay = false;

  /**
   * 自動播放間隔（毫秒）
   * Auto play interval (ms)
   */
  @Input() autoPlayInterval = 3000;

  /**
   * 圖片高度
   * Image height
   */
  @Input() height = '500px';

  /**
   * 狀態 Signals
   * State signals
   */
  private readonly imagesSignal = signal<string[]>([]);
  private readonly currentIndexSignal = signal(0);

  /**
   * 唯讀公開的 Signals
   * Readonly public signals
   */
  public readonly images$ = this.imagesSignal.asReadonly();
  public readonly currentIndex = this.currentIndexSignal.asReadonly();

  /**
   * 計算屬性：當前圖片
   * Computed: current image
   */
  public readonly currentImage = computed(() => {
    const images = this.imagesSignal();
    const index = this.currentIndexSignal();
    return images[index] || '';
  });

  /**
   * 計算屬性：是否有多張圖片
   * Computed: has multiple images
   */
  public readonly hasMultipleImages = computed(() => {
    return this.imagesSignal().length > 1;
  });

  /**
   * 計算屬性：是否可以上一張
   * Computed: can go previous
   */
  public readonly canGoPrevious = computed(() => {
    return this.currentIndexSignal() > 0;
  });

  /**
   * 計算屬性：是否可以下一張
   * Computed: can go next
   */
  public readonly canGoNext = computed(() => {
    return this.currentIndexSignal() < this.imagesSignal().length - 1;
  });

  /**
   * 自動播放計時器
   * Auto play timer
   */
  private autoPlayTimer?: number;

  /**
   * 元件初始化
   * Component initialization
   */
  ngOnInit(): void {
    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  /**
   * 元件銷毀
   * Component destroy
   */
  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  /**
   * 前往上一張
   * Go to previous image
   */
  previous(): void {
    if (this.canGoPrevious()) {
      this.currentIndexSignal.update((i) => i - 1);
      this.resetAutoPlay();
    }
  }

  /**
   * 前往下一張
   * Go to next image
   */
  next(): void {
    if (this.canGoNext()) {
      this.currentIndexSignal.update((i) => i + 1);
      this.resetAutoPlay();
    } else if (this.autoPlay) {
      // 自動播放模式下，最後一張回到第一張
      this.currentIndexSignal.set(0);
    }
  }

  /**
   * 選擇特定圖片
   * Select specific image
   */
  selectImage(index: number): void {
    if (index >= 0 && index < this.imagesSignal().length) {
      this.currentIndexSignal.set(index);
      this.resetAutoPlay();
    }
  }

  /**
   * 鍵盤導航
   * Keyboard navigation
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.previous();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.next();
      event.preventDefault();
    }
  }

  /**
   * 開始自動播放
   * Start auto play
   */
  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayTimer = window.setInterval(() => {
      this.next();
    }, this.autoPlayInterval);
  }

  /**
   * 停止自動播放
   * Stop auto play
   */
  private stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = undefined;
    }
  }

  /**
   * 重置自動播放
   * Reset auto play
   */
  private resetAutoPlay(): void {
    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  /**
   * 滑鼠進入時暫停自動播放
   * Pause auto play on mouse enter
   */
  onMouseEnter(): void {
    if (this.autoPlay) {
      this.stopAutoPlay();
    }
  }

  /**
   * 滑鼠離開時恢復自動播放
   * Resume auto play on mouse leave
   */
  onMouseLeave(): void {
    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }
}
