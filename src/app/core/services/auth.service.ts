/**
 * 認證服務
 * Authentication Service
 *
 * 管理用戶認證、登入、登出、Token 處理
 * Manages user authentication, login, logout, and token handling
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 用戶狀態管理
 * 2. JWT Token 處理
 * 3. LocalStorage 持久化
 * 4. 自動 Token 刷新
 * 5. 登入狀態響應式追蹤
 */

import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, delay } from 'rxjs';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '@core/constants/app.constants';
import {
  User,
  UserRole,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@core/models/user.model';
import { environment } from '@environments/environment';

/**
 * Hardcoded 測試帳號
 * Hardcoded test accounts
 *
 * 教學說明：這些是用於開發測試的假帳號
 * 實際應用應該呼叫後端 API 進行驗證
 */
const MOCK_USERS = [
  {
    id: 'uuid-admin-001',
    email: 'admin@koopa.com',
    username: 'admin',
    password: 'admin123',
    fullName: '系統管理員',
    role: UserRole.ADMIN,
    phone: '0912-345-678',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: 'uuid-user-002',
    email: 'user@koopa.com',
    username: 'user',
    password: 'user123',
    fullName: '一般用戶',
    role: UserRole.CUSTOMER,
    phone: '0923-456-789',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: 'uuid-test-003',
    email: 'test@koopa.com',
    username: 'test',
    password: 'test123',
    fullName: '測試用戶',
    role: UserRole.CUSTOMER,
    phone: '0934-567-890',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
  },
] as const;

/**
 * 認證服務
 * Authentication Service
 */
@Injectable({
  providedIn: 'root', // 單例服務
})
export class AuthService {
  /**
   * 注入服務
   * Inject services
   */
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);

  /**
   * 當前用戶 Signal
   * Current user Signal
   *
   * 教學說明：使用 Signal 追蹤當前登入的用戶
   */
  private readonly currentUserSignal = signal<User | null>(null);

  /**
   * 當前用戶（只讀）
   * Current user (readonly)
   */
  public readonly currentUser = this.currentUserSignal.asReadonly();

  /**
   * 是否已登入（計算 Signal）
   * Is authenticated (computed Signal)
   */
  public readonly isAuthenticated = computed(() => {
    return this.currentUserSignal() !== null;
  });

  /**
   * 是否為管理員（計算 Signal）
   * Is admin (computed Signal)
   */
  public readonly isAdmin = computed(() => {
    const user = this.currentUserSignal();
    return user?.role === UserRole.ADMIN;
  });

  /**
   * 用戶角色（計算 Signal）
   * User role (computed Signal)
   */
  public readonly userRole = computed(() => {
    return this.currentUserSignal()?.role || null;
  });

  /**
   * Token 刷新計時器
   * Token refresh timer
   */
  private refreshTokenTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    /**
     * 初始化時從 localStorage 載入用戶資料
     * Load user data from localStorage on initialization
     */
    this.loadUserFromStorage();

    /**
     * 監聽用戶變更，自動儲存到 localStorage
     * Watch user changes and auto-save to localStorage
     */
    effect(() => {
      const user = this.currentUserSignal();
      if (user) {
        this.storageService.set(STORAGE_KEYS.USER_INFO, user);
      } else {
        this.storageService.remove(STORAGE_KEYS.USER_INFO);
      }
    });

    console.log('[AuthService] Initialized');
  }

  /**
   * 登入
   * Login
   *
   * @param credentials 登入憑證
   * @returns Observable<AuthResponse>
   *
   * 教學說明：
   * 這裡使用 hardcoded 資料模擬登入
   * 實際應用應該呼叫後端 API
   */
  public login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('[AuthService] Login attempt:', credentials.emailOrUsername);

    // 驗證帳號密碼
    const user = MOCK_USERS.find(
      (u) =>
        (u.email === credentials.emailOrUsername || u.username === credentials.emailOrUsername) &&
        u.password === credentials.password
    );

    if (!user) {
      return throwError(() => new Error('帳號或密碼錯誤'));
    }

    // 建立假的 JWT Token
    const accessToken = this.generateMockToken(user.id, user.role);
    const refreshToken = this.generateMockToken(user.id, user.role, true);

    // 儲存 Token
    this.storageService.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    this.storageService.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

    // 建立用戶物件
    const userInfo: User = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: true,
      isVerified: true,
      twoFactorEnabled: false,
      preferences: {
        theme: 'auto',
        language: 'zh-TW',
      },
      version: 1,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 更新當前用戶
    this.currentUserSignal.set(userInfo);

    // 設定 Token 刷新計時器（模擬）
    this.startRefreshTokenTimer();

    console.log('[AuthService] Login successful:', userInfo);

    // 返回 AuthResponse
    const response: AuthResponse = {
      user: userInfo,
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600, // 1 小時
    };

    // 模擬 API 延遲
    return of(response).pipe(delay(500));
  }

  /**
   * 登出
   * Logout
   *
   * 教學說明：
   * 清除所有認證資料並導向登入頁
   */
  public logout(): void {
    console.log('[AuthService] Logging out');

    // 清除 Token
    this.storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
    this.storageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
    this.storageService.remove(STORAGE_KEYS.USER_INFO);

    // 清除用戶資料
    this.currentUserSignal.set(null);

    // 停止 Token 刷新計時器
    this.stopRefreshTokenTimer();

    // 導向登入頁
    this.router.navigate(['/auth/login']);

    console.log('[AuthService] Logged out successfully');
  }

  /**
   * 註冊
   * Register
   *
   * @param data 註冊資料
   * @returns Observable<AuthResponse>
   *
   * 教學說明：模擬註冊功能
   */
  public register(data: RegisterRequest): Observable<void> {
    console.log('[AuthService] Register attempt:', data.email);

    // 檢查 email 是否已存在
    const exists = MOCK_USERS.some((u) => u.email === data.email);
    if (exists) {
      return throwError(() => new Error('此 Email 已被註冊'));
    }

    // 實際應用中，這裡應該呼叫後端 API 建立帳號
    console.log('[AuthService] Registration successful (mock)');

    // 模擬 API 延遲
    return of(undefined).pipe(delay(500));
  }

  /**
   * 刷新 Token
   * Refresh token
   *
   * @returns Observable<AuthResponse>
   *
   * 教學說明：使用 refresh token 取得新的 access token
   */
  public refreshToken(): Observable<void> {
    const refreshToken = this.storageService.get<string>(
      STORAGE_KEYS.REFRESH_TOKEN
    );

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }

    const user = this.currentUserSignal();
    if (!user) {
      this.logout();
      return throwError(() => new Error('No user'));
    }

    console.log('[AuthService] Refreshing token');

    // 產生新的 access token
    const newAccessToken = this.generateMockToken(user.id, user.role);
    this.storageService.set(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);

    console.log('[AuthService] Token refreshed');

    // 模擬 API 延遲
    return of(undefined).pipe(delay(300));
  }

  /**
   * 檢查用戶是否有特定角色
   * Check if user has specific role
   *
   * @param role 角色
   * @returns 是否有該角色
   */
  public hasRole(role: UserRole): boolean {
    const user = this.currentUserSignal();
    return user?.role === role;
  }

  /**
   * 檢查用戶是否有任一角色
   * Check if user has any of the roles
   *
   * @param roles 角色陣列
   * @returns 是否有任一角色
   */
  public hasAnyRole(roles: UserRole[]): boolean {
    const user = this.currentUserSignal();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * 取得當前 Token
   * Get current token
   *
   * @returns Token 或 null
   */
  public getToken(): string | null {
    return this.storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * 檢查 Token 是否有效
   * Check if token is valid
   *
   * @returns Token 是否有效
   *
   * 教學說明：
   * 實際應用中應該解析 JWT Token 並檢查過期時間
   */
  public isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // 簡化版本：有 token 就認為有效
    // 實際應該解析 JWT 並檢查 exp
    return true;
  }

  /**
   * 從 localStorage 載入用戶資料
   * Load user data from localStorage
   */
  private loadUserFromStorage(): void {
    const user = this.storageService.get<User>(STORAGE_KEYS.USER_INFO);
    const token = this.storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);

    if (user && token && this.isTokenValid()) {
      this.currentUserSignal.set(user);
      this.startRefreshTokenTimer();
      console.log('[AuthService] User loaded from storage:', user.email);
    } else {
      // Token 無效，清除資料
      this.logout();
    }
  }

  /**
   * 開始 Token 刷新計時器
   * Start token refresh timer
   *
   * 教學說明：
   * 在 Token 過期前自動刷新
   * 這裡設定為 50 分鐘後刷新（假設 Token 有效期 1 小時）
   */
  private startRefreshTokenTimer(): void {
    // 清除現有計時器
    this.stopRefreshTokenTimer();

    // 設定新計時器（50 分鐘）
    const timeout = 50 * 60 * 1000; // 50 minutes
    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshToken().subscribe({
        next: () => {
          console.log('[AuthService] Token auto-refreshed');
          this.startRefreshTokenTimer(); // 遞迴設定下次刷新
        },
        error: (error) => {
          console.error('[AuthService] Auto-refresh failed:', error);
        },
      });
    }, timeout);

    console.log('[AuthService] Token refresh timer started');
  }

  /**
   * 停止 Token 刷新計時器
   * Stop token refresh timer
   */
  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = undefined;
    }
  }

  /**
   * 產生模擬 JWT Token
   * Generate mock JWT token
   *
   * @param userId 用戶 ID
   * @param role 用戶角色
   * @param isRefreshToken 是否為刷新 Token
   * @returns 模擬的 JWT Token
   *
   * 教學說明：
   * 這是簡化的模擬版本，實際的 JWT 應由後端產生
   */
  private generateMockToken(
    userId: string,
    role: UserRole,
    isRefreshToken = false
  ): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: userId,
        role: role,
        type: isRefreshToken ? 'refresh' : 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (isRefreshToken ? 604800 : 3600), // 7 days : 1 hour
      })
    );
    const signature = btoa('mock-signature');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * 清理資源
   * Cleanup resources
   */
  public ngOnDestroy(): void {
    this.stopRefreshTokenTimer();
    console.log('[AuthService] Cleaned up');
  }
}
