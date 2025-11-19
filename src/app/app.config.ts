/**
 * 應用程式配置
 * Application Configuration
 *
 * Angular v20 使用 ApplicationConfig 取代傳統的 NgModule
 * 提供更好的 tree-shaking 和效能
 *
 * 教學重點 / Teaching Points:
 * 1. Standalone Components 架構
 * 2. 使用 providers 配置全域服務
 * 3. 配置 i18n、HTTP、動畫等功能
 */

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  LOCALE_ID,
} from '@angular/core';
import { DatePipe, CurrencyPipe, registerLocaleData } from '@angular/common';
import localeZhTw from '@angular/common/locales/zh-Hant';
import { provideRouter, withComponentInputBinding } from '@angular/router';

// Register zh-TW locale data
registerLocaleData(localeZhTw, 'zh-TW');
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// ngx-translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { routes } from './app.routes';

// HTTP Interceptors
import {
  authInterceptor,
  errorInterceptor,
  loadingInterceptor,
} from '@core/interceptors';

/**
 * 自定義翻譯加載器
 * Custom Translation Loader
 *
 * 教學說明：實作 TranslateLoader 介面，從指定路徑載入 JSON 翻譯檔案
 */
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

/**
 * 翻譯加載器工廠函數
 * Translation loader factory function
 *
 * @param http HttpClient 實例
 * @returns CustomTranslateLoader 實例
 */
export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new CustomTranslateLoader(http);
}

/**
 * 應用程式配置
 * Application configuration
 */
export const appConfig: ApplicationConfig = {
  providers: [
    /**
     * 全域錯誤監聽器
     * Global error listeners
     */
    provideBrowserGlobalErrorListeners(),

    /**
     * Zone.js 變更偵測配置
     * Zone.js change detection configuration
     *
     * eventCoalescing: 合併事件以提升效能
     */
    provideZoneChangeDetection({ eventCoalescing: true }),

    /**
     * 路由配置
     * Router configuration
     *
     * withComponentInputBinding: 允許路由參數直接綁定到元件輸入
     */
    provideRouter(routes, withComponentInputBinding()),

    /**
     * HTTP Client 配置
     * HTTP Client configuration
     *
     * 教學說明：
     * - withInterceptors: 提供函數式攔截器
     * - 攔截器執行順序：按照陣列順序執行
     * - 建議順序：Loading -> Auth -> Error
     */
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,  // 1. 載入狀態追蹤
        authInterceptor,     // 2. 添加認證 Token
        errorInterceptor,    // 3. 錯誤處理
      ]),
      withInterceptorsFromDi() // 支援從 DI 注入的類別式攔截器（向後相容）
    ),

    /**
     * 動畫支援
     * Animations support
     *
     * 教學說明：Angular Material 需要動畫支援
     */
    provideAnimations(),

    /**
     * ngx-translate 配置
     * ngx-translate configuration
     *
     * 教學說明：
     * 1. importProvidersFrom 用於導入舊式 NgModule 的 providers
     * 2. TranslateModule.forRoot() 配置根模組翻譯設定
     */
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'zh-TW',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),

    /**
     * 管道服務
     * Pipe services
     *
     * 教學說明：
     * DatePipe 和 CurrencyPipe 需要在全域提供，
     * 以便自訂管道可以注入使用
     */
    DatePipe,
    CurrencyPipe,

    /**
     * Locale 配置
     * Locale configuration
     *
     * 教學說明：
     * 提供應用程式的預設語系，確保日期、貨幣等格式正確顯示
     */
    { provide: LOCALE_ID, useValue: 'zh-TW' },
  ],
};
