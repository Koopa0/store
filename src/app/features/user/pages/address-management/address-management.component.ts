/**
 * 地址管理頁面組件
 * Address Management Page Component
 *
 * 管理用戶收貨地址的 CRUD 操作
 * Manages user shipping address CRUD operations
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. Material Dialog 使用
 * 3. 表單驗證
 * 4. CRUD 操作整合
 */

import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { AddressService } from '@core/services/address.service';

// Models
import { UserAddress, AddressFormatter } from '@core/models/user.model';

// Pipes
import { TranslateModule } from '@ngx-translate/core';

// Components
import { AddressFormDialogComponent } from './address-form-dialog/address-form-dialog.component';

@Component({
  selector: 'app-address-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './address-management.component.html',
  styleUrl: './address-management.component.scss',
})
export class AddressManagementComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly addressService = inject(AddressService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * 從 AddressService 取得的狀態
   * State from AddressService
   */
  public readonly addresses = this.addressService.addresses;
  public readonly loading = this.addressService.loading;

  /**
   * 地址格式化工具
   * Address formatter utility
   */
  public readonly AddressFormatter = AddressFormatter;

  /**
   * 元件初始化
   * Component initialization
   */
  ngOnInit(): void {
    // 載入地址列表
    this.addressService.loadAddresses();
  }

  /**
   * 開啟新增地址對話框
   * Open add address dialog
   */
  openAddAddressDialog(): void {
    const dialogRef = this.dialog.open(AddressFormDialogComponent, {
      width: '600px',
      data: { mode: 'add' },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          console.log('[AddressManagement] Address added successfully');
        }
      });
  }

  /**
   * 開啟編輯地址對話框
   * Open edit address dialog
   */
  openEditAddressDialog(address: UserAddress): void {
    const dialogRef = this.dialog.open(AddressFormDialogComponent, {
      width: '600px',
      data: { mode: 'edit', address },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          console.log('[AddressManagement] Address updated successfully');
        }
      });
  }

  /**
   * 設定為預設地址
   * Set as default address
   */
  setAsDefault(address: UserAddress): void {
    if (address.isDefault) {
      return; // 已經是預設地址
    }

    this.addressService
      .setDefaultAddress(address.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('[AddressManagement] Default address set:', address.id);
        },
        error: (err) => {
          console.error('Failed to set default address:', err);
        },
      });
  }

  /**
   * 刪除地址
   * Delete address
   */
  deleteAddress(address: UserAddress): void {
    if (address.isDefault) {
      alert('無法刪除預設地址');
      return;
    }

    if (confirm(`確定要刪除「${AddressFormatter.getLabelDisplayName(address)}」地址嗎？`)) {
      this.addressService
        .deleteAddress(address.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            console.log('[AddressManagement] Address deleted:', address.id);
          },
          error: (err) => {
            console.error('Failed to delete address:', err);
          },
        });
    }
  }

  /**
   * 返回上一頁
   * Go back
   */
  goBack(): void {
    this.router.navigate(['/']);
  }
}
