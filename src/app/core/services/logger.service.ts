/**
 * 日誌服務
 * Logger Service
 *
 * 環境感知的日誌記錄服務
 * Environment-aware logging service
 *
 * 教學重點 / Teaching Points:
 * 1. 環境變數控制日誌輸出
 * 2. 統一的日誌介面
 * 3. 生產環境優化
 * 4. 日誌級別管理
 */

import { Injectable, inject } from '@angular/core';
import { environment } from '@environments/environment';

/**
 * 日誌級別 / Log Levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 日誌配置 / Logger Configuration
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  enableTimestamp: boolean;
  enableSourceMap: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  /**
   * 日誌配置 / Logger configuration
   */
  private config: LoggerConfig = {
    minLevel: environment.production ? LogLevel.WARN : LogLevel.DEBUG,
    enableTimestamp: !environment.production,
    enableSourceMap: !environment.production,
  };

  /**
   * 除錯日誌 / Debug log
   * 僅在開發環境輸出
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }

  /**
   * 資訊日誌 / Info log
   * 僅在開發環境輸出
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, args);
  }

  /**
   * 警告日誌 / Warning log
   * 開發和生產環境都輸出
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, args);
  }

  /**
   * 錯誤日誌 / Error log
   * 開發和生產環境都輸出
   */
  error(message: string, error?: any, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, [error, ...args]);
  }

  /**
   * 內部日誌方法 / Internal log method
   */
  private log(level: LogLevel, message: string, args: any[]): void {
    // 檢查日誌級別
    if (level < this.config.minLevel) {
      return;
    }

    // 準備日誌訊息
    let logMessage = message;

    // 添加時間戳
    if (this.config.enableTimestamp) {
      const timestamp = new Date().toISOString();
      logMessage = `[${timestamp}] ${logMessage}`;
    }

    // 根據級別輸出
    switch (level) {
      case LogLevel.DEBUG:
        console.log(`🔍 ${logMessage}`, ...args);
        break;
      case LogLevel.INFO:
        console.log(`ℹ️ ${logMessage}`, ...args);
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ ${logMessage}`, ...args);
        break;
      case LogLevel.ERROR:
        console.error(`❌ ${logMessage}`, ...args);
        break;
    }
  }

  /**
   * 設定日誌配置 / Set logger configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 取得當前配置 / Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}
