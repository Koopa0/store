/**
 * 用戶管理組件
 * User Management Component
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <div style="padding: 2rem;">
      <h1>用戶管理</h1>
      <p style="color: #666; margin-bottom: 2rem;">管理所有用戶帳戶和權限</p>

      <!-- 統計卡片 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <mat-card>
          <mat-card-content>
            <h3>總用戶數</h3>
            <div style="font-size: 2rem; font-weight: 600;">5,678</div>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content>
            <h3>今日新增</h3>
            <div style="font-size: 2rem; font-weight: 600;">+23</div>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content>
            <h3>活躍用戶</h3>
            <div style="font-size: 2rem; font-weight: 600;">3,421</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card>
        <mat-card-content>
          <p style="text-align: center; padding: 4rem 0; color: #999;">
            <mat-icon style="font-size: 64px; width: 64px; height: 64px; opacity: 0.5;">people</mat-icon><br>
            用戶管理詳細功能開發中...<br>
            <small>將包含：用戶列表、權限管理、用戶詳情、帳戶狀態管理等</small>
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class UserManagementComponent {
  private readonly authService = inject(AuthService);
}
