/**
 * 生產環境配置
 * Production Environment Configuration
 *
 * 這個檔案包含生產環境的配置設定
 * This file contains configuration settings for the production environment
 */
import { Environment } from './environment';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.koopastore.com/api',
  appName: 'Koopa Store',
  version: '1.0.0',
  defaultLanguage: 'zh-TW',
  supportedLanguages: ['zh-TW', 'en'],
  defaultTheme: 'auto',
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },
  cache: {
    defaultTTL: 10 * 60 * 1000, // 生產環境使用較長的快取時間 / Longer cache in production
  },
  features: {
    enableReviews: true,
    enableNotifications: true,
    enableWishlist: true,
    enableCompare: true,
  },
};
