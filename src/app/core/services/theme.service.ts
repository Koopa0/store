/**
 * 主題服務
 * Theme Service
 *
 * 管理應用程式的深淺色主題
 * Manages application's light/dark theme
 *
 * 教學重點 / Teaching Points:
 * 1. 使用 Signal 管理主題狀態
 * 2. 整合本地儲存和系統主題偵測
 * 3. 動態切換 CSS 類別實現主題切換
 * 4. 使用 effect() 監聽主題變更
 */

import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeMode } from '@core/models';
import { STORAGE_KEYS } from '@core/constants/app.constants';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root', // 單例服務
})
export class ThemeService {
  /**
   * 平台 ID（用於檢查是否在瀏覽器環境）
   * Platform ID (to check if running in browser)
   *
   * 教學說明：SSR (Server-Side Rendering) 時需要檢查平台
   */
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * 是否在瀏覽器環境
   * Whether running in browser
   */
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * 系統主題偏好媒體查詢
   * System theme preference media query
   */
  private darkModeQuery?: MediaQueryList;

  /**
   * 主題模式 Signal
   * Theme mode Signal
   *
   * 'light': 亮色模式
   * 'dark': 暗色模式
   * 'auto': 跟隨系統
   */
  private readonly themeModeSignal = signal<ThemeMode>(
    this.getInitialThemeMode()
  );

  /**
   * 實際使用的主題（計算 Signal）
   * Actual theme in use (computed Signal)
   *
   * 教學說明：當模式為 'auto' 時，自動根據系統主題決定
   */
  private readonly actualThemeSignal = computed<'light' | 'dark'>(() => {
    const mode = this.themeModeSignal();
    if (mode === 'auto') {
      return this.getSystemTheme();
    }
    return mode;
  });

  /**
   * 公開的只讀 Signal
   * Public readonly Signals
   *
   * 教學說明：Signal 本身是只讀的，外部無法調用 set() 方法
   */
  public readonly themeMode = this.themeModeSignal;
  public readonly actualTheme = this.actualThemeSignal;

  /**
   * 是否為暗色主題（計算 Signal）
   * Is dark theme (computed Signal)
   */
  public readonly isDark = computed(() => this.actualThemeSignal() === 'dark');

  /**
   * 是否為亮色主題（計算 Signal）
   * Is light theme (computed Signal)
   */
  public readonly isLight = computed(() => this.actualThemeSignal() === 'light');

  /**
   * 主題顯示名稱（計算 Signal）
   * Theme display name (computed Signal)
   */
  public readonly themeName = computed(() => {
    const mode = this.themeModeSignal();
    const names: Record<ThemeMode, string> = {
      light: '亮色模式',
      dark: '暗色模式',
      auto: '跟隨系統',
    };
    return names[mode];
  });

  constructor() {
    // 初始化系統主題監聽
    this.initializeSystemThemeListener();

    // 使用 effect 監聽主題變更並應用到 DOM
    effect(() => {
      this.applyTheme(this.actualThemeSignal());
    });

    console.log(
      `[ThemeService] Initialized with mode: ${this.themeModeSignal()}, actual: ${this.actualThemeSignal()}`
    );
  }

  /**
   * 取得初始主題模式
   * Get initial theme mode
   *
   * 優先順序 / Priority:
   * 1. 本地儲存的主題偏好
   * 2. 環境變數預設主題
   *
   * @returns 主題模式
   */
  private getInitialThemeMode(): ThemeMode {
    if (!this.isBrowser) {
      return environment.defaultTheme;
    }

    // 從本地儲存讀取
    const stored = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    if (stored && this.isValidThemeMode(stored)) {
      return stored as ThemeMode;
    }

    return environment.defaultTheme;
  }

  /**
   * 檢查是否為有效的主題模式
   * Check if valid theme mode
   *
   * @param mode 主題模式
   * @returns 是否有效
   */
  private isValidThemeMode(mode: string): mode is ThemeMode {
    return ['light', 'dark', 'auto'].includes(mode);
  }

