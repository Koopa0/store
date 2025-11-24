/**
 * 商品服務
 * Product Service
 *
 * 管理商品資料的 CRUD 操作
 * Manages product data CRUD operations
 *
 * 教學重點 / Teaching Points:
 * 1. RESTful API 服務模式
 * 2. Observable 和 RxJS 操作符
 * 3. Signal-based 狀態管理
 * 4. 分頁處理
 * 5. Mock 資料模擬
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ProductListItem,
  ProductListParams,
  ProductStatus,
  ProductVariant,
  ProductVariantConfig,
  VariantOption,
  VariantOptionValue,
} from '@core/models/product.model';
import { PaginatedResponse, ApiResponse } from '@core/models/common.model';

/**
 * Mock 商品資料 (擴充版 - 30 個商品涵蓋 8 大分類)
 * Mock product data (Extended - 30 products across 8 categories)
 */
const MOCK_PRODUCTS: ProductListItem[] = [
  // ==================== 智慧型手機 (Smartphones) ====================
  {
    id: '1',
    sku: 'IPH15PM-256-BLK',
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    summary: 'Apple 最強旗艦手機，鈦金屬設計',
    price: 36900,
    comparePrice: 39900,
    stockQuantity: 50,
    isActive: true,
    isFeatured: true,
    categoryName: '智慧型手機',
    categoryPath: 'smartphones',
    brandName: 'Apple',
    ratingAverage: 4.8,
    reviewCount: 256,
    totalSold: 1520,
    totalRevenue: 36900 * 1520,
    primaryImageUrl: 'https://picsum.photos/seed/iphone15pro/400/400',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '2',
    sku: 'SGS24U-256-GRY',
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    summary: 'Android 最強旗艦，內建 S Pen',
    price: 35900,
    comparePrice: 38900,
    stockQuantity: 30,
    isActive: true,
    isFeatured: true,
    categoryName: '智慧型手機',
    categoryPath: 'smartphones',
    brandName: 'Samsung',
    ratingAverage: 4.7,
    reviewCount: 189,
    totalSold: 980,
    totalRevenue: 35900 * 980,
    primaryImageUrl: 'https://picsum.photos/seed/galaxys24/400/400',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '6',
    sku: 'PIX8P-256-OBS',
    name: 'Google Pixel 8 Pro',
    slug: 'google-pixel-8-pro',
    summary: 'Google AI 旗艦機，拍照王者',
    price: 31900,
    comparePrice: 33900,
    stockQuantity: 40,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧型手機',
    categoryPath: 'smartphones',
    brandName: 'Google',
    ratingAverage: 4.6,
    reviewCount: 145,
    totalSold: 680,
    totalRevenue: 31900 * 680,
    primaryImageUrl: 'https://picsum.photos/seed/pixel8pro/400/400',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '7',
    sku: 'XIU13P-256-BLU',
    name: '小米 13 Pro',
    slug: 'xiaomi-13-pro',
    summary: '旗艦性能，徠卡調校相機',
    price: 24900,
    comparePrice: undefined,
    stockQuantity: 60,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧型手機',
    categoryPath: 'smartphones',
    brandName: 'Xiaomi',
    ratingAverage: 4.5,
    reviewCount: 98,
    totalSold: 520,
    totalRevenue: 24900 * 520,
    primaryImageUrl: 'https://picsum.photos/seed/xiaomi13pro/400/400',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '8',
    sku: 'OPF5-256-GRN',
    name: 'OPPO Find X5 Pro',
    slug: 'oppo-find-x5-pro',
    summary: '超高速充電，哈蘇相機',
    price: 28900,
    comparePrice: 31900,
    stockQuantity: 35,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧型手機',
    categoryPath: 'smartphones',
    brandName: 'OPPO',
    ratingAverage: 4.4,
    reviewCount: 76,
    totalSold: 380,
    totalRevenue: 28900 * 380,
    primaryImageUrl: 'https://picsum.photos/seed/oppofindx5/400/400',
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '9',
    sku: 'IPH14-128-BLU',
    name: 'iPhone 14',
    slug: 'iphone-14',
    summary: '經典 iPhone，超值選擇',
    price: 24900,
    comparePrice: 27900,
    stockQuantity: 80,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧型手機',
    categoryPath: 'smartphones',
    brandName: 'Apple',
    ratingAverage: 4.7,
    reviewCount: 342,
    totalSold: 1850,
    totalRevenue: 24900 * 1850,
    primaryImageUrl: 'https://picsum.photos/seed/iphone14/400/400',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-01'),
  },

  // ==================== 筆記型電腦 (Laptops) ====================
  {
    id: '3',
    sku: 'MBP14-M3-512',
    name: 'MacBook Pro 14" M3',
    slug: 'macbook-pro-14-m3',
    summary: '專業創作者首選，M3 晶片效能爆表',
    price: 59900,
    comparePrice: 62900,
    stockQuantity: 15,
    isActive: true,
    isFeatured: true,
    categoryName: '筆記型電腦',
    categoryPath: 'laptops',
    brandName: 'Apple',
    ratingAverage: 4.9,
    reviewCount: 342,
    totalSold: 1200,
    totalRevenue: 59900 * 1200,
    primaryImageUrl: 'https://picsum.photos/seed/macbookpro14/400/400',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '10',
    sku: 'MBA15-M2-256',
    name: 'MacBook Air 15" M2',
    slug: 'macbook-air-15-m2',
    summary: '大螢幕超薄筆電，續航力驚人',
    price: 42900,
    comparePrice: 45900,
    stockQuantity: 25,
    isActive: true,
    isFeatured: false,
    categoryName: '筆記型電腦',
    categoryPath: 'laptops',
    brandName: 'Apple',
    ratingAverage: 4.8,
    reviewCount: 256,
    totalSold: 980,
    totalRevenue: 42900 * 980,
    primaryImageUrl: 'https://picsum.photos/seed/macbookair15/400/400',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '11',
    sku: 'DELL-XPS13-512',
    name: 'Dell XPS 13',
    slug: 'dell-xps-13',
    summary: 'Windows 旗艦筆電，InfinityEdge 顯示器',
    price: 38900,
    comparePrice: undefined,
    stockQuantity: 20,
    isActive: true,
    isFeatured: false,
    categoryName: '筆記型電腦',
    categoryPath: 'laptops',
    brandName: 'Dell',
    ratingAverage: 4.6,
    reviewCount: 189,
    totalSold: 650,
    totalRevenue: 38900 * 650,
    primaryImageUrl: 'https://picsum.photos/seed/dellxps13/400/400',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '12',
    sku: 'ASUS-ZB14-1TB',
    name: 'ASUS ZenBook 14 OLED',
    slug: 'asus-zenbook-14-oled',
    summary: '輕薄 OLED 筆電，商務首選',
    price: 32900,
    comparePrice: 35900,
    stockQuantity: 30,
    isActive: true,
    isFeatured: false,
    categoryName: '筆記型電腦',
    categoryPath: 'laptops',
    brandName: 'ASUS',
    ratingAverage: 4.5,
    reviewCount: 142,
    totalSold: 480,
    totalRevenue: 32900 * 480,
    primaryImageUrl: 'https://picsum.photos/seed/zenbook14/400/400',
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '13',
    sku: 'LGG16-RTX4060',
    name: 'LG Gram 16',
    slug: 'lg-gram-16',
    summary: '超輕量 16 吋，僅 1.19kg',
    price: 45900,
    comparePrice: undefined,
    stockQuantity: 18,
    isActive: true,
    isFeatured: false,
    categoryName: '筆記型電腦',
    categoryPath: 'laptops',
    brandName: 'LG',
    ratingAverage: 4.7,
    reviewCount: 98,
    totalSold: 320,
    totalRevenue: 45900 * 320,
    primaryImageUrl: 'https://picsum.photos/seed/lggram16/400/400',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-11-01'),
  },

  // ==================== 耳機音響 (Audio) ====================
  {
    id: '4',
    sku: 'APP2-WHT',
    name: 'AirPods Pro (第 2 代)',
    slug: 'airpods-pro-2',
    summary: '主動降噪，空間音訊',
    price: 7490,
    comparePrice: 7990,
    stockQuantity: 100,
    isActive: true,
    isFeatured: true,
    categoryName: '耳機音響',
    categoryPath: 'audio',
    brandName: 'Apple',
    ratingAverage: 4.6,
    reviewCount: 523,
    totalSold: 3200,
    totalRevenue: 7490 * 3200,
    primaryImageUrl: 'https://picsum.photos/seed/airpodspro2/400/400',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '5',
    sku: 'SONY-WH1000XM5-BLK',
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    summary: '業界最強降噪，30 小時續航',
    price: 11990,
    comparePrice: 12990,
    stockQuantity: 45,
    isActive: true,
    isFeatured: true,
    categoryName: '耳機音響',
    categoryPath: 'audio',
    brandName: 'Sony',
    ratingAverage: 4.8,
    reviewCount: 412,
    totalSold: 1850,
    totalRevenue: 11990 * 1850,
    primaryImageUrl: 'https://picsum.photos/seed/sonywh1000xm5/400/400',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '14',
    sku: 'BOSE-QC45-BLK',
    name: 'Bose QuietComfort 45',
    slug: 'bose-qc45',
    summary: 'Bose 經典降噪，舒適配戴',
    price: 9990,
    comparePrice: 10990,
    stockQuantity: 55,
    isActive: true,
    isFeatured: false,
    categoryName: '耳機音響',
    categoryPath: 'audio',
    brandName: 'Bose',
    ratingAverage: 4.7,
    reviewCount: 298,
    totalSold: 1120,
    totalRevenue: 9990 * 1120,
    primaryImageUrl: 'https://picsum.photos/seed/boseqc45/400/400',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '15',
    sku: 'BEATS-SP-RED',
    name: 'Beats Studio Pro',
    slug: 'beats-studio-pro',
    summary: '潮流設計，空間音訊',
    price: 8990,
    comparePrice: undefined,
    stockQuantity: 70,
    isActive: true,
    isFeatured: false,
    categoryName: '耳機音響',
    categoryPath: 'audio',
    brandName: 'Beats',
    ratingAverage: 4.4,
    reviewCount: 186,
    totalSold: 890,
    totalRevenue: 8990 * 890,
    primaryImageUrl: 'https://picsum.photos/seed/beatsstudio/400/400',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-11-01'),
  },

  // ==================== 平板電腦 (Tablets) ====================
  {
    id: '16',
    sku: 'IPD-PRO11-M2',
    name: 'iPad Pro 11" M2',
    slug: 'ipad-pro-11-m2',
    summary: '專業級平板，M2 晶片',
    price: 28900,
    comparePrice: 30900,
    stockQuantity: 35,
    isActive: true,
    isFeatured: false,
    categoryName: '平板電腦',
    categoryPath: 'tablets',
    brandName: 'Apple',
    ratingAverage: 4.8,
    reviewCount: 234,
    totalSold: 780,
    totalRevenue: 28900 * 780,
    primaryImageUrl: 'https://picsum.photos/seed/ipadpro11/400/400',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '17',
    sku: 'IPD-AIR-M1',
    name: 'iPad Air (M1)',
    slug: 'ipad-air-m1',
    summary: '輕薄強大，多彩選擇',
    price: 19900,
    comparePrice: 21900,
    stockQuantity: 50,
    isActive: true,
    isFeatured: false,
    categoryName: '平板電腦',
    categoryPath: 'tablets',
    brandName: 'Apple',
    ratingAverage: 4.7,
    reviewCount: 189,
    totalSold: 1020,
    totalRevenue: 19900 * 1020,
    primaryImageUrl: 'https://picsum.photos/seed/ipadair/400/400',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '18',
    sku: 'SGT-S9-256',
    name: 'Samsung Galaxy Tab S9',
    slug: 'samsung-tab-s9',
    summary: 'Android 旗艦平板，AMOLED 螢幕',
    price: 24900,
    comparePrice: undefined,
    stockQuantity: 40,
    isActive: true,
    isFeatured: false,
    categoryName: '平板電腦',
    categoryPath: 'tablets',
    brandName: 'Samsung',
    ratingAverage: 4.6,
    reviewCount: 142,
    totalSold: 560,
    totalRevenue: 24900 * 560,
    primaryImageUrl: 'https://picsum.photos/seed/galaxytabs9/400/400',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-11-01'),
  },

  // ==================== 智慧手錶 (Smart Watches) ====================
  {
    id: '19',
    sku: 'AW9-45-GPS',
    name: 'Apple Watch Series 9',
    slug: 'apple-watch-9',
    summary: '健康監測，雙擊手勢',
    price: 12900,
    comparePrice: 13900,
    stockQuantity: 60,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧手錶',
    categoryPath: 'smartwatches',
    brandName: 'Apple',
    ratingAverage: 4.7,
    reviewCount: 298,
    totalSold: 1420,
    totalRevenue: 12900 * 1420,
    primaryImageUrl: 'https://picsum.photos/seed/applewatch9/400/400',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '20',
    sku: 'SGW6-44-BLK',
    name: 'Samsung Galaxy Watch 6',
    slug: 'samsung-watch-6',
    summary: 'Wear OS 智慧錶，睡眠追蹤',
    price: 9900,
    comparePrice: 10900,
    stockQuantity: 50,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧手錶',
    categoryPath: 'smartwatches',
    brandName: 'Samsung',
    ratingAverage: 4.5,
    reviewCount: 176,
    totalSold: 680,
    totalRevenue: 9900 * 680,
    primaryImageUrl: 'https://picsum.photos/seed/galaxywatch6/400/400',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '21',
    sku: 'GRF7-45-GRY',
    name: 'Garmin Forerunner 965',
    slug: 'garmin-forerunner-965',
    summary: '專業跑錶，AMOLED 螢幕',
    price: 19900,
    comparePrice: undefined,
    stockQuantity: 25,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧手錶',
    categoryPath: 'smartwatches',
    brandName: 'Garmin',
    ratingAverage: 4.8,
    reviewCount: 142,
    totalSold: 380,
    totalRevenue: 19900 * 380,
    primaryImageUrl: 'https://picsum.photos/seed/garmin965/400/400',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-01'),
  },

  // ==================== 相機攝影 (Cameras) ====================
  {
    id: '22',
    sku: 'SON-A7M4-BODY',
    name: 'Sony A7 IV',
    slug: 'sony-a7-iv',
    summary: '全片幅無反，3300 萬畫素',
    price: 69900,
    comparePrice: undefined,
    stockQuantity: 15,
    isActive: true,
    isFeatured: false,
    categoryName: '相機攝影',
    categoryPath: 'cameras',
    brandName: 'Sony',
    ratingAverage: 4.9,
    reviewCount: 189,
    totalSold: 420,
    totalRevenue: 69900 * 420,
    primaryImageUrl: 'https://picsum.photos/seed/sonya7iv/400/400',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '23',
    sku: 'CAN-R6M2-BODY',
    name: 'Canon EOS R6 Mark II',
    slug: 'canon-r6-mark-ii',
    summary: 'Canon 無反旗艦，4K60p 錄影',
    price: 79900,
    comparePrice: undefined,
    stockQuantity: 12,
    isActive: true,
    isFeatured: false,
    categoryName: '相機攝影',
    categoryPath: 'cameras',
    brandName: 'Canon',
    ratingAverage: 4.8,
    reviewCount: 156,
    totalSold: 320,
    totalRevenue: 79900 * 320,
    primaryImageUrl: 'https://picsum.photos/seed/canonr6m2/400/400',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '24',
    sku: 'FUJ-XT5-BODY',
    name: 'Fujifilm X-T5',
    slug: 'fujifilm-xt5',
    summary: '復古造型，4000 萬畫素',
    price: 54900,
    comparePrice: 57900,
    stockQuantity: 20,
    isActive: true,
    isFeatured: false,
    categoryName: '相機攝影',
    categoryPath: 'cameras',
    brandName: 'Fujifilm',
    ratingAverage: 4.7,
    reviewCount: 128,
    totalSold: 280,
    totalRevenue: 54900 * 280,
    primaryImageUrl: 'https://picsum.photos/seed/fujixt5/400/400',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-01'),
  },

  // ==================== 遊戲主機 (Gaming) ====================
  {
    id: '25',
    sku: 'PS5-SLIM-1TB',
    name: 'PlayStation 5 Slim',
    slug: 'playstation-5-slim',
    summary: 'Sony 次世代主機，更輕薄設計',
    price: 15980,
    comparePrice: undefined,
    stockQuantity: 30,
    isActive: true,
    isFeatured: false,
    categoryName: '遊戲主機',
    categoryPath: 'gaming',
    brandName: 'Sony',
    ratingAverage: 4.8,
    reviewCount: 412,
    totalSold: 2100,
    totalRevenue: 15980 * 2100,
    primaryImageUrl: 'https://picsum.photos/seed/ps5slim/400/400',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '26',
    sku: 'XSX-1TB-BLK',
    name: 'Xbox Series X',
    slug: 'xbox-series-x',
    summary: 'Microsoft 旗艦主機，4K 120fps',
    price: 14980,
    comparePrice: undefined,
    stockQuantity: 35,
    isActive: true,
    isFeatured: false,
    categoryName: '遊戲主機',
    categoryPath: 'gaming',
    brandName: 'Microsoft',
    ratingAverage: 4.7,
    reviewCount: 298,
    totalSold: 1580,
    totalRevenue: 14980 * 1580,
    primaryImageUrl: 'https://picsum.photos/seed/xboxseriesx/400/400',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '27',
    sku: 'NSW-OLED-WHT',
    name: 'Nintendo Switch OLED',
    slug: 'switch-oled',
    summary: '任天堂 OLED 版，攜帶型主機',
    price: 10780,
    comparePrice: undefined,
    stockQuantity: 50,
    isActive: true,
    isFeatured: false,
    categoryName: '遊戲主機',
    categoryPath: 'gaming',
    brandName: 'Nintendo',
    ratingAverage: 4.6,
    reviewCount: 567,
    totalSold: 3200,
    totalRevenue: 10780 * 3200,
    primaryImageUrl: 'https://picsum.photos/seed/switcholed/400/400',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-11-01'),
  },

  // ==================== 智慧家居 (Smart Home) ====================
  {
    id: '28',
    sku: 'HPM-WHT',
    name: 'HomePod mini',
    slug: 'homepod-mini',
    summary: 'Apple 智慧音箱，空間音訊',
    price: 3000,
    comparePrice: undefined,
    stockQuantity: 100,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧家居',
    categoryPath: 'smart-home',
    brandName: 'Apple',
    ratingAverage: 4.5,
    reviewCount: 234,
    totalSold: 1890,
    totalRevenue: 3000 * 1890,
    primaryImageUrl: 'https://picsum.photos/seed/homepodmini/400/400',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '29',
    sku: 'ECHO4-BLK',
    name: 'Amazon Echo (第 4 代)',
    slug: 'amazon-echo-4',
    summary: 'Alexa 智慧音箱，球形設計',
    price: 2990,
    comparePrice: 3490,
    stockQuantity: 80,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧家居',
    categoryPath: 'smart-home',
    brandName: 'Amazon',
    ratingAverage: 4.4,
    reviewCount: 412,
    totalSold: 2100,
    totalRevenue: 2990 * 2100,
    primaryImageUrl: 'https://picsum.photos/seed/echo4/400/400',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '30',
    sku: 'NEST-HUB2-GRY',
    name: 'Google Nest Hub (第 2 代)',
    slug: 'nest-hub-2',
    summary: 'Google 智慧螢幕，睡眠追蹤',
    price: 3490,
    comparePrice: undefined,
    stockQuantity: 70,
    isActive: true,
    isFeatured: false,
    categoryName: '智慧家居',
    categoryPath: 'smart-home',
    brandName: 'Google',
    ratingAverage: 4.6,
    reviewCount: 298,
    totalSold: 1680,
    totalRevenue: 3490 * 1680,
    primaryImageUrl: 'https://picsum.photos/seed/nesthub2/400/400',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-01'),
  },
];

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private readonly useMock = true;

  private readonly productsSignal = signal<ProductListItem[]>([]);
  private readonly selectedProductSignal = signal<ProductListItem | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  public readonly products = this.productsSignal.asReadonly();
  public readonly selectedProduct = this.selectedProductSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();

  public readonly featuredProducts = computed(() => {
    return this.productsSignal().filter((p) => p.isFeatured);
  });

  getProducts(
    params?: ProductListParams
  ): Observable<PaginatedResponse<ProductListItem>> {
    if (this.useMock) {
      return this.getMockProducts(params);
    }

    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<PaginatedResponse<ProductListItem>>(this.apiUrl, {
        params: httpParams,
      })
      .pipe(
        map((response) => {
          this.productsSignal.set(response.items);
          return response;
        }),
        catchError((error) => {
          console.error('Failed to fetch products:', error);
          return throwError(() => error);
        })
      );
  }

  getProduct(id: string): Observable<ProductListItem> {
    if (this.useMock) {
      return this.getMockProduct(id);
    }

    return this.http
      .get<ApiResponse<ProductListItem>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => {
          this.selectedProductSignal.set(response.data!);
          return response.data!;
        }),
        catchError((error) => {
          console.error('Failed to fetch product:', error);
          return throwError(() => error);
        })
      );
  }

  private getMockProducts(
    params?: ProductListParams
  ): Observable<PaginatedResponse<ProductListItem>> {
    let filteredProducts = [...MOCK_PRODUCTS];

    if (params?.search) {
      const search = params.search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.summary?.toLowerCase().includes(search) ||
          p.categoryName.toLowerCase().includes(search) ||
          p.brandName?.toLowerCase().includes(search)
      );
    }

    if (params?.categoryId) {
      filteredProducts = filteredProducts.filter(
        (p) => p.categoryPath === params.categoryId || p.categoryName === params.categoryId
      );
    }

    if (params?.categorySlug) {
      filteredProducts = filteredProducts.filter(
        (p) => p.categoryPath === params.categorySlug
      );
    }

    if (params?.status) {
      // ProductListItem doesn't have status field, so we use isActive
      if (params.status === 'active') {
        filteredProducts = filteredProducts.filter((p) => p.isActive);
      }
    }

    if (params?.minPrice) {
      filteredProducts = filteredProducts.filter(
        (p) => p.price >= params.minPrice!
      );
    }
    if (params?.maxPrice) {
      filteredProducts = filteredProducts.filter(
        (p) => p.price <= params.maxPrice!
      );
    }

    if (params?.isFeatured !== undefined) {
      filteredProducts = filteredProducts.filter(
        (p) => p.isFeatured === params.isFeatured
      );
    }

    if (params?.sortBy) {
      filteredProducts.sort((a, b) => {
        const aVal = (a as any)[params.sortBy!];
        const bVal = (b as any)[params.sortBy!];

        if (params.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    this.productsSignal.set(paginatedProducts);

    return of({
      items: paginatedProducts,
      totalItems: total,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    }).pipe(delay(500));
  }

  private getMockProduct(id: string): Observable<ProductListItem> {
    const product = MOCK_PRODUCTS.find((p) => p.id === id);

    if (!product) {
      return throwError(() => new Error('Product not found'));
    }

    this.selectedProductSignal.set(product);

    return of(product).pipe(delay(300));
  }

  /**
   * 獲取商品變體配置
   * Get product variant configuration
   *
   * @param productId 商品 ID
   * @returns Observable<ProductVariantConfig>
   */
  getProductVariantConfig(productId: string): Observable<ProductVariantConfig> {
    // Mock: 只有特定商品有變體
    const variantConfigs = this.getMockVariantConfigs();
    const config = variantConfigs[productId];

    if (!config) {
      // 無變體的商品
      return of({
        hasVariants: false,
        options: [],
        variants: [],
      }).pipe(delay(200));
    }

    return of(config).pipe(delay(200));
  }

  /**
   * 根據選擇的屬性查找變體
   * Find variant by selected attributes
   *
   * @param productId 商品 ID
   * @param attributes 選擇的屬性
   * @returns Observable<ProductVariant | null>
   */
  findVariantByAttributes(
    productId: string,
    attributes: Record<string, string>
  ): Observable<ProductVariant | null> {
    const config = this.getMockVariantConfigs()[productId];

    if (!config) {
      return of(null).pipe(delay(100));
    }

    const variant = config.variants.find((v) => {
      return Object.entries(attributes).every(
        ([key, value]) => v.attributes[key] === value
      );
    });

    return of(variant || null).pipe(delay(100));
  }

  /**
   * Mock 變體配置資料
   * Mock variant configuration data
   */
  private getMockVariantConfigs(): Record<string, ProductVariantConfig> {
    return {
      // iPhone 15 Pro Max 的變體配置（顏色 x 容量）
      '1': {
        hasVariants: true,
        options: [
          {
            name: '顏色',
            type: 'color',
            values: [
              {
                value: 'natural-titanium',
                displayName: '原色鈦金屬',
                colorCode: '#E8E3DC',
                isAvailable: true,
              },
              {
                value: 'blue-titanium',
                displayName: '藍色鈦金屬',
                colorCode: '#5F6A7D',
                isAvailable: true,
              },
              {
                value: 'white-titanium',
                displayName: '白色鈦金屬',
                colorCode: '#E8E8E8',
                isAvailable: true,
              },
              {
                value: 'black-titanium',
                displayName: '黑色鈦金屬',
                colorCode: '#3D3D3D',
                isAvailable: true,
              },
            ],
          },
          {
            name: '容量',
            type: 'size',
            values: [
              {
                value: '256GB',
                displayName: '256GB',
                isAvailable: true,
                priceAdjustment: 0,
              },
              {
                value: '512GB',
                displayName: '512GB',
                isAvailable: true,
                priceAdjustment: 4000,
              },
              {
                value: '1TB',
                displayName: '1TB',
                isAvailable: true,
                priceAdjustment: 8000,
              },
            ],
          },
        ],
        variants: [
          // 原色鈦金屬 variants
          {
            id: '1-v1',
            productId: '1',
            variantSku: 'IPH15PM-256-NTT',
            attributes: { 顏色: 'natural-titanium', 容量: '256GB' },
            variantName: '原色鈦金屬 256GB',
            stockQuantity: 15,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '1-v2',
            productId: '1',
            variantSku: 'IPH15PM-512-NTT',
            attributes: { 顏色: 'natural-titanium', 容量: '512GB' },
            variantName: '原色鈦金屬 512GB',
            priceOverride: 40900,
            stockQuantity: 12,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '1-v3',
            productId: '1',
            variantSku: 'IPH15PM-1TB-NTT',
            attributes: { 顏色: 'natural-titanium', 容量: '1TB' },
            variantName: '原色鈦金屬 1TB',
            priceOverride: 44900,
            stockQuantity: 8,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          // 藍色鈦金屬 variants
          {
            id: '1-v4',
            productId: '1',
            variantSku: 'IPH15PM-256-BTT',
            attributes: { 顏色: 'blue-titanium', 容量: '256GB' },
            variantName: '藍色鈦金屬 256GB',
            stockQuantity: 10,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '1-v5',
            productId: '1',
            variantSku: 'IPH15PM-512-BTT',
            attributes: { 顏色: 'blue-titanium', 容量: '512GB' },
            variantName: '藍色鈦金屬 512GB',
            priceOverride: 40900,
            stockQuantity: 6,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '1-v6',
            productId: '1',
            variantSku: 'IPH15PM-1TB-BTT',
            attributes: { 顏色: 'blue-titanium', 容量: '1TB' },
            variantName: '藍色鈦金屬 1TB',
            priceOverride: 44900,
            stockQuantity: 3,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          // 其他顏色省略...（可根據需要添加）
        ],
        defaultVariant: {
          id: '1-v1',
          productId: '1',
          variantSku: 'IPH15PM-256-NTT',
          attributes: { 顏色: 'natural-titanium', 容量: '256GB' },
          variantName: '原色鈦金屬 256GB',
          stockQuantity: 15,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };
  }
}
