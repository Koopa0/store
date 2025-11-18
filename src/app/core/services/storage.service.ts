/**
 * 本地儲存服務
 * Local Storage Service
 *
 * 提供類型安全的 localStorage/sessionStorage 包裝器
 * Provides type-safe wrapper for localStorage/sessionStorage
 *
 * 教學重點 / Teaching Points:
 * 1. 類型安全的儲存操作
 * 2. 自動序列化/反序列化
 * 3. TTL (Time To Live) 過期機制
 * 4. 敏感資料加密支援
 * 5. Signal-based 變更偵測
 * 6. 錯誤處理和降級策略
 */

import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 儲存項目介面
 * Storage item interface
 *
 * 教學說明：包裝實際資料，添加中繼資料
 */
interface StorageItem<T> {
  /**
   * 實際儲存的資料
   * Actual data to store
   */
  value: T;

  /**
   * 過期時間戳記（毫秒）
   * Expiration timestamp in milliseconds
   */
  expiresAt?: number;

  /**
   * 是否加密
   * Whether the data is encrypted
   */
  encrypted?: boolean;

  /**
   * 建立時間戳記
   * Creation timestamp
   */
  createdAt: number;
}

/**
 * 儲存選項
 * Storage options
 */
interface StorageOptions {
  /**
   * 過期時間（毫秒）
   * Time to live in milliseconds
   */
  ttl?: number;

  /**
   * 是否加密（敏感資料建議加密）
   * Whether to encrypt (recommended for sensitive data)
   */
  encrypt?: boolean;

  /**
   * 使用 sessionStorage 而非 localStorage
   * Use sessionStorage instead of localStorage
   */
  useSessionStorage?: boolean;
}

/**
 * 儲存類型
 * Storage type
 */
type StorageType = 'local' | 'session';

@Injectable({
  providedIn: 'root', // 單例服務
})
export class StorageService {
  /**
   * 平台 ID（用於檢查是否在瀏覽器環境）
   * Platform ID (to check if running in browser)
   */
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * 是否在瀏覽器環境
   * Whether running in browser
   */
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * 儲存變更 Signal
   * Storage change Signal
   *
   * 教學說明：使用 Map 追蹤各個 key 的變更
   */
  private readonly storageChanges = signal<Map<string, unknown>>(new Map());

  /**
   * 簡單的加密金鑰（生產環境應使用更安全的方式）
   * Simple encryption key (should use more secure method in production)
   *
   * 教學說明：這只是示範用途，實際應用應使用：
   * 1. Web Crypto API
   * 2. 環境變數中的金鑰
   * 3. 後端提供的加密服務
   */
  private readonly encryptionKey = 'koopa-store-secret-key-2025';

  constructor() {
    // 監聽 storage 事件（跨分頁同步）
    if (this.isBrowser) {
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
    }

    console.log('[StorageService] Initialized');
  }

  /**
   * 設定項目
   * Set item
   *
   * @param key 鍵值
   * @param value 資料
   * @param options 選項
   *
   * 教學說明：
   * 1. 自動序列化物件為 JSON
   * 2. 支援 TTL 過期時間
   * 3. 支援敏感資料加密
   * 4. 更新 Signal 觸發變更偵測
   */
  public set<T>(key: string, value: T, options?: StorageOptions): boolean {
    if (!this.isBrowser) {
      console.warn('[StorageService] Not in browser environment');
      return false;
    }

    try {
      // 建立儲存項目
      const item: StorageItem<T> = {
        value,
        createdAt: Date.now(),
      };

      // 設定過期時間
      if (options?.ttl) {
        item.expiresAt = Date.now() + options.ttl;
      }

      // 序列化資料
      let serializedValue = JSON.stringify(item);

      // 加密（如果需要）
      if (options?.encrypt) {
        serializedValue = this.encrypt(serializedValue);
        item.encrypted = true;
      }

      // 選擇儲存位置
      const storage = this.getStorage(
        options?.useSessionStorage ? 'session' : 'local'
      );

      // 儲存資料
      storage.setItem(key, serializedValue);

      // 更新 Signal
      this.updateStorageSignal(key, value);

      console.log(`[StorageService] Set item: ${key}`);
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to set item:', error);
      return false;
    }
  }

  /**
   * 取得項目
   * Get item
   *
   * @param key 鍵值
   * @param options 選項
   * @returns 資料或 null
   *
   * 教學說明：
   * 1. 自動反序列化 JSON
   * 2. 檢查是否過期
   * 3. 自動解密
   * 4. 類型安全的回傳值
   */
  public get<T>(key: string, options?: StorageOptions): T | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      // 選擇儲存位置
      const storage = this.getStorage(
        options?.useSessionStorage ? 'session' : 'local'
      );

