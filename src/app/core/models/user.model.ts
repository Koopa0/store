/**
 * 用戶相關的資料模型
 * User-related data models
 *
 * 對應資料庫: users, user_addresses
 * Database mapping: users, user_addresses
 */

/**
 * 用戶角色枚舉
 * User role enumeration
 */
export enum UserRole {
  /** 顧客 / Customer */
  CUSTOMER = 'customer',
  /** 賣家 / Seller */
  SELLER = 'seller',
  /** 管理員 / Administrator */
  ADMIN = 'admin',
  /** 超級管理員 / Super Administrator */
  SUPER_ADMIN = 'super_admin',
}

/**
 * 用戶偏好設定介面
 * User preferences interface
 */
export interface UserPreferences {
  /** 主題模式 / Theme mode */
  theme?: 'light' | 'dark' | 'auto';
  /** 語言 / Language */
  language?: string;
  /** 通知設定 / Notification settings */
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  /** 其他自定義設定 / Other custom settings */
  [key: string]: any;
}

/**
 * 用戶介面
 * User interface
 *
 * 對應資料表: users
 * Database table: users
 */
export interface User {
  /** 用戶 ID (UUID) */
  id: string;
  /** Email 地址 */
  email: string;
  /** 用戶名稱 */
  username: string;
  /** 全名 / Full name */
  fullName?: string;
  /** 電話號碼 / Phone number */
  phone?: string;
  /** 頭像 URL / Avatar URL */
  avatarUrl?: string;
  /** 出生日期 / Date of birth */
  dateOfBirth?: Date;
  /** 角色 / Role */
  role: UserRole;
  /** 帳號是否啟用 / Account active status */
  isActive: boolean;
  /** Email 是否已驗證 / Email verification status */
  isVerified: boolean;
  /** 是否啟用雙因素認證 / Two-factor authentication status */
  twoFactorEnabled: boolean;
  /** 用戶偏好設定 / User preferences */
  preferences: UserPreferences;
  /** 版本號（樂觀鎖）/ Version number (optimistic locking) */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
  /** 最後登入時間 / Last login timestamp */
  lastLoginAt?: Date;
  /** Email 驗證時間 / Email verified timestamp */
  emailVerifiedAt?: Date;
}

/**
 * 用戶地址介面
 * User address interface
 *
 * 對應資料表: user_addresses
 * Database table: user_addresses
 */
export interface UserAddress {
  /** 地址 ID (UUID) */
  id: string;
  /** 用戶 ID / User ID */
  userId: string;
  /** 地址標籤（如：家、公司）/ Address label (e.g., home, office) */
  label: string;
  /** 是否為預設地址 / Is default address */
  isDefault: boolean;
  /** 收件人姓名 / Recipient name */
  recipientName: string;
  /** 收件人電話 / Recipient phone */
  recipientPhone: string;
  /** 國家代碼（ISO 2字元）/ Country code (ISO 2-letter) */
  countryCode: string;
  /** 郵遞區號 / Postal code */
  postalCode: string;
  /** 州/省 / State/Province */
  stateProvince?: string;
  /** 城市 / City */
  city: string;
  /** 區 / District */
  district?: string;
  /** 街道地址 / Street address */
  streetAddress: string;
  /** 大樓/樓層 / Building/Floor */
  buildingFloor?: string;
  /** 緯度（用於地圖）/ Latitude (for mapping) */
  latitude?: number;
  /** 經度（用於地圖）/ Longitude (for mapping) */
  longitude?: number;
  /** 版本號 / Version number */
  version: number;
  /** 建立時間 / Created timestamp */
  createdAt: Date;
  /** 更新時間 / Updated timestamp */
  updatedAt: Date;
}

/**
 * 用戶登入請求
 * User login request
 */
export interface LoginRequest {
  /** Email 或用戶名稱 / Email or username */
  emailOrUsername: string;
  /** 密碼 / Password */
  password: string;
  /** 記住我 / Remember me */
  rememberMe?: boolean;
}

/**
 * 用戶註冊請求
 * User registration request
 */
export interface RegisterRequest {
  /** Email 地址 */
  email: string;
  /** 用戶名稱 / Username */
  username: string;
  /** 密碼 / Password */
  password: string;
  /** 確認密碼 / Confirm password */
  confirmPassword: string;
  /** 全名 / Full name */
  fullName?: string;
  /** 電話號碼 / Phone number */
  phone?: string;
}

/**
 * 認證回應
 * Authentication response
 */
export interface AuthResponse {
  /** JWT 存取令牌 / JWT access token */
  accessToken: string;
  /** 刷新令牌 / Refresh token */
  refreshToken: string;
  /** 令牌類型 / Token type */
  tokenType: string;
  /** 過期時間（秒）/ Expires in (seconds) */
  expiresIn: number;
  /** 用戶資訊 / User information */
  user: User;
}
