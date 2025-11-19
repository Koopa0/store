/**
 * 登入元件
 * Login Component
 *
 * 用戶登入頁面
 * User login page
 *
 * 教學重點 / Teaching Points:
 * 1. Standalone 元件
 * 2. Reactive Forms (反應式表單)
 * 3. 表單驗證
 * 4. 使用 Signal 追蹤登入狀態
 * 5. Angular Material 表單元件
 */

import { Component, OnInit, signal, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ngx-translate
import { TranslateModule } from '@ngx-translate/core';

// 服務
import { AuthService, LoadingService, NotificationService, LoggerService } from '@core/services';
import { LoginRequest } from '@core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  /**
   * 注入服務
   * Inject services
   */
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  /**
   * 登入表單
   * Login form
   */
  loginForm!: FormGroup;

  /**
   * 是否顯示密碼
   * Show password
   */
  hidePassword = signal(true);

  /**
   * 錯誤訊息
   * Error message
   */
  errorMessage = signal<string | null>(null);

  /**
   * 是否正在載入
   * Is loading
   */
  isLoading = this.loadingService.isLoading;

  /**
   * 返回 URL
   * Return URL
   */
  private returnUrl = '/';

  /**
   * 初始化
   * Initialize
   */
  ngOnInit(): void {
    // 建立表單
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });

    // 取得返回 URL
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    this.logger.info('[LoginComponent] Initialized, returnUrl:', this.returnUrl);
  }

  /**
   * 登入
   * Login
   */
  onSubmit(): void {
    // 檢查表單是否有效
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // 清除錯誤訊息
    this.errorMessage.set(null);

    // 取得表單值
    const credentials: LoginRequest = {
      emailOrUsername: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe,
    };

    this.logger.info('[LoginComponent] Logging in:', credentials.emailOrUsername);

    // 呼叫登入服務
    this.authService
      .login(credentials)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.logger.info('[LoginComponent] Login successful');

          // 顯示成功通知
          this.notificationService.success('auth.login.success');

          // 導向返回 URL 或首頁
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          this.logger.error('[LoginComponent] Login failed:', error);

          // 設定錯誤訊息
          this.errorMessage.set(error.message || '登入失敗，請稍後再試');

          // 顯示錯誤通知
          this.notificationService.error(error.message || 'auth.login.error');
        },
      });
  }

  /**
   * 切換密碼顯示
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update((hide) => !hide);
  }

  /**
   * 取得欄位錯誤訊息
   * Get field error message
   *
   * @param fieldName 欄位名稱
   * @returns 錯誤訊息
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (!field || !field.touched || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return '此欄位為必填';
    }

    if (field.errors['email']) {
      return '請輸入有效的 Email 地址';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `密碼長度至少需要 ${minLength} 個字元`;
    }

    return '';
  }
}
