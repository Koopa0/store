/**
 * 應用程式常量定義
 * Application constants definitions
 *
 * 定義應用程式中使用的常量值
 * Defines constant values used throughout the application
 */

/**
 * API 端點常量
 * API endpoints constants
 */
export const API_ENDPOINTS = {
  // 認證 / Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // 用戶 / Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    ADDRESSES: '/users/addresses',
    ORDERS: '/users/orders',
    REVIEWS: '/users/reviews',
    WISHLIST: '/users/wishlist',
  },

  // 商品 / Products
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:id',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    BRANDS: '/products/brands',
    FEATURED: '/products/featured',
    REVIEWS: '/products/:id/reviews',
  },

  // 購物車 / Cart
  CART: {
    GET: '/cart',
    ADD: '/cart/items',
    UPDATE: '/cart/items/:id',
    REMOVE: '/cart/items/:id',
    CLEAR: '/cart/clear',
    SUMMARY: '/cart/summary',
    APPLY_PROMO: '/cart/promotion',
  },

  // 訂單 / Orders
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    DETAIL: '/orders/:id',
    CANCEL: '/orders/:id/cancel',
    TRACK: '/orders/:id/track',
  },

  // 支付 / Payments
  PAYMENTS: {
    METHODS: '/payments/methods',
    CREATE: '/payments',
    VERIFY: '/payments/:id/verify',
  },
} as const;

/**
 * 本地儲存鍵名常量
 * Local storage key constants
 */
export const STORAGE_KEYS = {
  /** 存取令牌 / Access token */
  ACCESS_TOKEN: 'koopa_access_token',
  /** 刷新令牌 / Refresh token */
  REFRESH_TOKEN: 'koopa_refresh_token',
  /** 用戶資訊 / User info */
  USER_INFO: 'koopa_user_info',
  /** 主題模式 / Theme mode */
  THEME_MODE: 'koopa_theme_mode',
  /** 語言設定 / Language setting */
  LANGUAGE: 'koopa_language',
  /** 購物車 ID（訪客用戶）/ Cart ID (guest users) */
  CART_ID: 'koopa_cart_id',
  /** 會話 ID（訪客用戶）/ Session ID (guest users) */
  SESSION_ID: 'koopa_session_id',
} as const;

/**
 * 日期格式常量
 * Date format constants
 */
export const DATE_FORMATS = {
  /** 完整日期時間：2024-11-18 15:30:45 */
  FULL_DATETIME: 'yyyy-MM-dd HH:mm:ss',
  /** 日期：2024-11-18 */
  DATE: 'yyyy-MM-dd',
  /** 時間：15:30:45 */
  TIME: 'HH:mm:ss',
  /** 簡短日期時間：2024/11/18 15:30 */
  SHORT_DATETIME: 'yyyy/MM/dd HH:mm',
  /** 台灣格式：民國 113 年 11 月 18 日 */
  TW_DATE: 'yyy 年 MM 月 dd 日',
  /** 相對時間格式（使用 timeago）*/
  RELATIVE: 'relative',
} as const;

/**
 * 數字格式常量
 * Number format constants
 */
export const NUMBER_FORMATS = {
  /** 貨幣格式：NT$ 1,234 */
  CURRENCY: '1.0-0',
  /** 小數格式：1,234.56 */
  DECIMAL: '1.2-2',
  /** 百分比格式：12.34% */
  PERCENT: '1.0-2',
} as const;

/**
 * 預設分頁設定
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  /** 預設頁碼 / Default page number */
  PAGE: 1,
  /** 預設每頁項目數 / Default page size */
  PAGE_SIZE: 20,
  /** 每頁項目數選項 / Page size options */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  /** 最大頁碼 / Max page number */
  MAX_PAGE: 1000,
} as const;

/**
 * 驗證規則常量
 * Validation rule constants
 */
