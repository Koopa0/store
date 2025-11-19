/**
 * 評價表單對話框組件
 * Review Form Dialog Component
 *
 * 用於新增或編輯商品評價
 * Used for adding or editing product reviews
 *
 * 教學重點 / Teaching Points:
 * 1. Material Dialog 使用
 * 2. Reactive Forms 表單驗證
 * 3. 星級評分輸入
 * 4. 圖片上傳（模擬）
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

// Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Models
import {
  ProductReviewDetail,
  AddReviewRequest,
  UpdateReviewRequest,
} from '@core/models/review.model';

// Pipes
import { TranslateModule } from '@ngx-translate/core';

/**
 * 對話框資料介面
 * Dialog data interface
 */
export interface ReviewFormDialogData {
  /** 模式：add 或 edit */
  mode: 'add' | 'edit';
  /** 商品 ID（新增時需要）*/
  productId?: string;
  /** 訂單 ID（新增時需要）*/
  orderId?: string;
  /** 評價資料（編輯時需要）*/
  review?: ProductReviewDetail;
}

@Component({
  selector: 'app-review-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './review-form-dialog.component.html',
  styleUrl: './review-form-dialog.component.scss',
})
export class ReviewFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  public readonly dialogRef = inject(MatDialogRef<ReviewFormDialogComponent>);
  public readonly data = inject<ReviewFormDialogData>(MAT_DIALOG_DATA);

  /**
   * 表單
   * Form
   */
  public reviewForm!: FormGroup;

  /**
   * 提交中狀態
   * Submitting state
   */
  public submitting = false;

  /**
   * 星級評分選項
   * Star rating options
   */
  public readonly ratingOptions = [1, 2, 3, 4, 5];

  /**
   * 當前滑鼠懸停的星級
   * Current hovered star rating
   */
  public hoveredRating: number | null = null;

  /**
   * 上傳的圖片 URLs（模擬）
   * Uploaded image URLs (mock)
   */
  public uploadedImages: string[] = [];

  /**
   * 元件初始化
   * Component initialization
   */
  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * 初始化表單
   * Initialize form
   */
  private initializeForm(): void {
    const isEditMode = this.data.mode === 'edit';
    const review = this.data.review;

    this.reviewForm = this.fb.group({
      rating: [
        isEditMode ? review?.rating : null,
        [Validators.required, Validators.min(1), Validators.max(5)],
      ],
      title: [
        isEditMode ? review?.title : '',
        [Validators.required, Validators.minLength(5), Validators.maxLength(100)],
      ],
      content: [
        isEditMode ? review?.content : '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(1000)],
      ],
    });

    // 如果是編輯模式，載入現有圖片
    if (isEditMode && review?.images) {
      this.uploadedImages = [...review.images];
    }
  }

  /**
   * 設定星級評分
   * Set star rating
   */
  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  /**
   * 設定懸停星級
   * Set hovered star rating
   */
  setHoveredRating(rating: number | null): void {
    this.hoveredRating = rating;
  }

  /**
   * 取得當前評分（用於顯示）
   * Get current rating (for display)
   */
  getCurrentRating(): number {
    return this.hoveredRating ?? this.reviewForm.get('rating')?.value ?? 0;
  }

  /**
   * 檢查星星是否應該填滿
   * Check if star should be filled
   */
  isStarFilled(rating: number): boolean {
    return rating <= this.getCurrentRating();
  }

  /**
   * 模擬圖片上傳
   * Mock image upload
   */
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    // 限制最多 5 張圖片
    const remainingSlots = 5 - this.uploadedImages.length;
    const filesToProcess = Math.min(input.files.length, remainingSlots);

    // 模擬上傳：實際應該上傳到雲端儲存並取得 URL
    for (let i = 0; i < filesToProcess; i++) {
      const file = input.files[i];
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.uploadedImages.push(e.target.result as string);
        }
      };

      reader.readAsDataURL(file);
    }

    // 清空 input，允許重新選擇相同檔案
    input.value = '';
  }

  /**
   * 移除圖片
   * Remove image
   */
  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
  }

  /**
   * 觸發檔案選擇
   * Trigger file selection
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById('review-image-input') as HTMLInputElement;
    fileInput?.click();
  }

  /**
   * 取得表單控制項
   * Get form control
   */
  getControl(name: string) {
    return this.reviewForm.get(name);
  }

  /**
   * 檢查欄位是否有錯誤
   * Check if field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const control = this.reviewForm.get(fieldName);
    return !!(control?.hasError(errorType) && control?.touched);
  }

  /**
   * 取得剩餘字數
   * Get remaining characters
   */
  getRemainingChars(fieldName: string, maxLength: number): number {
    const value = this.reviewForm.get(fieldName)?.value || '';
    return maxLength - value.length;
  }

  /**
   * 提交表單
   * Submit form
   */
  onSubmit(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const formValue = this.reviewForm.value;

    if (this.data.mode === 'add') {
      const request: AddReviewRequest = {
        productId: this.data.productId!,
        orderId: this.data.orderId!,
        rating: formValue.rating,
        title: formValue.title,
        content: formValue.content,
        images: this.uploadedImages.length > 0 ? this.uploadedImages : undefined,
      };

      // 返回給父組件處理
      this.dialogRef.close(request);
    } else {
      const request: UpdateReviewRequest = {
        id: this.data.review!.id,
        rating: formValue.rating,
        title: formValue.title,
        content: formValue.content,
        images: this.uploadedImages.length > 0 ? this.uploadedImages : undefined,
      };

      // 返回給父組件處理
      this.dialogRef.close(request);
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
    return this.data.mode === 'add' ? 'review.write_review' : 'review.edit_review';
  }
}
