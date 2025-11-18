/**
 * 根元件
 * Root Component
 *
 * 應用程式的根元件，負責初始化全域服務和載入路由
 * The root component of the application, responsible for initializing global services and loading routes
 *
 * 教學重點 / Teaching Points:
 * 1. Standalone Component 架構
 * 2. 使用 Signal 進行響應式狀態管理
 * 3. 整合翻譯和主題服務
 * 4. Component 生命週期鉤子使用
 */

import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

// 核心服務
import { TranslationService, ThemeService } from '@core/services';

@Component({
  /**
   * 元件選擇器
   * Component selector
   *
   * 教學說明：定義如何在 HTML 中使用此元件
   */
  selector: 'app-root',

  /**
   * Standalone 元件
   * Standalone component
   *
   * 教學說明：
   * - Angular v14+ 新功能
   * - 不需要 NgModule
   * - 直接在 imports 中宣告依賴
   */
  standalone: true,

  /**
   * 導入的模組和元件
   * Imported modules and components
   *
   * 教學說明：
   * - RouterOutlet: 路由出口，用於顯示路由元件
   * - CommonModule: 提供常用指令（*ngIf, *ngFor 等）
   * - TranslateModule: 提供翻譯管道和指令
   */
  imports: [RouterOutlet, CommonModule, TranslateModule],

  /**
   * 模板檔案路徑
   * Template file path
   */
  templateUrl: './app.html',

  /**
   * 樣式檔案路徑
   * Style file path
   */
  styleUrl: './app.scss',
})
export class App implements OnInit {
  /**
   * 應用程式標題
   * Application title
   *
   * 教學說明：使用 translateService.instant() 直接取得翻譯文字
   */
  title = 'koopa-store';

  /**
   * 注入翻譯服務
   * Inject translation service
   *
   * 教學說明：
   * - 使用 inject() 函數進行依賴注入
   * - 相較於建構子注入更簡潔
   * - 可以在函數中使用
   * - Angular v14+ 新功能
   */
  protected readonly translationService = inject(TranslationService);

  /**
   * 注入主題服務
   * Inject theme service
   */
  protected readonly themeService = inject(ThemeService);

  /**
   * 當前語言（從服務中取得）
   * Current language (from service)
   *
   * 教學說明：
   * - 使用 Signal 的 computed() 自動追蹤變更
   * - 當語言變更時，畫面會自動更新
   */
  currentLanguage = this.translationService.currentLanguage;

  /**
   * 當前主題（從服務中取得）
   * Current theme (from service)
   */
  currentTheme = this.themeService.actualTheme;

  /**
   * 是否為暗色主題（從服務中取得）
   * Is dark theme (from service)
   */
  isDark = this.themeService.isDark;

  /**
   * 元件初始化
   * Component initialization
   *
   * 教學說明：
   * - ngOnInit 是 Angular 生命週期鉤子
   * - 在元件建立後、畫面渲染前執行
   * - 適合進行初始化工作
   */
  ngOnInit(): void {
    this.initializeApp();
  }

  /**
   * 初始化應用程式
   * Initialize application
   *
   * 教學說明：執行所有必要的初始化工作
   */
  private initializeApp(): void {
    // 翻譯服務和主題服務會在建構時自動初始化
    console.log('[App] Application initialized');
    console.log(
      `[App] Language: ${this.translationService.currentLanguage()}`
    );
    console.log(`[App] Theme: ${this.themeService.actualTheme()}`);
  }

  /**
   * 切換語言
   * Toggle language
   *
   * 教學說明：演示如何使用翻譯服務切換語言
   */
  toggleLanguage(): void {
    this.translationService.toggleLanguage();
  }

  /**
   * 切換主題
   * Toggle theme
   *
   * 教學說明：演示如何使用主題服務切換主題
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
