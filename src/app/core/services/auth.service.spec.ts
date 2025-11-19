/**
 * AuthService 單元測試
 * AuthService Unit Tests
 *
 * 測試覆蓋：
 * - 用戶登入/登出
 * - Token 管理
 * - 角色驗證
 * - Signal 狀態管理
 * - LocalStorage 持久化
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '@core/constants/app.constants';
import { UserRole, LoginRequest, RegisterRequest, User } from '@core/models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let storageService: jasmine.SpyObj<StorageService>;
  let router: jasmine.SpyObj<Router>;

  // Mock 用戶資料
  const mockUser: User = {
    id: 'uuid-admin-001',
    email: 'admin@koopa.com',
    username: 'admin',
    fullName: '系統管理員',
    role: UserRole.ADMIN,
    phone: '0912-345-678',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
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

  const mockToken = 'mock.jwt.token';

  beforeEach(() => {
    // 創建 StorageService spy
    const storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'get',
      'set',
      'remove',
    ]);

    // 創建 Router spy
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    // 預設返回 null（無 storage 資料）
    storageServiceSpy.get.and.returnValue(null);

    service = TestBed.inject(AuthService);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    // 清理計時器
    if (service['refreshTokenTimeout']) {
      clearTimeout(service['refreshTokenTimeout']);
    }
  });

  describe('初始化 (Initialization)', () => {
    it('應該成功創建服務', () => {
      expect(service).toBeTruthy();
    });

    it('初始狀態應該未登入', () => {
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.isAdmin()).toBeFalse();
      expect(service.userRole()).toBeNull();
    });

    it('應該從 localStorage 載入用戶資料', () => {
      // 重新配置 storage 返回用戶資料
      storageService.get.and.callFake(((key: string) => {
        if (key === STORAGE_KEYS.USER_INFO) return mockUser;
        if (key === STORAGE_KEYS.ACCESS_TOKEN) return mockToken;
        return null;
      }) as any);

      // 重新創建服務以觸發 constructor
      const newService = TestBed.inject(AuthService);

      expect(newService.currentUser()).toEqual(mockUser);
      expect(newService.isAuthenticated()).toBeTrue();
    });

    it('如果 token 無效應該清除 storage', () => {
      storageService.get.and.returnValue(null);
      storageService.get.and.callFake(((key: string) => {
        if (key === STORAGE_KEYS.USER_INFO) return mockUser;
        // 沒有 token
        return null;
      }) as any);

      TestBed.inject(AuthService);

      expect(storageService.remove).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
      expect(storageService.remove).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
      expect(storageService.remove).toHaveBeenCalledWith(STORAGE_KEYS.USER_INFO);
    });
  });

  describe('登入功能 (Login)', () => {
    it('應該成功登入管理員帳號', fakeAsync(() => {
      const credentials: LoginRequest = {
        emailOrUsername: 'admin@koopa.com',
        password: 'admin123',
      };

      let response: any;
      service.login(credentials).subscribe((res) => {
        response = res;
      });

      tick(500); // 等待 delay(500)

      expect(response).toBeDefined();
      expect(response.user.email).toBe('admin@koopa.com');
      expect(response.user.role).toBe(UserRole.ADMIN);
      expect(response.accessToken).toBeDefined();
      expect(response.refreshToken).toBeDefined();

      expect(service.currentUser()?.email).toBe('admin@koopa.com');
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.isAdmin()).toBeTrue();
      expect(service.userRole()).toBe(UserRole.ADMIN);

      expect(storageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        jasmine.any(String)
      );
      expect(storageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
        jasmine.any(String)
      );

      flush();
    }));

    it('應該成功登入一般用戶帳號', fakeAsync(() => {
      const credentials: LoginRequest = {
        emailOrUsername: 'user@koopa.com',
        password: 'user123',
      };

      let response: any;
      service.login(credentials).subscribe((res) => {
        response = res;
      });

      tick(500);

      expect(response.user.role).toBe(UserRole.CUSTOMER);
      expect(service.isAdmin()).toBeFalse();
      expect(service.userRole()).toBe(UserRole.CUSTOMER);

      flush();
    }));

    it('應該支援使用 username 登入', fakeAsync(() => {
      const credentials: LoginRequest = {
        emailOrUsername: 'admin', // 使用 username 而非 email
        password: 'admin123',
      };

      let response: any;
      service.login(credentials).subscribe((res) => {
        response = res;
      });

      tick(500);

      expect(response.user.username).toBe('admin');

      flush();
    }));

    it('密碼錯誤應該登入失敗', fakeAsync(() => {
      const credentials: LoginRequest = {
        emailOrUsername: 'admin@koopa.com',
        password: 'wrong-password',
      };

      let error: any;
      service.login(credentials).subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(500);

      expect(error).toBeDefined();
      expect(error.message).toContain('帳號或密碼錯誤');
      expect(service.isAuthenticated()).toBeFalse();

      flush();
    }));

    it('不存在的帳號應該登入失敗', fakeAsync(() => {
      const credentials: LoginRequest = {
        emailOrUsername: 'nonexistent@koopa.com',
        password: 'password',
      };

      let error: any;
      service.login(credentials).subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(500);

      expect(error).toBeDefined();
      expect(service.isAuthenticated()).toBeFalse();

      flush();
    }));
  });

  describe('登出功能 (Logout)', () => {
    beforeEach(fakeAsync(() => {
      // 先登入
      const credentials: LoginRequest = {
        emailOrUsername: 'admin@koopa.com',
        password: 'admin123',
      };

      service.login(credentials).subscribe();
      tick(500);
      flush();

      // 重置 spy 計數
      storageService.remove.calls.reset();
      router.navigate.calls.reset();
    }));

    it('應該清除所有認證資料並導向登入頁', () => {
      service.logout();

      expect(storageService.remove).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
      expect(storageService.remove).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
      expect(storageService.remove).toHaveBeenCalledWith(STORAGE_KEYS.USER_INFO);

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();

      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('註冊功能 (Register)', () => {
    it('應該成功註冊新帳號', fakeAsync(() => {
      const registerData: RegisterRequest = {
        email: 'newuser@koopa.com',
        username: 'newuser',
        password: 'password123',
        fullName: '新用戶',
        confirmPassword: 'password123',
        phone: '0900-000-000',
      };

      let completed = false;
      service.register(registerData).subscribe({
        next: () => {
          completed = true;
        },
      });

      tick(500);

      expect(completed).toBeTrue();

      flush();
    }));

    it('重複的 email 應該註冊失敗', fakeAsync(() => {
      const registerData: RegisterRequest = {
        email: 'admin@koopa.com', // 已存在的 email
        username: 'newuser',
        password: 'password123',
        fullName: '新用戶',
        confirmPassword: 'password123',
        phone: '0900-000-000',
      };

      let error: any;
      service.register(registerData).subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(500);

      expect(error).toBeDefined();
      expect(error.message).toContain('此 Email 已被註冊');

      flush();
    }));
  });

  describe('Token 管理 (Token Management)', () => {
    it('getToken() 應該返回當前 token', () => {
      storageService.get.and.returnValue('test-token');

      const token = service.getToken();

      expect(token).toBe('test-token');
      expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    });

    it('isTokenValid() 應該在有 token 時返回 true', () => {
      storageService.get.and.returnValue('test-token');

      expect(service.isTokenValid()).toBeTrue();
    });

    it('isTokenValid() 應該在沒有 token 時返回 false', () => {
      storageService.get.and.returnValue(null);

      expect(service.isTokenValid()).toBeFalse();
    });

    it('refreshToken() 應該更新 access token', fakeAsync(() => {
      // 設定當前狀態
      service['currentUserSignal'].set(mockUser);
      storageService.get.and.callFake(((key: string) => {
        if (key === STORAGE_KEYS.REFRESH_TOKEN) return 'refresh-token';
        return null;
      }) as any);

      let completed = false;
      service.refreshToken().subscribe({
        next: () => {
          completed = true;
        },
      });

      tick(300);

      expect(completed).toBeTrue();
      expect(storageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        jasmine.any(String)
      );

      flush();
    }));

    it('refreshToken() 沒有 refresh token 應該登出', fakeAsync(() => {
      service['currentUserSignal'].set(mockUser);
      storageService.get.and.returnValue(null); // 沒有 refresh token

      let error: any;
      service.refreshToken().subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(300);

      expect(error).toBeDefined();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);

      flush();
    }));

    it('refreshToken() 沒有用戶資料應該登出', fakeAsync(() => {
      service['currentUserSignal'].set(null);
      storageService.get.and.returnValue('refresh-token');

      let error: any;
      service.refreshToken().subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(300);

      expect(error).toBeDefined();

      flush();
    }));
  });

  describe('角色檢查 (Role Checking)', () => {
    beforeEach(fakeAsync(() => {
      // 先登入管理員
      const credentials: LoginRequest = {
        emailOrUsername: 'admin@koopa.com',
        password: 'admin123',
      };

      service.login(credentials).subscribe();
      tick(500);
      flush();
    }));

    it('hasRole() 應該正確檢查用戶角色', () => {
      expect(service.hasRole(UserRole.ADMIN)).toBeTrue();
      expect(service.hasRole(UserRole.CUSTOMER)).toBeFalse();
    });

    it('hasAnyRole() 應該檢查多個角色', () => {
      expect(service.hasAnyRole([UserRole.ADMIN, UserRole.CUSTOMER])).toBeTrue();
      expect(service.hasAnyRole([UserRole.CUSTOMER])).toBeFalse();
    });

    it('未登入時 hasRole() 應該返回 false', () => {
      service.logout();

      expect(service.hasRole(UserRole.ADMIN)).toBeFalse();
      expect(service.hasRole(UserRole.CUSTOMER)).toBeFalse();
    });

    it('未登入時 hasAnyRole() 應該返回 false', () => {
      service.logout();

      expect(service.hasAnyRole([UserRole.ADMIN, UserRole.CUSTOMER])).toBeFalse();
    });
  });

  describe('Computed Signals', () => {
    it('isAuthenticated 應該反映登入狀態', fakeAsync(() => {
      expect(service.isAuthenticated()).toBeFalse();

      const credentials: LoginRequest = {
        emailOrUsername: 'admin@koopa.com',
        password: 'admin123',
      };

      service.login(credentials).subscribe();
      tick(500);

      expect(service.isAuthenticated()).toBeTrue();

      service.logout();

      expect(service.isAuthenticated()).toBeFalse();

      flush();
    }));

    it('isAdmin 應該反映管理員狀態', fakeAsync(() => {
      expect(service.isAdmin()).toBeFalse();

      // 登入管理員
      service.login({
        emailOrUsername: 'admin@koopa.com',
        password: 'admin123',
      }).subscribe();
      tick(500);

      expect(service.isAdmin()).toBeTrue();

      flush();
    }));

    it('一般用戶 isAdmin 應該返回 false', fakeAsync(() => {
      service.login({
        emailOrUsername: 'user@koopa.com',
        password: 'user123',
      }).subscribe();
      tick(500);

      expect(service.isAdmin()).toBeFalse();
      expect(service.userRole()).toBe(UserRole.CUSTOMER);

      flush();
    }));

    it('userRole 應該返回正確的角色', fakeAsync(() => {
      expect(service.userRole()).toBeNull();

      service.login({
        emailOrUsername: 'admin@koopa.com',
        password: 'admin123',
      }).subscribe();
      tick(500);

      expect(service.userRole()).toBe(UserRole.ADMIN);

      flush();
    }));
  });

  describe('清理資源 (Cleanup)', () => {
    it('ngOnDestroy 應該清理計時器', () => {
      spyOn<any>(service, 'stopRefreshTokenTimer');

      service.ngOnDestroy();

      expect(service['stopRefreshTokenTimer']).toHaveBeenCalled();
    });
  });

  describe('邊界情況 (Edge Cases)', () => {
    it('應該處理 undefined password', fakeAsync(() => {
      const credentials: any = {
        emailOrUsername: 'admin@koopa.com',
        password: undefined,
      };

      let error: any;
      service.login(credentials).subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(500);

      expect(error).toBeDefined();

      flush();
    }));

    it('應該處理空字串 email', fakeAsync(() => {
      const credentials: LoginRequest = {
        emailOrUsername: '',
        password: 'admin123',
      };

      let error: any;
      service.login(credentials).subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(500);

      expect(error).toBeDefined();

      flush();
    }));

    it('多次登入應該更新用戶資料', fakeAsync(() => {
      // 第一次登入
      service.login({
        emailOrUsername: 'admin@koopa.com',
        password: 'admin123',
      }).subscribe();
      tick(500);

      expect(service.currentUser()?.role).toBe(UserRole.ADMIN);

      // 第二次登入不同帳號
      service.login({
        emailOrUsername: 'user@koopa.com',
        password: 'user123',
      }).subscribe();
      tick(500);

      expect(service.currentUser()?.role).toBe(UserRole.CUSTOMER);

      flush();
    }));
  });
});
