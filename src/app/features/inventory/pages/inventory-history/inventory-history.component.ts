/**
 * 庫存歷史查詢組件
 * Inventory History Component
 *
 * 顯示所有庫存交易記錄，支援篩選、排序和分頁
 * Displays all inventory transaction records with filtering, sorting, and pagination
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. 複雜的篩選邏輯
 * 3. 表單與查詢參數同步
 * 4. 分頁處理
 */

import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services and Models
import { InventoryService } from '@core/services/inventory.service';
import {
  InventoryTransactionDetail,
  InventoryTransactionQueryParams,
  InventoryTransactionType,
  InventoryReferenceType,
  InventoryTransactionHelper,
  InventoryStatistics,
} from '@core/models/inventory.model';

// Pipes
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    DatePipe,
  ],
  templateUrl: './inventory-history.component.html',
  styleUrl: './inventory-history.component.scss',
})
export class InventoryHistoryComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * 狀態 Signals
   * State signals
   */
  public readonly transactions = signal<InventoryTransactionDetail[]>([]);
  public readonly loading = signal<boolean>(false);
  public readonly statistics = signal<InventoryStatistics | null>(null);
  public readonly totalCount = signal<number>(0);

  /**
   * 分頁狀態
   * Pagination state
   */
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(20);
  public totalPages = signal<number>(0);

  /**
   * 篩選表單
   * Filter form
   */
  public filterForm!: FormGroup;

  /**
   * 交易類型選項
   * Transaction type options
   */
  public readonly transactionTypes: { value: InventoryTransactionType; label: string }[] =
    [
      { value: 'sale', label: 'inventory.type.sale' },
      { value: 'return', label: 'inventory.type.return' },
      { value: 'adjustment', label: 'inventory.type.adjustment' },
      { value: 'initial', label: 'inventory.type.initial' },
    ];

  /**
   * 參考類型選項
   * Reference type options
   */
  public readonly referenceTypes: { value: InventoryReferenceType; label: string }[] =
    [
      { value: 'order', label: 'inventory.reference.order' },
      { value: 'manual', label: 'inventory.reference.manual' },
      { value: 'system', label: 'inventory.reference.system' },
    ];

  /**
   * 表格顯示欄位
   * Table display columns
   */
  public readonly displayedColumns: string[] = [
    'createdAt',
    'productName',
    'type',
    'quantityChange',
    'beforeQuantity',
    'afterQuantity',
    'referenceNumber',
    'createdByName',
    'note',
  ];

  /**
   * 輔助類別
   * Helper class
   */
  public readonly Helper = InventoryTransactionHelper;

  /**
   * 導出 Object 供模板使用
   * Export Object for template use
   */
  public readonly Object = Object;

  /**
   * 元件初始化
   * Component initialization
   */
  ngOnInit(): void {
    this.initializeForm();
    this.loadTransactions();
    this.loadStatistics();
  }

  /**
   * 初始化篩選表單
   * Initialize filter form
   */
  private initializeForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      type: [null],
      referenceType: [null],
      startDate: [null],
      endDate: [null],
    });

    // 監聽表單變更，自動搜尋
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1); // 重置到第一頁
        this.loadTransactions();
      });
  }

  /**
   * 載入交易列表
   * Load transactions list
   */
  loadTransactions(): void {
    this.loading.set(true);

    const formValue = this.filterForm.value;
    const params: InventoryTransactionQueryParams = {
      search: formValue.search || undefined,
      type: formValue.type || undefined,
      referenceType: formValue.referenceType || undefined,
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    this.inventoryService
      .getTransactions(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.transactions.set(response.transactions);
          this.totalCount.set(response.total);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[InventoryHistory] Failed to load transactions:', err);
          this.loading.set(false);
        },
      });
  }

  /**
   * 載入統計資料
   * Load statistics
   */
  loadStatistics(): void {
    // 載入 iPhone 15 Pro Max 的統計
    this.inventoryService
      .getProductStatistics('1', 'var-1')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.statistics.set(stats);
        },
        error: (err) => {
          console.error('[InventoryHistory] Failed to load statistics:', err);
        },
      });
  }

  /**
   * 處理分頁變更
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadTransactions();
  }

  /**
   * 重置篩選
   * Reset filters
   */
  resetFilters(): void {
    this.filterForm.reset();
  }

  /**
   * 取得交易類型顏色
   * Get transaction type color
   */
  getTypeColor(type: InventoryTransactionType): string {
    return InventoryTransactionHelper.getTypeColor(type);
  }

  /**
   * 取得數量變更的 CSS 類別
   * Get quantity change CSS class
   */
  getQuantityChangeClass(change: number): string {
    if (change > 0) {
      return 'quantity-increase';
    } else if (change < 0) {
      return 'quantity-decrease';
    }
    return 'quantity-neutral';
  }

  /**
   * 導出為 CSV（可選功能）
   * Export to CSV (optional feature)
   */
  exportToCSV(): void {
    console.log('[InventoryHistory] Export to CSV - Not implemented');
    // TODO: 實作 CSV 導出功能
  }
}
