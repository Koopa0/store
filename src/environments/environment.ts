/**
 * 開發環境配置
 * Development Environment Configuration
 *
 * 這個檔案包含開發環境的配置設定
 * This file contains configuration settings for the development environment
 */
export const environment = {
  /**
   * 是否為生產環境
   * Whether this is a production environment
   */
  production: false,

  /**
   * API 基礎 URL
   * Base URL for API endpoints
   */
  apiUrl: 'http://localhost:3000/api',

  /**
   * 應用程式名稱
   * Application name
   */
  appName: 'Koopa Store',

  /**
   * 應用程式版本
   * Application version
   */
  version: '1.0.0',

  /**
   * 預設語言
   * Default language
   * 'zh-TW': 繁體中文（台灣）
   * 'en': English
   */
  defaultLanguage: 'zh-TW',

  /**
   * 支援的語言列表
   * List of supported languages
   */
  supportedLanguages: ['zh-TW', 'en'],

  /**
   * 預設主題模式
   * Default theme mode
   * 'light': 亮色模式
   * 'dark': 暗色模式
   * 'auto': 跟隨系統設定
   */
  defaultTheme: 'auto' as 'light' | 'dark' | 'auto',

  /**
   * 分頁設定
   * Pagination settings
   */
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  /**
   * 快取設定（毫秒）
   * Cache settings (in milliseconds)
   */
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 分鐘 / 5 minutes
  },

  /**
   * 功能開關
   * Feature flags
   */
  features: {
    enableReviews: true,
    enableNotifications: true,
    enableWishlist: true,
    enableCompare: true,
  },
};

/**
 * 環境配置型別
 * Type for environment configuration
 */
export type Environment = typeof environment;
