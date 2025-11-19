/**
 * 地址表單對話框組件
 * Address Form Dialog Component
 *
 * 用於新增和編輯地址的對話框表單
 * Dialog form for adding and editing addresses
 *
 * 教學重點 / Teaching Points:
 * 1. Reactive Forms 表單驗證
 * 2. Material Dialog 資料傳遞
 * 3. 條件式表單欄位
 * 4. 台灣地址格式
 */

import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

// Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { AddressService } from '@core/services/address.service';

// Models
import { UserAddress, AddressLabel, AddAddressRequest, UpdateAddressRequest } from '@core/models/user.model';

// Pipes
import { TranslateModule } from '@ngx-translate/core';

export interface AddressFormDialogData {
  mode: 'add' | 'edit';
  address?: UserAddress;
}

@Component({
  selector: 'app-address-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './address-form-dialog.component.html',
  styleUrl: './address-form-dialog.component.scss',
})
export class AddressFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly addressService = inject(AddressService);
  private readonly dialogRef = inject(MatDialogRef<AddressFormDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  public readonly data = inject<AddressFormDialogData>(MAT_DIALOG_DATA);

  /**
   * 表單群組
   * Form group
   */
  public addressForm!: FormGroup;

  /**
   * 載入狀態
   * Loading state
   */
  public submitting = false;

  /**
   * 地址標籤選項
   * Address label options
   */
  public readonly labelOptions: { value: AddressLabel; label: string }[] = [
    { value: 'home', label: '住家' },
    { value: 'office', label: '公司' },
    { value: 'other', label: '其他' },
  ];

  /**
   * 台灣主要城市列表
   * Taiwan major cities list
   */
  public readonly cities: string[] = [
    '台北市',
    '新北市',
    '桃園市',
    '台中市',
    '台南市',
    '高雄市',
    '基隆市',
    '新竹市',
    '嘉義市',
    '新竹縣',
    '苗栗縣',
    '彰化縣',
    '南投縣',
    '雲林縣',
    '嘉義縣',
    '屏東縣',
    '宜蘭縣',
    '花蓮縣',
    '台東縣',
    '澎湖縣',
    '金門縣',
    '連江縣',
  ];

  /**
   * 元件初始化
   * Component initialization
   */
  ngOnInit(): void {
    this.initializeForm();

    // 如果是編輯模式，填入現有資料
    if (this.data.mode === 'edit' && this.data.address) {
      this.populateForm(this.data.address);
    }
  }

  /**
   * 初始化表單
   * Initialize form
   */
  private initializeForm(): void {
    this.addressForm = this.fb.group({
      label: ['home', Validators.required],
      customLabel: [''],
      recipientName: ['', [Validators.required, Validators.minLength(2)]],
      recipientPhone: ['', [Validators.required, Validators.pattern(/^09\d{8}$/)]],
      countryCode: ['TW'],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{3,5}$/)]],
      city: ['', Validators.required],
      district: [''],
      streetAddress: ['', Validators.required],
      buildingFloor: [''],
      isDefault: [false],
    });

    // 監聽 label 變化，控制 customLabel 的必填狀態
    this.addressForm.get('label')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((label) => {
        const customLabelControl = this.addressForm.get('customLabel');
        if (label === 'other') {
          customLabelControl?.setValidators([Validators.required]);
        } else {
          customLabelControl?.clearValidators();
        }
        customLabelControl?.updateValueAndValidity();
      });
  }

  /**
   * 填入表單資料（編輯模式）
   * Populate form data (edit mode)
   */
  private populateForm(address: UserAddress): void {
    this.addressForm.patchValue({
      label: address.label,
      customLabel: address.customLabel || '',
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      countryCode: address.countryCode,
      postalCode: address.postalCode,
      city: address.city,
      district: address.district || '',
      streetAddress: address.streetAddress,
      buildingFloor: address.buildingFloor || '',
      isDefault: address.isDefault,
    });
  }

  /**
   * 提交表單
   * Submit form
   */
  onSubmit(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const formValue = this.addressForm.value;

    if (this.data.mode === 'add') {
      // 新增地址
      const request: AddAddressRequest = formValue;

      this.addressService
        .addAddress(request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (address) => {
            console.log('[AddressFormDialog] Address added:', address);
            this.dialogRef.close(address);
          },
          error: (err) => {
            console.error('Failed to add address:', err);
            this.submitting = false;
          },
        });
    } else {
      // 更新地址
      const request: UpdateAddressRequest = {
        id: this.data.address!.id,
        ...formValue,
      };

      this.addressService
        .updateAddress(request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (address) => {
            console.log('[AddressFormDialog] Address updated:', address);
            this.dialogRef.close(address);
          },
          error: (err) => {
            console.error('Failed to update address:', err);
            this.submitting = false;
          },
        });
    }
  }

  /**
   * 取消
   * Cancel
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * 取得對話框標題
   * Get dialog title
   */
  getDialogTitle(): string {
    return this.data.mode === 'add' ? '新增收貨地址' : '編輯收貨地址';
  }

  /**
   * 檢查表單欄位錯誤
   * Check form field error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.addressForm.get(fieldName);
    return !!field && field.hasError(errorType) && (field.dirty || field.touched);
  }

  /**
   * 取得錯誤訊息
   * Get error message
   */
  getErrorMessage(fieldName: string): string {
    const field = this.addressForm.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }

    if (field.hasError('required')) {
      return '此欄位為必填';
    }

    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `至少需要 ${minLength} 個字元`;
    }

    if (field.hasError('pattern')) {
      if (fieldName === 'recipientPhone') {
        return '請輸入有效的手機號碼 (09xxxxxxxx)';
      }
      if (fieldName === 'postalCode') {
        return '請輸入有效的郵遞區號';
      }
    }

    return '格式錯誤';
  }
}
