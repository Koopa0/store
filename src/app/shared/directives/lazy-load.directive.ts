/**
 * 懶載入指令
 * Lazy Load Directive
 *
 * 使用 Intersection Observer API 實現圖片懶載入
 * Implements lazy loading for images using Intersection Observer API
 *
 * 教學重點 / Teaching Points:
 * 1. Intersection Observer API 的使用
 * 2. 效能優化技巧
 * 3. 圖片載入最佳實踐
 * 4. OnDestroy 生命週期鉤子
 */

import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  inject,
  Renderer2,
} from '@angular/core';

/**
 * 懶載入指令
 * Lazy Load Directive
 *
 * 使用範例 / Usage Example:
 * ```html
 * <img lazyLoad [src]="imageUrl" [alt]="imageAlt">
 * ```
 *
 * 教學說明：
 * - 只有當圖片進入視窗時才載入
 * - 提升頁面載入效能
 * - 減少不必要的網路請求
 */
@Directive({
  selector: 'img[lazyLoad]',
  standalone: true,
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  /**
   * 注入服務
   * Inject services
   */
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /**
   * Intersection Observer 實例
   * Intersection Observer instance
   */
  private observer: IntersectionObserver | null = null;

  /**
   * 預設圖片
   * Default placeholder image
   *
   * 教學說明：
   * 在實際圖片載入前顯示的佔位圖
   */
  @Input() placeholder =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="24"%3ELoading...%3C/text%3E%3C/svg%3E';

  /**
   * 錯誤圖片
   * Error image
   *
   * 教學說明：
   * 當圖片載入失敗時顯示的圖片
   */
  @Input() errorImage =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="24"%3EImage not found%3C/text%3E%3C/svg%3E';

  /**
   * 初始化
   * Initialize
   */
  ngOnInit(): void {
    // 設定預設圖片
    this.setImageSrc(this.placeholder);

    // 檢查瀏覽器是否支援 Intersection Observer
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else {
      // 不支援則直接載入圖片
      this.loadImage();
    }
  }

  /**
   * 銷毀
   * Destroy
   */
  ngOnDestroy(): void {
    // 清理 observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * 設定 Intersection Observer
   * Setup Intersection Observer
   *
   * 教學說明：
   * - Intersection Observer 用於偵測元素是否進入視窗
   * - root: 視窗（null 表示整個視窗）
   * - rootMargin: 提前多少像素開始載入（預載入）
   * - threshold: 元素進入多少百分比時觸發
   */
  private setupIntersectionObserver(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px', // 提前 50px 開始載入
      threshold: 0.01, // 1% 進入視窗時觸發
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 元素進入視窗，載入圖片
          this.loadImage();

          // 載入後停止觀察
          if (this.observer) {
            this.observer.unobserve(this.elementRef.nativeElement);
          }
        }
      });
    }, options);

    // 開始觀察元素
    this.observer.observe(this.elementRef.nativeElement);
  }

  /**
   * 載入圖片
   * Load image
   *
   * 教學說明：
   * 使用 Image 物件預載入圖片
   * 避免直接設定 src 造成的閃爍
   */
  private loadImage(): void {
    const img: HTMLImageElement = this.elementRef.nativeElement;
    const src = img.getAttribute('data-src') || img.src;

    if (!src) {
      return;
    }

    // 建立新的 Image 物件用於預載入
    const imageLoader = new Image();

    // 載入成功
    imageLoader.onload = () => {
      this.setImageSrc(src);
      this.renderer.addClass(img, 'lazy-loaded');
    };

    // 載入失敗
    imageLoader.onerror = () => {
      this.setImageSrc(this.errorImage);
      this.renderer.addClass(img, 'lazy-error');
    };

    // 開始載入
    imageLoader.src = src;
  }

  /**
   * 設定圖片來源
   * Set image source
   */
  private setImageSrc(src: string): void {
    const img: HTMLImageElement = this.elementRef.nativeElement;
    this.renderer.setAttribute(img, 'src', src);
  }
}