      // 讀取資料
      let serializedValue = storage.getItem(key);
      if (!serializedValue) {
        return null;
      }

      // 解密（如果需要）
      if (options?.encrypt) {
        serializedValue = this.decrypt(serializedValue);
      }

      // 反序列化
      const item: StorageItem<T> = JSON.parse(serializedValue);

      // 檢查是否過期
      if (item.expiresAt && Date.now() > item.expiresAt) {
        console.log(`[StorageService] Item expired: ${key}`);
        this.remove(key, options);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('[StorageService] Failed to get item:', error);
      return null;
    }
  }

  /**
   * 移除項目
   * Remove item
   *
   * @param key 鍵值
   * @param options 選項
   */
  public remove(key: string, options?: StorageOptions): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      const storage = this.getStorage(
        options?.useSessionStorage ? 'session' : 'local'
      );
      storage.removeItem(key);

      // 更新 Signal
      this.updateStorageSignal(key, undefined);

      console.log(`[StorageService] Removed item: ${key}`);
    } catch (error) {
      console.error('[StorageService] Failed to remove item:', error);
    }
  }

  /**
   * 清空所有項目
   * Clear all items
   *
   * @param storageType 儲存類型
   */
  public clear(storageType: StorageType = 'local'): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      const storage = this.getStorage(storageType);
      storage.clear();

      // 清空 Signal
      this.storageChanges.set(new Map());

      console.log(`[StorageService] Cleared ${storageType} storage`);
    } catch (error) {
      console.error('[StorageService] Failed to clear storage:', error);
    }
  }

  /**
   * 檢查項目是否存在
   * Check if item exists
   *
   * @param key 鍵值
   * @param options 選項
   * @returns 是否存在
   */
  public has(key: string, options?: StorageOptions): boolean {
    return this.get(key, options) !== null;
  }

  /**
   * 取得所有鍵值
   * Get all keys
   *
   * @param storageType 儲存類型
   * @returns 鍵值陣列
   */
  public keys(storageType: StorageType = 'local'): string[] {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const storage = this.getStorage(storageType);
      return Object.keys(storage);
    } catch (error) {
      console.error('[StorageService] Failed to get keys:', error);
      return [];
    }
  }

  /**
   * 取得儲存大小（位元組）
   * Get storage size in bytes
   *
   * @param storageType 儲存類型
   * @returns 大小（位元組）
   *
   * 教學說明：localStorage 通常有 5-10MB 限制
   */
  public getSize(storageType: StorageType = 'local'): number {
    if (!this.isBrowser) {
      return 0;
    }

    try {
      const storage = this.getStorage(storageType);
      let size = 0;

      for (const key in storage) {
        if (storage.hasOwnProperty(key)) {
          const value = storage.getItem(key);
          if (value) {
            // 計算 UTF-16 編碼的位元組數（每字元 2 位元組）
            size += key.length + value.length;
          }
        }
      }

      return size * 2; // UTF-16 uses 2 bytes per character
    } catch (error) {
      console.error('[StorageService] Failed to get size:', error);
      return 0;
    }
  }

  /**
   * 取得剩餘空間（位元組）
   * Get remaining space in bytes
   *
   * @param storageType 儲存類型
   * @returns 剩餘空間（位元組）
   */
  public getRemainingSpace(storageType: StorageType = 'local'): number {
    // 大部分瀏覽器的 localStorage 限制為 5MB
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    return MAX_SIZE - this.getSize(storageType);
  }

  /**
   * 監聽特定鍵值的變更
   * Watch for changes to a specific key
   *
   * @param key 鍵值
   * @param callback 回調函數
   * @returns 取消監聽的函數
   *
   * 教學說明：使用 effect() 監聽 Signal 變更
   */
  public watch<T>(key: string, callback: (value: T | undefined) => void): () => void {
    const effectRef = effect(() => {
      const changes = this.storageChanges();
      if (changes.has(key)) {
        callback(changes.get(key) as T | undefined);
      }
    });

    // 返回清理函數
    return () => effectRef.destroy();
  }

  /**
   * 清理過期項目
   * Clean up expired items
   *
   * @param storageType 儲存類型
   * @returns 清理的項目數量
   *
   * 教學說明：定期呼叫此方法可以清理過期資料
   */
  public cleanupExpired(storageType: StorageType = 'local'): number {
    if (!this.isBrowser) {
      return 0;
    }

    let count = 0;

    try {
      const storage = this.getStorage(storageType);
      const keys = Object.keys(storage);

      for (const key of keys) {
        const serializedValue = storage.getItem(key);
        if (!serializedValue) continue;

        try {
          const item: StorageItem<unknown> = JSON.parse(serializedValue);

          // 檢查是否過期
          if (item.expiresAt && Date.now() > item.expiresAt) {
            storage.removeItem(key);
            count++;
          }
        } catch {
          // 如果解析失敗，可能是舊資料或損壞資料，跳過
          continue;
        }
      }

      console.log(`[StorageService] Cleaned up ${count} expired items`);
      return count;
    } catch (error) {
      console.error('[StorageService] Failed to cleanup expired items:', error);
      return 0;
    }
  }

  /**
   * 取得 Storage 實例
   * Get Storage instance
   *
   * @param type 儲存類型
   * @returns Storage 實例
   */
  private getStorage(type: StorageType): Storage {
    return type === 'session' ? sessionStorage : localStorage;
  }

  /**
   * 更新 Storage Signal
   * Update storage Signal
   *
   * @param key 鍵值
   * @param value 資料
   */
  private updateStorageSignal(key: string, value: unknown): void {
    const changes = new Map(this.storageChanges());
    if (value === undefined) {
      changes.delete(key);
    } else {
      changes.set(key, value);
    }
    this.storageChanges.set(changes);
  }

  /**
   * 處理 Storage 事件（跨分頁同步）
   * Handle storage event (cross-tab synchronization)
   *
   * @param event StorageEvent
   *
   * 教學說明：當其他分頁修改 localStorage 時會觸發此事件
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (!event.key) return;

    console.log(`[StorageService] Storage changed in another tab: ${event.key}`);

    try {
      if (event.newValue) {
        const item: StorageItem<unknown> = JSON.parse(event.newValue);
        this.updateStorageSignal(event.key, item.value);
      } else {
        this.updateStorageSignal(event.key, undefined);
      }
    } catch (error) {
      console.error('[StorageService] Failed to handle storage event:', error);
    }
  }

  /**
   * 加密資料
   * Encrypt data
   *
   * @param data 原始資料
   * @returns 加密後的資料
   *
   * 教學說明：這是簡化版本，生產環境應使用：
   * 1. Web Crypto API (AES-GCM)
   * 2. 更安全的金鑰管理
   * 3. 初始化向量 (IV)
   */
  private encrypt(data: string): string {
    // 簡單的 Base64 + XOR 加密（僅供教學示範）
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
      encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted); // Base64 編碼
  }

  /**
   * 解密資料
   * Decrypt data
   *
   * @param encryptedData 加密的資料
   * @returns 解密後的資料
   */
  private decrypt(encryptedData: string): string {
    // 解密（與加密過程相反）
    const decoded = atob(encryptedData); // Base64 解碼
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  }

  /**
   * 檢查 Storage 是否可用
   * Check if storage is available
   *
   * @param type 儲存類型
   * @returns 是否可用
   *
   * 教學說明：某些情況下 localStorage 可能被停用（隱私模式、配額已滿等）
   */
  public isAvailable(type: StorageType = 'local'): boolean {
    if (!this.isBrowser) {
      return false;
    }

    try {
      const storage = this.getStorage(type);
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 匯出所有資料（用於備份）
   * Export all data (for backup)
   *
   * @param storageType 儲存類型
   * @returns JSON 字串
   */
  public export(storageType: StorageType = 'local'): string {
    if (!this.isBrowser) {
      return '{}';
    }

    try {
      const storage = this.getStorage(storageType);
      const data: Record<string, string> = {};

      for (const key in storage) {
        if (storage.hasOwnProperty(key)) {
          const value = storage.getItem(key);
          if (value) {
            data[key] = value;
          }
        }
      }

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('[StorageService] Failed to export data:', error);
      return '{}';
    }
  }

  /**
   * 匯入資料（從備份還原）
   * Import data (restore from backup)
   *
   * @param jsonData JSON 字串
   * @param storageType 儲存類型
   * @param clearBefore 是否先清空現有資料
   */
  public import(
    jsonData: string,
    storageType: StorageType = 'local',
    clearBefore = false
  ): boolean {
    if (!this.isBrowser) {
      return false;
    }

    try {
      const data: Record<string, string> = JSON.parse(jsonData);
      const storage = this.getStorage(storageType);

      if (clearBefore) {
        storage.clear();
      }

      for (const [key, value] of Object.entries(data)) {
        storage.setItem(key, value);
      }

      console.log('[StorageService] Data imported successfully');
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to import data:', error);
      return false;
    }
  }

  /**
   * 清理資源
   * Clean up resources
   */
  public ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('storage', this.handleStorageEvent.bind(this));
      console.log('[StorageService] Cleaned up');
    }
  }
}
