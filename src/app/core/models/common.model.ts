/**
 * 通用資料模型
 * Common data models
 *
 * 包含所有模組共用的介面和類型定義
 * Contains interfaces and type definitions shared across all modules
 */

/**
 * API 回應包裝器
 * API response wrapper
 *
 * 統一的 API 回應格式
 * Unified API response format
 */
export interface ApiResponse<T = any> {
  /** 是否成功 / Success status */
  success: boolean;
  /** 回應資料 / Response data */
  data?: T;
  /** 錯誤訊息 / Error message */
  message?: string;
  /** 錯誤代碼 / Error code */
  errorCode?: string;
  /** 時間戳 / Timestamp */
  timestamp: Date;
}

/**
 * 分頁回應
 * Paginated response
 *
 * 用於列表資料的分頁回應
 * For paginated list data responses
 */
export interface PaginatedResponse<T = any> {
  /** 資料項目 / Data items */
  items: T[];
  /** 總項目數 / Total items count */
  totalItems: number;
  /** 總頁數 / Total pages */
  totalPages: number;
  /** 目前頁碼（從 1 開始）/ Current page (starts from 1) */
  currentPage: number;
  /** 每頁項目數 / Items per page */
  pageSize: number;
  /** 是否有上一頁 / Has previous page */
  hasPreviousPage: boolean;
  /** 是否有下一頁 / Has next page */
  hasNextPage: boolean;
}

/**
 * 分頁請求參數
 * Pagination request parameters
 */
export interface PaginationParams {
  /** 頁碼（從 1 開始）/ Page number (starts from 1) */
  page: number;
  /** 每頁項目數 / Page size */
  pageSize: number;
  /** 排序欄位 / Sort field */
  sortBy?: string;
  /** 排序方向 / Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 搜尋過濾參數
 * Search filter parameters
 */
export interface SearchParams extends PaginationParams {
  /** 搜尋關鍵字 / Search keyword */
  keyword?: string;
  /** 過濾條件 / Filter criteria */
  filters?: Record<string, any>;
}

/**
 * 錯誤詳情
 * Error details
 */
export interface ErrorDetail {
  /** 欄位名稱 / Field name */
  field?: string;
  /** 錯誤訊息 / Error message */
  message: string;
  /** 錯誤代碼 / Error code */
  code?: string;
}

/**
 * 驗證錯誤回應
 * Validation error response
 */
export interface ValidationErrorResponse {
  /** 是否成功 / Success status */
  success: false;
  /** 錯誤訊息 / Error message */
  message: string;
  /** 錯誤詳情列表 / Error details list */
  errors: ErrorDetail[];
  /** 時間戳 / Timestamp */
  timestamp: Date;
}

/**
 * 檔案上傳回應
 * File upload response
 */
export interface FileUploadResponse {
  /** 檔案 URL / File URL */
  url: string;
  /** 檔案名稱 / File name */
  fileName: string;
  /** 檔案大小（位元組）/ File size (bytes) */
  fileSize: number;
  /** MIME 類型 / MIME type */
  mimeType: string;
  /** 上傳時間 / Upload timestamp */
  uploadedAt: Date;
}

/**
 * 鍵值對
 * Key-value pair
 */
export interface KeyValue<K = string, V = any> {
  /** 鍵 / Key */
  key: K;
  /** 值 / Value */
  value: V;
  /** 顯示文字（可選）/ Display text (optional) */
  label?: string;
}

/**
 * 選項介面
 * Option interface
 *
 * 用於下拉選單、單選框等
 * For dropdowns, radio buttons, etc.
 */
export interface SelectOption<T = any> {
  /** 值 / Value */
  value: T;
  /** 顯示文字 / Display text */
  label: string;
  /** 是否禁用 / Is disabled */
  disabled?: boolean;
  /** 圖示（可選）/ Icon (optional) */
  icon?: string;
  /** 描述（可選）/ Description (optional) */
  description?: string;
}

/**
 * 載入狀態
 * Loading state
 */
export interface LoadingState {
  /** 是否正在載入 / Is loading */
  isLoading: boolean;
  /** 載入訊息 / Loading message */
  message?: string;
}

/**
 * 表單驗證錯誤
 * Form validation error
 */
export interface FormError {
  /** 欄位名稱 / Field name */
  field: string;
  /** 錯誤訊息 / Error message */
  message: string;
  /** 驗證類型 / Validation type */
  type?: 'required' | 'pattern' | 'min' | 'max' | 'minlength' | 'maxlength' | 'email' | 'custom';
}

/**
 * 統計資料
 * Statistics data
 */
export interface Statistics {
  /** 標題 / Title */
  title: string;
  /** 值 / Value */
  value: number | string;
  /** 單位（可選）/ Unit (optional) */
  unit?: string;
  /** 圖示（可選）/ Icon (optional) */
  icon?: string;
  /** 趨勢（可選）/ Trend (optional) */
  trend?: {
    /** 變化百分比 / Change percentage */
    percentage: number;
    /** 是否為正向趨勢 / Is positive trend */
    isPositive: boolean;
  };
}

/**
 * 麵包屑項目
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** 標籤 / Label */
  label: string;
  /** 路徑（可選，最後一項通常沒有路徑）/ Path (optional, last item usually has no path) */
  path?: string;
  /** 圖示（可選）/ Icon (optional) */
  icon?: string;
}

/**
 * 通知訊息
 * Notification message
 */
export interface NotificationMessage {
  /** 訊息類型 / Message type */
  type: 'success' | 'info' | 'warning' | 'error';
  /** 訊息內容 / Message content */
  message: string;
  /** 標題（可選）/ Title (optional) */
  title?: string;
  /** 持續時間（毫秒，0 表示不自動關閉）/ Duration (ms, 0 means no auto-close) */
  duration?: number;
  /** 是否可關閉 / Is dismissible */
  dismissible?: boolean;
}

/**
 * 排序方向
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 主題模式
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 語言代碼
 * Language code
 */
export type LanguageCode = 'zh-TW' | 'en';

/**
 * HTTP 方法
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