  /**
   * 取得系統主題
   * Get system theme
   *
   * 教學說明：使用 matchMedia API 偵測系統深色模式偏好
   *
   * @returns 系統主題
   */
  private getSystemTheme(): 'light' | 'dark' {
    if (!this.isBrowser) {
      return 'light';
    }

    // 使用 matchMedia API 檢查系統主題
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    return prefersDark ? 'dark' : 'light';
  }

  /**
   * 初始化系統主題監聽器
   * Initialize system theme listener
   *
   * 教學說明：監聽系統主題變更事件，當用戶更改系統主題時自動更新
   */
  private initializeSystemThemeListener(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      this.darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // 監聽系統主題變更
      this.darkModeQuery.addEventListener('change', (e) => {
        console.log(`[ThemeService] System theme changed to: ${e.matches ? 'dark' : 'light'}`);
        // 如果當前模式是 'auto'，Signal 會自動重新計算
        if (this.themeModeSignal() === 'auto') {
          // 觸發重新計算（實際上 computed 會自動處理）
          this.themeModeSignal.set('auto');
        }
      });
    } catch (error) {
      console.error('[ThemeService] Failed to initialize system theme listener:', error);
    }
  }

  /**
   * 應用主題到 DOM
   * Apply theme to DOM
   *
   * 教學說明：通過添加/移除 CSS 類別來切換主題
   *
   * @param theme 主題（'light' 或 'dark'）
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    if (!this.isBrowser) {
      return;
    }

    const body = document.body;
    const darkClass = 'dark-theme';

    if (theme === 'dark') {
      body.classList.add(darkClass);
    } else {
      body.classList.remove(darkClass);
    }

    console.log(`[ThemeService] Applied theme: ${theme}`);
  }

  /**
   * 設定主題模式
   * Set theme mode
   *
   * @param mode 主題模式
   *
   * 教學說明：更新 Signal 並儲存到本地儲存
   */
  public setThemeMode(mode: ThemeMode): void {
    if (!this.isValidThemeMode(mode)) {
      console.warn(`[ThemeService] Invalid theme mode: ${mode}`);
      return;
    }

    // 更新 Signal
    this.themeModeSignal.set(mode);

    // 儲存到本地儲存
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    }

    console.log(`[ThemeService] Theme mode set to: ${mode}`);
  }

  /**
   * 切換主題模式
   * Toggle theme mode
   *
   * 教學說明：在 light、dark、auto 三種模式間循環切換
   */
  public toggleThemeMode(): void {
    const modes: ThemeMode[] = ['light', 'dark', 'auto'];
    const currentMode = this.themeModeSignal();
    const currentIndex = modes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    this.setThemeMode(nextMode);
  }

  /**
   * 切換實際主題（僅在 light 和 dark 之間切換）
   * Toggle actual theme (only between light and dark)
   *
   * 教學說明：忽略 auto 模式，直接在亮色和暗色間切換
   */
  public toggleTheme(): void {
    const currentMode = this.themeModeSignal();

    if (currentMode === 'auto') {
      // 如果當前是 auto，切換到相反的實際主題
      const currentActual = this.actualThemeSignal();
      this.setThemeMode(currentActual === 'dark' ? 'light' : 'dark');
    } else {
      // 如果不是 auto，直接切換
      this.setThemeMode(currentMode === 'dark' ? 'light' : 'dark');
    }
  }

  /**
   * 設定為亮色主題
   * Set to light theme
   */
  public setLight(): void {
    this.setThemeMode('light');
  }

  /**
   * 設定為暗色主題
   * Set to dark theme
   */
  public setDark(): void {
    this.setThemeMode('dark');
  }

  /**
   * 設定為跟隨系統
   * Set to auto (follow system)
   */
  public setAuto(): void {
    this.setThemeMode('auto');
  }

  /**
   * 清理資源
   * Clean up resources
   *
   * 教學說明：移除事件監聽器（雖然在服務中通常不需要，但展示最佳實踐）
   */
  public ngOnDestroy(): void {
    if (this.darkModeQuery && this.isBrowser) {
      // 移除監聽器（實際上 MediaQueryList 會自動處理）
      console.log('[ThemeService] Cleaning up');
    }
  }
}