export const VALIDATION = {
  /** 用戶名稱長度範圍 / Username length range */
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]{3,50}$/,
  },
  /** 密碼長度範圍 / Password length range */
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    // 至少包含一個大寫字母、一個小寫字母、一個數字
    // Must contain at least one uppercase, one lowercase, and one digit
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  },
  /** Email 格式 / Email pattern */
  EMAIL: {
    PATTERN: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  },
  /** 電話號碼格式 / Phone pattern */
  PHONE: {
    PATTERN: /^\+?[0-9\-\s\(\)]+$/,
  },
  /** 郵遞區號（台灣）/ Postal code (Taiwan) */
  POSTAL_CODE_TW: {
    PATTERN: /^\d{3,5}$/,
  },
} as const;

/**
 * HTTP 狀態碼
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * 錯誤訊息常量
 * Error message constants
 */
export const ERROR_MESSAGES = {
  // 通用錯誤 / Common errors
  NETWORK_ERROR: 'error.network',
  SERVER_ERROR: 'error.server',
  UNKNOWN_ERROR: 'error.unknown',
  VALIDATION_ERROR: 'error.validation',

  // 認證錯誤 / Authentication errors
  INVALID_CREDENTIALS: 'error.auth.invalidCredentials',
  SESSION_EXPIRED: 'error.auth.sessionExpired',
  UNAUTHORIZED: 'error.auth.unauthorized',
  FORBIDDEN: 'error.auth.forbidden',

  // 資源錯誤 / Resource errors
  NOT_FOUND: 'error.resource.notFound',
  ALREADY_EXISTS: 'error.resource.alreadyExists',
  CONFLICT: 'error.resource.conflict',

  // 業務邏輯錯誤 / Business logic errors
  INSUFFICIENT_STOCK: 'error.business.insufficientStock',
  INVALID_PROMO_CODE: 'error.business.invalidPromoCode',
  ORDER_CANCELLED: 'error.business.orderCancelled',
} as const;

/**
 * 成功訊息常量
 * Success message constants
 */
export const SUCCESS_MESSAGES = {
  // 通用成功訊息 / Common success messages
  SAVED: 'success.saved',
  DELETED: 'success.deleted',
  UPDATED: 'success.updated',
  CREATED: 'success.created',

  // 認證成功訊息 / Authentication success messages
  LOGIN_SUCCESS: 'success.auth.login',
  LOGOUT_SUCCESS: 'success.auth.logout',
  REGISTER_SUCCESS: 'success.auth.register',
  PASSWORD_CHANGED: 'success.auth.passwordChanged',

  // 購物車成功訊息 / Cart success messages
  ADDED_TO_CART: 'success.cart.added',
  REMOVED_FROM_CART: 'success.cart.removed',
  CART_UPDATED: 'success.cart.updated',

  // 訂單成功訊息 / Order success messages
  ORDER_CREATED: 'success.order.created',
  ORDER_CANCELLED: 'success.order.cancelled',
} as const;

/**
 * 路由路徑常量
 * Route path constants
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  PROFILE: '/profile',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  ADMIN: '/admin',
} as const;

/**
 * 正則表達式常量
 * Regular expression constants
 */
export const REGEX = {
  /** UUID 格式 / UUID format */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /** URL 格式 / URL format */
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  /** 數字 / Number */
  NUMBER: /^\d+$/,
  /** 小數 / Decimal */
  DECIMAL: /^\d+(\.\d+)?$/,
} as const;

/**
 * 動畫持續時間常量（毫秒）
 * Animation duration constants (milliseconds)
 */
export const ANIMATION_DURATION = {
  /** 快速 / Fast */
  FAST: 150,
  /** 正常 / Normal */
  NORMAL: 300,
  /** 慢速 / Slow */
  SLOW: 500,
} as const;

/**
 * Debounce 延遲時間（毫秒）
 * Debounce delay time (milliseconds)
 */
export const DEBOUNCE_TIME = {
  /** 搜尋輸入 / Search input */
  SEARCH: 300,
  /** 自動儲存 / Auto-save */
  AUTO_SAVE: 1000,
  /** 調整大小 / Resize */
  RESIZE: 200,
} as const;
