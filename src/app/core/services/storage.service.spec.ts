/**
 * 本地儲存服務測試
 * Local Storage Service Tests
 *
 * 教學重點 / Teaching Points:
 * 1. Angular 單元測試基礎
 * 2. 服務測試最佳實踐
 * 3. LocalStorage 模擬 (Mock)
 * 4. 測試覆蓋率和邊界條件
 */

import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockLocalStorage: Storage;
  let mockSessionStorage: Storage;

  /**
   * 建立模擬 Storage
   * Create mock Storage
   *
   * 教學說明：測試時需要模擬瀏覽器的 localStorage 和 sessionStorage
   */
  const createMockStorage = (): Storage => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string): string | null => {
        return store[key] || null;
      },
      setItem: (key: string, value: string): void => {
        store[key] = value;
      },
      removeItem: (key: string): void => {
        delete store[key];
      },
      clear: (): void => {
        store = {};
      },
      key: (index: number): string | null => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
      get length(): number {
        return Object.keys(store).length;
      },
    } as Storage;
  };

  /**
   * 測試前設定
   * Before each test setup
   *
   * 教學說明：beforeEach 會在每個測試案例前執行
   */
  beforeEach(() => {
    // 建立模擬 Storage
    mockLocalStorage = createMockStorage();
    mockSessionStorage = createMockStorage();

    // 覆蓋全域 localStorage 和 sessionStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });

    // 配置測試模組
    TestBed.configureTestingModule({
      providers: [StorageService],
    });

    // 取得服務實例
    service = TestBed.inject(StorageService);
  });

  /**
   * 測試後清理
   * After each test cleanup
   */
  afterEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  /**
   * 基本測試：服務是否成功建立
   * Basic test: Service should be created
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * 測試群組：基本操作
   * Test group: Basic operations
   */
  describe('Basic Operations', () => {
    /**
     * 測試：設定和取得字串
     * Test: Set and get string
     */
    it('should set and get a string value', () => {
      const key = 'testKey';
      const value = 'testValue';

      const result = service.set(key, value);
      expect(result).toBe(true);

      const retrieved = service.get<string>(key);
      expect(retrieved).toBe(value);
    });

    /**
     * 測試：設定和取得物件
     * Test: Set and get object
     */
    it('should set and get an object value', () => {
      const key = 'user';
      const value = { id: 1, name: 'John Doe', email: 'john@example.com' };

      service.set(key, value);
      const retrieved = service.get<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    /**
     * 測試：設定和取得陣列
     * Test: Set and get array
     */
    it('should set and get an array value', () => {
      const key = 'items';
      const value = [1, 2, 3, 4, 5];

      service.set(key, value);
      const retrieved = service.get<number[]>(key);

      expect(retrieved).toEqual(value);
    });

    /**
     * 測試：取得不存在的鍵值應返回 null
     * Test: Getting non-existent key should return null
     */
    it('should return null for non-existent key', () => {
      const retrieved = service.get('nonExistent');
      expect(retrieved).toBeNull();
    });

    /**
     * 測試：移除項目
     * Test: Remove item
     */
    it('should remove an item', () => {
      const key = 'toRemove';
      const value = 'value';

      service.set(key, value);
      expect(service.get(key)).toBe(value);

      service.remove(key);
      expect(service.get(key)).toBeNull();
    });

    /**
     * 測試：清空所有項目
     * Test: Clear all items
     */
    it('should clear all items', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      service.clear();

      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
      expect(service.get('key3')).toBeNull();
    });

    /**
     * 測試：檢查項目是否存在
     * Test: Check if item exists
     */
    it('should check if item exists', () => {
      const key = 'exists';
      const value = 'yes';

      expect(service.has(key)).toBe(false);

      service.set(key, value);
      expect(service.has(key)).toBe(true);

      service.remove(key);
      expect(service.has(key)).toBe(false);
    });
  });

  /**
   * 測試群組：TTL (Time To Live) 功能
   * Test group: TTL functionality
   */
  describe('TTL (Time To Live)', () => {
    /**
     * 測試：未過期的項目應可正常取得
     * Test: Non-expired item should be retrieved
     */
    it('should retrieve non-expired item', () => {
      const key = 'shortLived';
      const value = 'value';
      const ttl = 10000; // 10 seconds

      service.set(key, value, { ttl });
      const retrieved = service.get(key);

      expect(retrieved).toBe(value);
    });

    /**
     * 測試：過期的項目應返回 null
     * Test: Expired item should return null
     */
    it('should return null for expired item', () => {
      const key = 'expired';
      const value = 'value';
      const ttl = -1000; // Already expired (negative TTL)

      service.set(key, value, { ttl });
      const retrieved = service.get(key);

      expect(retrieved).toBeNull();
    });

    /**
     * 測試：清理過期項目
     * Test: Cleanup expired items
     */
    it('should cleanup expired items', () => {
      // Set items with different TTLs
      service.set('valid1', 'value1', { ttl: 10000 }); // Valid for 10s
      service.set('valid2', 'value2', { ttl: 10000 }); // Valid for 10s
      service.set('expired1', 'value3', { ttl: -1000 }); // Expired
      service.set('expired2', 'value4', { ttl: -1000 }); // Expired
      service.set('noTTL', 'value5'); // No TTL

      const count = service.cleanupExpired();

      // Should remove 2 expired items
      expect(count).toBe(2);
      expect(service.get('valid1')).toBe('value1');
      expect(service.get('valid2')).toBe('value2');
      expect(service.get('expired1')).toBeNull();
      expect(service.get('expired2')).toBeNull();
      expect(service.get('noTTL')).toBe('value5');
    });
  });

  /**
   * 測試群組：加密功能
   * Test group: Encryption functionality
   */
  describe('Encryption', () => {
    /**
     * 測試：加密儲存和讀取
     * Test: Encrypted storage and retrieval
     */
    it('should encrypt and decrypt data', () => {
      const key = 'secret';
      const value = { password: '123456', apiKey: 'abc-def-ghi' };

      service.set(key, value, { encrypt: true });

      // 直接從 localStorage 讀取應該是加密的
      const rawValue = mockLocalStorage.getItem(key);
      expect(rawValue).not.toContain('password');
      expect(rawValue).not.toContain('123456');

      // 透過 service 讀取應該正確解密
      const retrieved = service.get<typeof value>(key, { encrypt: true });
      expect(retrieved).toEqual(value);
    });

    /**
     * 測試：未使用正確選項無法讀取加密資料
     * Test: Cannot read encrypted data without correct option
     */
    it('should not decrypt without encryption option', () => {
      const key = 'encrypted';
      const value = 'secret value';

      service.set(key, value, { encrypt: true });

      // 嘗試不使用 encrypt 選項讀取
      const retrieved = service.get(key); // Without encrypt: true

      // 應該無法正確解密
      expect(retrieved).not.toBe(value);
    });
  });

  /**
   * 測試群組：Session Storage
   * Test group: Session Storage
   */
  describe('Session Storage', () => {
    /**
     * 測試：使用 sessionStorage
     * Test: Use sessionStorage
     */
    it('should use sessionStorage when specified', () => {
      const key = 'sessionKey';
      const value = 'sessionValue';

      service.set(key, value, { useSessionStorage: true });

      // 應該在 sessionStorage 中
      expect(mockSessionStorage.getItem(key)).toBeTruthy();
      // 不應該在 localStorage 中
      expect(mockLocalStorage.getItem(key)).toBeNull();

      // 應該能正確讀取
      const retrieved = service.get(key, { useSessionStorage: true });
      expect(retrieved).toBe(value);
    });

    /**
     * 測試：清空 sessionStorage
     * Test: Clear sessionStorage
     */
    it('should clear sessionStorage', () => {
      service.set('session1', 'value1', { useSessionStorage: true });
      service.set('session2', 'value2', { useSessionStorage: true });
      service.set('local1', 'value3'); // In localStorage

      service.clear('session');

      expect(service.get('session1', { useSessionStorage: true })).toBeNull();
      expect(service.get('session2', { useSessionStorage: true })).toBeNull();
      expect(service.get('local1')).toBe('value3'); // Should still exist
    });
  });

  /**
   * 測試群組：實用方法
   * Test group: Utility methods
   */
  describe('Utility Methods', () => {
    /**
     * 測試：取得所有鍵值
     * Test: Get all keys
     */
    it('should get all keys', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      const keys = service.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    /**
     * 測試：取得儲存大小
     * Test: Get storage size
     */
    it('should calculate storage size', () => {
      const key = 'sizeTest';
      const value = 'test value';

      service.set(key, value);
      const size = service.getSize();

      expect(size).toBeGreaterThan(0);
    });

    /**
     * 測試：檢查 Storage 可用性
     * Test: Check storage availability
     */
    it('should check storage availability', () => {
      const available = service.isAvailable();
      expect(available).toBe(true);
    });

    /**
     * 測試：取得剩餘空間
     * Test: Get remaining space
     */
    it('should calculate remaining space', () => {
      const remaining = service.getRemainingSpace();
      expect(remaining).toBeGreaterThan(0);
    });
  });

  /**
   * 測試群組：匯入/匯出
   * Test group: Import/Export
   */
  describe('Import/Export', () => {
    /**
     * 測試：匯出資料
     * Test: Export data
     */
    it('should export data to JSON', () => {
      service.set('export1', 'value1');
      service.set('export2', { nested: 'value2' });

      const exported = service.export();
      const parsed = JSON.parse(exported);

      expect(parsed['export1']).toBeTruthy();
      expect(parsed['export2']).toBeTruthy();
    });

    /**
     * 測試：匯入資料
     * Test: Import data
     */
    it('should import data from JSON', () => {
      const data = {
        import1: JSON.stringify({ value: 'test1', createdAt: Date.now() }),
        import2: JSON.stringify({ value: 'test2', createdAt: Date.now() }),
      };

      const jsonData = JSON.stringify(data);
      const result = service.import(jsonData);

      expect(result).toBe(true);
      expect(mockLocalStorage.getItem('import1')).toBeTruthy();
      expect(mockLocalStorage.getItem('import2')).toBeTruthy();
    });

    /**
     * 測試：匯入時清空現有資料
     * Test: Import with clear before
     */
    it('should clear existing data before import', () => {
      service.set('existing', 'value');

      const data = {
        new1: JSON.stringify({ value: 'test1', createdAt: Date.now() }),
      };

      const jsonData = JSON.stringify(data);
      service.import(jsonData, 'local', true);

      expect(service.get('existing')).toBeNull();
      expect(mockLocalStorage.getItem('new1')).toBeTruthy();
    });
  });

  /**
   * 測試群組：錯誤處理
   * Test group: Error handling
   */
  describe('Error Handling', () => {
    /**
     * 測試：處理無效的 JSON
     * Test: Handle invalid JSON
     */
    it('should handle invalid JSON gracefully', () => {
      // 直接設定無效的 JSON 到 localStorage
      mockLocalStorage.setItem('invalid', 'not a valid json');

      const result = service.get('invalid');
      expect(result).toBeNull();
    });

    /**
     * 測試：處理損壞的資料
     * Test: Handle corrupted data
     */
    it('should handle corrupted data', () => {
      // 設定部分有效的 JSON（缺少必要欄位）
      mockLocalStorage.setItem('corrupted', '{"incomplete": "data"}');

      const result = service.get('corrupted');
      // 應該不會拋出錯誤，而是返回 null 或處理錯誤
      expect(result).toBeDefined();
    });

    /**
     * 測試：匯入無效 JSON
     * Test: Import invalid JSON
     */
    it('should handle invalid JSON in import', () => {
      const invalidJson = 'not valid json';
      const result = service.import(invalidJson);

      expect(result).toBe(false);
    });
  });

  /**
   * 測試群組：邊界條件
   * Test group: Edge cases
   */
  describe('Edge Cases', () => {
    /**
     * 測試：處理空字串
     * Test: Handle empty string
     */
    it('should handle empty string', () => {
      const key = 'empty';
      const value = '';

      service.set(key, value);
      const retrieved = service.get<string>(key);

      expect(retrieved).toBe(value);
    });

    /**
     * 測試：處理 null 值
     * Test: Handle null value
     */
    it('should handle null value', () => {
      const key = 'null';
      const value = null;

      service.set(key, value);
      const retrieved = service.get(key);

      expect(retrieved).toBeNull();
    });

    /**
     * 測試：處理 undefined 值
     * Test: Handle undefined value
     */
    it('should handle undefined value', () => {
      const key = 'undefined';
      const value = undefined;

      service.set(key, value);
      const retrieved = service.get(key);

      // undefined 會被序列化，所以應該能取得
      expect(retrieved).toBeDefined();
    });

    /**
     * 測試：處理大型物件
     * Test: Handle large object
     */
    it('should handle large objects', () => {
      const key = 'large';
      const value = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
        })),
      };

      service.set(key, value);
      const retrieved = service.get<typeof value>(key);

      expect(retrieved?.items.length).toBe(100);
      expect(retrieved).toEqual(value);
    });

    /**
     * 測試：處理特殊字元
     * Test: Handle special characters
     */
    it('should handle special characters', () => {
      const key = 'special';
      const value = {
        text: '特殊字元 ❤️ 🎉 \n\t"quotes" \'apostrophes\'',
        emoji: '😀🎨🌐',
      };

      service.set(key, value);
      const retrieved = service.get<typeof value>(key);

      expect(retrieved).toEqual(value);
    });
  });
});
