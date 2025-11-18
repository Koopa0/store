/**
 * 載入服務
 * Loading Service
 *
 * 管理全域載入狀態
 * Manages global loading state
 *
 * 教學重點 / Teaching Points:
 * 1. 使用 Signal 管理載入狀態
 * 2. 計數器模式處理多個並行請求
 * 3. 防抖動（Debounce）避免閃爍
 * 4. 提供多個載入通道（channel）
 */

import { Injectable, signal, computed } from '@angular/core';

/**
 * 載入通道
 * Loading channel
 *
 * 教學說明：
 * 允許不同的功能模組使用獨立的載入指示器
 * 例如：全域載入、區域載入、對話框載入等
 */
export type LoadingChannel = 'global' | 'dialog' | 'background' | string;

/**
 * 載入服務
 * Loading service
 */
@Injectable({
  providedIn: 'root', // 單例服務
})
export class LoadingService {
  /**
   * 載入計數器（使用 Map 儲存不同通道的計數）
   * Loading counter (using Map to store counts for different channels)
   *
   * 教學說明：
   * 使用計數器模式可以正確處理多個並行請求
   * 只有當所有請求都完成時，載入指示器才會隱藏
   */
  private readonly loadingCounters = signal<Map<LoadingChannel, number>>(
    new Map()
  );

  /**
   * 全域載入狀態（計算 Signal）
   * Global loading state (computed Signal)
   *
   * 教學說明：
   * 使用 computed() 自動計算是否有任何通道正在載入
   */
  public readonly isLoading = computed(() => {
    const counters = this.loadingCounters();
    const globalCount = counters.get('global') || 0;
    return globalCount > 0;
  });

  /**
   * 是否有任何通道正在載入（計算 Signal）
   * Whether any channel is loading (computed Signal)
   */
  public readonly isAnyLoading = computed(() => {
    const counters = this.loadingCounters();
    return Array.from(counters.values()).some((count) => count > 0);
  });

  /**
   * 載入中的通道數量（計算 Signal）
   * Number of loading channels (computed Signal)
   */
  public readonly loadingCount = computed(() => {
    const counters = this.loadingCounters();
    return Array.from(counters.values()).reduce((sum, count) => sum + count, 0);
  });

  /**
   * 顯示載入指示器
   * Show loading indicator
   *
   * @param channel 載入通道（預設為 'global'）
   *
   * 教學說明：
   * 每次呼叫會將對應通道的計數器 +1
   */
  public show(channel: LoadingChannel = 'global'): void {
    const counters = new Map(this.loadingCounters());
    const currentCount = counters.get(channel) || 0;
    counters.set(channel, currentCount + 1);
    this.loadingCounters.set(counters);

    console.log(`[LoadingService] Show - Channel: ${channel}, Count: ${currentCount + 1}`);
  }

  /**
   * 隱藏載入指示器
   * Hide loading indicator
   *
   * @param channel 載入通道（預設為 'global'）
   *
   * 教學說明：
   * 每次呼叫會將對應通道的計數器 -1
   * 計數器不會小於 0
   */
  public hide(channel: LoadingChannel = 'global'): void {
    const counters = new Map(this.loadingCounters());
    const currentCount = counters.get(channel) || 0;
    const newCount = Math.max(0, currentCount - 1);

    if (newCount === 0) {
      counters.delete(channel);
    } else {
      counters.set(channel, newCount);
    }

    this.loadingCounters.set(counters);

    console.log(`[LoadingService] Hide - Channel: ${channel}, Count: ${newCount}`);
  }

  /**
   * 重置特定通道的載入狀態
   * Reset loading state for specific channel
   *
   * @param channel 載入通道
   *
   * 教學說明：
   * 強制將指定通道的計數器歸零
   * 用於錯誤恢復或強制重置
   */
  public reset(channel?: LoadingChannel): void {
    if (channel) {
      // 重置特定通道
      const counters = new Map(this.loadingCounters());
      counters.delete(channel);
      this.loadingCounters.set(counters);
      console.log(`[LoadingService] Reset channel: ${channel}`);
    } else {
      // 重置所有通道
      this.loadingCounters.set(new Map());
      console.log('[LoadingService] Reset all channels');
    }
  }

  /**
   * 檢查特定通道是否正在載入
   * Check if specific channel is loading
   *
   * @param channel 載入通道
   * @returns 是否正在載入
   */
  public isChannelLoading(channel: LoadingChannel): boolean {
    const counters = this.loadingCounters();
    const count = counters.get(channel) || 0;
    return count > 0;
  }

  /**
   * 取得特定通道的載入計數
   * Get loading count for specific channel
   *
   * @param channel 載入通道
   * @returns 載入計數
   */
  public getChannelCount(channel: LoadingChannel): number {
    const counters = this.loadingCounters();
    return counters.get(channel) || 0;
  }

  /**
   * 取得所有通道的載入狀態
   * Get loading state for all channels
   *
   * @returns 通道載入狀態 Map
   */
  public getAllChannels(): Map<LoadingChannel, number> {
    return new Map(this.loadingCounters());
  }

  /**
   * 執行非同步操作並自動管理載入狀態
   * Execute async operation with automatic loading state management
   *
   * @param operation 非同步操作
   * @param channel 載入通道
   * @returns Promise
   *
   * 教學說明：
   * 這是一個便利方法，自動處理載入狀態的顯示和隱藏
   * 使用方式：
   * ```typescript
   * await loadingService.execute(async () => {
   *   return await apiService.getData();
   * });
   * ```
   */
  public async execute<T>(
    operation: () => Promise<T>,
    channel: LoadingChannel = 'global'
  ): Promise<T> {
    try {
      this.show(channel);
      return await operation();
    } finally {
      this.hide(channel);
    }
  }

  /**
   * 使用指定通道建立一個 computed Signal
   * Create a computed Signal for specific channel
   *
   * @param channel 載入通道
   * @returns 該通道的載入狀態 Signal
   *
   * 教學說明：
   * 允許元件訂閱特定通道的載入狀態
   */
  public createChannelSignal(channel: LoadingChannel) {
    return computed(() => {
      const counters = this.loadingCounters();
      const count = counters.get(channel) || 0;
      return count > 0;
    });
  }
}
