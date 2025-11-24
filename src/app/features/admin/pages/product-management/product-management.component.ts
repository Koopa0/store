/**
 * 商品管理組件
 * Product Management Component
 */

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  MatSlideToggleModule,
  MatSlideToggleChange,
} from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// Services
import { ProductService } from '@features/product/services/product.service';
import { NotificationService } from '@core/services/notification.service';

// Models
import { ProductListItem } from '@core/models/product.model';

// Pipes
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDialogModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.scss',
})
export class ProductManagementComponent {
  private readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  // 顯示的列
  readonly displayedColumns = [
    'image',
    'name',
    'category',
    'price',
    'stock',
    'status',
    'sold',
    'rating',
    'actions',
  ];

  // 搜尋和篩選
  readonly searchTerm = signal('');
  readonly categoryFilter = signal<string>('all');
  readonly statusFilter = signal<string>('all');

  // 分頁
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  // 所有商品資料
  private readonly allProducts = signal<ProductListItem[]>([]);

  // 篩選後的商品
  readonly filteredProducts = computed(() => {
    let products = this.allProducts();

    // 搜尋過濾
    const search = this.searchTerm().toLowerCase();
    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.summary?.toLowerCase().includes(search) ||
          p.categoryName.toLowerCase().includes(search)
      );
    }

    // 分類過濾
    if (this.categoryFilter() !== 'all') {
      products = products.filter(
        (p) => p.categoryPath === this.categoryFilter()
      );
    }

    // 狀態過濾
    if (this.statusFilter() !== 'all') {
      const isActive = this.statusFilter() === 'active';
      products = products.filter((p) => p.isActive === isActive);
    }

    return products;
  });

  // 分頁後的商品
  readonly pagedProducts = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredProducts().slice(start, end);
  });

  // 總數
  readonly totalProducts = computed(() => this.filteredProducts().length);

  // 分類列表（用於篩選下拉選單）
  readonly categories = [
    { value: 'all', label: '全部分類' },
    { value: 'electronics', label: '電子產品' },
    { value: 'fashion', label: '時尚服飾' },
    { value: 'home', label: '居家生活' },
    { value: 'sports', label: '運動戶外' },
    { value: 'books', label: '書籍文具' },
    { value: 'food', label: '食品飲料' },
    { value: 'beauty', label: '美妝保養' },
    { value: 'toys', label: '玩具遊戲' },
  ];

  constructor() {
    this.loadProducts();
  }

  /**
   * 載入商品資料
   */
  loadProducts(): void {
    this.productService.getProducts({}).subscribe({
      next: (response) => {
        this.allProducts.set(response.items);
      },
      error: (error) => {
        this.notificationService.error('載入商品失敗');
        console.error('Error loading products:', error);
      },
    });
  }

  /**
   * 分頁變更
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  /**
   * 重置篩選
   */
  resetFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('all');
    this.statusFilter.set('all');
    this.pageIndex.set(0);
  }

  /**
   * 導航到新增商品頁面
   */
  goToCreateProduct(): void {
    this.notificationService.info('商品新增功能開發中...');
    // TODO: 實作新增商品頁面
    // this.router.navigate(['/admin/products/create']);
  }

  /**
   * 導航到編輯商品頁面
   */
  goToEditProduct(productId: string): void {
    this.notificationService.info('商品編輯功能開發中...');
    // TODO: 實作編輯商品頁面
    // this.router.navigate(['/admin/products/edit', productId]);
  }

  /**
   * 查看商品詳情
   */
  viewProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  /**
   * 切換商品狀態（上架/下架）
   */
  toggleProductStatus(
    product: ProductListItem,
    event: MatSlideToggleChange
  ): void {
    // TODO: 整合真實 API
    const newStatus = event.checked;
    const statusText = newStatus ? '上架' : '下架';

    this.notificationService.success(`商品已${statusText}`);

    // 更新本地資料
    const products = this.allProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      products[index] = { ...products[index], isActive: newStatus };
      this.allProducts.set([...products]);
    }
  }

  /**
   * 刪除商品
   */
  deleteProduct(product: ProductListItem): void {
    if (
      confirm(
        `確定要刪除商品「${product.name}」嗎？\n此操作無法復原。`
      )
    ) {
      // TODO: 整合真實 API
      this.notificationService.success('商品已刪除');

      // 更新本地資料
      const products = this.allProducts().filter((p) => p.id !== product.id);
      this.allProducts.set(products);
    }
  }

  /**
   * 批量刪除
   */
  bulkDelete(): void {
    this.notificationService.info('批量操作功能開發中...');
    // TODO: 實作批量刪除
  }

  /**
   * 匯出商品資料
   */
  exportProducts(): void {
    this.notificationService.info('匯出功能開發中...');
    // TODO: 實作匯出功能
  }

  /**
   * 獲取庫存狀態文字
   */
  getStockStatus(stock: number): string {
    if (stock === 0) return '缺貨';
    if (stock < 10) return '庫存不足';
    return '正常';
  }

  /**
   * 獲取庫存狀態顏色
   */
  getStockStatusColor(stock: number): string {
    if (stock === 0) return '#d32f2f';
    if (stock < 10) return '#f57c00';
    return '#388e3c';
  }
}
