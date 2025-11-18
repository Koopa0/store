/**
 * 翻譯服務
 * Translation Service
 *
 * 提供語言切換和翻譯功能
 * Provides language switching and translation functionality
 *
 * 教學重點 / Teaching Points:
 * 1. 使用 TranslateService 管理多國語系
 * 2. 整合本地儲存記住用戶語言偏好
 * 3. 使用 BehaviorSubject 提供響應式語言狀態
 * 4. Signal-based API for Angular v20
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageCode } from '@core/models';
import { STORAGE_KEYS } from '@core/constants/app.constants';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root', // 單例服務，全應用程式共享
})
export class TranslationService {
  /**
   * 注入 ngx-translate 服務
   * Inject ngx-translate service
   *
   * 教學說明：使用 inject() 函數是 Angular 新的依賴注入方式
   * 相較於傳統的建構子注入，更簡潔且支援在函數中使用
   */
  private readonly translate = inject(TranslateService);

  /**
   * 支援的語言列表
   * Supported languages list
   */
  private readonly supportedLanguages: LanguageCode[] =
    environment.supportedLanguages as LanguageCode[];

  /**
   * 目前語言（使用 Signal）
   * Current language (using Signal)
   *
   * 教學說明：Signal 是 Angular v16+ 的新功能，提供更好的響應式資料管理
   * 優點：
   * 1. 自動追蹤相依性
   * 2. 更好的效能（細粒度更新）
   * 3. 類型安全
   */
  private readonly currentLanguageSignal = signal<LanguageCode>(
    this.getInitialLanguage()
  );

  /**
   * 當前語言（公開的只讀 Signal）
   * Current language (public readonly Signal)
   *
   * 教學說明：Signal 本身是只讀的，外部無法調用 set() 方法
   */
  public readonly currentLanguage = this.currentLanguageSignal;

  /**
   * 是否為繁體中文（計算 Signal）
   * Is Traditional Chinese (computed Signal)
   *
   * 教學說明：computed() 會自動追蹤相依的 Signal，當相依改變時自動重新計算
   */
  public readonly isZhTW = computed(
    () => this.currentLanguageSignal() === 'zh-TW'
  );

  /**
   * 是否為英文（計算 Signal）
   * Is English (computed Signal)
   */
  public readonly isEnglish = computed(
    () => this.currentLanguageSignal() === 'en'
  );

  /**
   * 語言顯示名稱（計算 Signal）
   * Language display name (computed Signal)
   */
  public readonly currentLanguageName = computed(() => {
    const lang = this.currentLanguageSignal();
    return lang === 'zh-TW' ? '繁體中文' : 'English';
  });

  constructor() {
    this.initializeTranslation();
  }

  /**
   * 初始化翻譯服務
   * Initialize translation service
   *
   * 教學說明：設定支援的語言和預設語言
   */
  private initializeTranslation(): void {
    // 設定支援的語言
    this.translate.addLangs(this.supportedLanguages);

    // 設定預設語言（當找不到翻譯時使用）
    this.translate.setDefaultLang(environment.defaultLanguage);

    // 使用當前語言
    const currentLang = this.getInitialLanguage();
    this.translate.use(currentLang);

    console.log(
      `[TranslationService] Initialized with language: ${currentLang}`
    );
  }

  /**
   * 取得初始語言
   * Get initial language
   *
   * 優先順序 / Priority:
   * 1. 本地儲存的語言偏好
   * 2. 瀏覽器語言
   * 3. 環境變數預設語言
   *
   * @returns 語言代碼
   */
  private getInitialLanguage(): LanguageCode {
    // 1. 嘗試從本地儲存讀取
    const storedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (storedLang && this.isSupported(storedLang as LanguageCode)) {
      return storedLang as LanguageCode;
    }

    // 2. 嘗試從瀏覽器語言偵測
    const browserLang = this.translate.getBrowserLang();
    if (browserLang && this.isSupported(browserLang as LanguageCode)) {
      return browserLang as LanguageCode;
    }

    // 3. 使用預設語言
    return environment.defaultLanguage as LanguageCode;
  }

  /**
   * 檢查語言是否支援
   * Check if language is supported
   *
   * @param lang 語言代碼
   * @returns 是否支援
   */
  private isSupported(lang: LanguageCode): boolean {
    return this.supportedLanguages.includes(lang);
  }

  /**
   * 切換語言
   * Switch language
   *
   * @param lang 語言代碼
   *
   * 教學說明：
   * 1. 更新 Signal 狀態
   * 2. 使用 ngx-translate 切換語言
   * 3. 儲存到本地儲存
   */
  public switchLanguage(lang: LanguageCode): void {
    if (!this.isSupported(lang)) {
      console.warn(`[TranslationService] Unsupported language: ${lang}`);
      return;
    }

    // 更新 Signal
    this.currentLanguageSignal.set(lang);

    // 切換 ngx-translate 語言
    this.translate.use(lang);

    // 儲存到本地儲存
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);

    console.log(`[TranslationService] Language switched to: ${lang}`);
  }

  /**
   * 切換到下一個語言
   * Switch to next language
   *
   * 教學說明：在支援的語言間循環切換
   */
  public toggleLanguage(): void {
    const currentIndex = this.supportedLanguages.indexOf(
      this.currentLanguageSignal()
    );
    const nextIndex = (currentIndex + 1) % this.supportedLanguages.length;
    const nextLang = this.supportedLanguages[nextIndex];

    this.switchLanguage(nextLang);
  }

  /**
   * 取得翻譯文字
   * Get translated text
   *
   * @param key 翻譯鍵值
   * @param params 參數（用於插值）
   * @returns 翻譯後的文字
   *
   * 教學說明：提供同步翻譯方法，適用於 template 和 component
   */
  public instant(key: string, params?: object): string {
    return this.translate.instant(key, params);
  }

  /**
   * 取得翻譯文字（Observable）
   * Get translated text (Observable)
   *
   * @param key 翻譯鍵值
   * @param params 參數（用於插值）
   * @returns Observable<string>
   *
   * 教學說明：提供非同步翻譯方法，適用於需要監聽語言變更的場景
   */
  public get(key: string | string[], params?: object) {
    return this.translate.get(key, params);
  }

  /**
   * 串流形式取得當前語言
   * Get current language as stream
   *
   * @returns Observable<string>
   *
   * 教學說明：用於監聽語言變更事件
   */
  public onLangChange() {
    return this.translate.onLangChange;
  }

  /**
   * 取得支援的語言列表
   * Get supported languages list
   *
   * @returns 語言代碼陣列
   */
  public getSupportedLanguages(): LanguageCode[] {
    return [...this.supportedLanguages];
  }

  /**
   * 重新載入翻譯
   * Reload translations
   *
   * @param lang 語言代碼（可選，預設為當前語言）
   *
   * 教學說明：用於動態更新翻譯檔案
   */
  public reloadLang(lang?: LanguageCode): void {
    const targetLang = lang || this.currentLanguageSignal();
    this.translate.reloadLang(targetLang).subscribe({
      next: () => {
        console.log(`[TranslationService] Reloaded language: ${targetLang}`);
      },
      error: (error) => {
        console.error(
          `[TranslationService] Failed to reload language:`,
          error
        );
      },
    });
  }
}
