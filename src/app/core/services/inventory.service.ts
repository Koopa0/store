/**
 * 庫存交易服務
 * Inventory Transaction Service
 *
 * 提供庫存交易的 CRUD 操作與統計功能
 * Provides CRUD operations and statistics for inventory transactions
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. 分頁與篩選邏輯
 * 3. 庫存統計計算
 * 4. Mock 資料模擬真實場景
 */

import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';

// Models
import {
  InventoryTransaction,
  InventoryTransactionDetail,
  CreateInventoryTransactionRequest,
  InventoryTransactionQueryParams,
  InventoryTransactionListResponse,
  InventoryStatistics,
  InventoryTransactionHelper,
  InventoryTransactionType,
  InventoryReferenceType,
} from '@core/models/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  /**
   * 交易列表 Signal
   * Transactions list signal
   */
  private readonly transactionsSignal = signal<InventoryTransactionDetail[]>([]);

  /**
   * 載入中 Signal
   * Loading signal
   */
  private readonly loadingSignal = signal<boolean>(false);

  /**
   * 統計資料 Signal
   * Statistics signal
   */
  private readonly statisticsSignal = signal<InventoryStatistics | null>(null);

  /**
   * 公開的只讀 Signal
   * Public readonly signals
   */
  public readonly transactions = this.transactionsSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly statistics = this.statisticsSignal.asReadonly();

  /**
   * 總交易數計算屬性
   * Total transactions computed property
   */
  public readonly totalTransactions = computed(() => {
    return this.transactionsSignal().length;
  });

  /**
   * 建構函式
   * Constructor
   */
  constructor() {
    // 初始化載入交易資料
    this.loadTransactions();
  }

  /**
   * 載入交易列表
   * Load transactions list
   */
  private loadTransactions(): void {
    this.loadingSignal.set(true);

    this.getMockTransactions()
      .pipe(delay(300))
      .subscribe({
        next: (transactions) => {
          const details = transactions.map((t) =>
            InventoryTransactionHelper.toDetail(t)
          );
          this.transactionsSignal.set(details);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          console.error('[InventoryService] Failed to load transactions:', err);
          this.loadingSignal.set(false);
        },
      });
  }

  /**
   * 取得庫存交易列表（帶分頁與篩選）
   * Get inventory transactions list (with pagination and filtering)
   */
  getTransactions(
    params: InventoryTransactionQueryParams = {}
  ): Observable<InventoryTransactionListResponse> {
    this.loadingSignal.set(true);

    return this.getMockTransactions().pipe(
      delay(300),
      map((transactions) => {
        let filtered = transactions;

        // 商品 ID 篩選
        if (params.productId) {
          filtered = filtered.filter((t) => t.productId === params.productId);
        }

        // 變體 ID 篩選
        if (params.variantId) {
          filtered = filtered.filter((t) => t.variantId === params.variantId);
        }

        // 交易類型篩選
        if (params.type) {
          filtered = filtered.filter((t) => t.type === params.type);
        }

        // 參考類型篩選
        if (params.referenceType) {
          filtered = filtered.filter((t) => t.referenceType === params.referenceType);
        }

        // 日期範圍篩選
        if (params.startDate) {
          filtered = filtered.filter(
            (t) => new Date(t.createdAt) >= params.startDate!
          );
        }
        if (params.endDate) {
          filtered = filtered.filter((t) => new Date(t.createdAt) <= params.endDate!);
        }

        // 搜尋關鍵字篩選
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.productName.toLowerCase().includes(searchLower) ||
              t.productSku.toLowerCase().includes(searchLower) ||
              t.referenceNumber?.toLowerCase().includes(searchLower) ||
              t.note.toLowerCase().includes(searchLower)
          );
        }

        // 排序
        const sortBy = params.sortBy || 'createdAt';
        const sortOrder = params.sortOrder || 'desc';

        filtered.sort((a, b) => {
          let aValue: any = a[sortBy];
          let bValue: any = b[sortBy];

          if (sortBy === 'createdAt') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        // 分頁
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedTransactions = filtered.slice(startIndex, endIndex);

        // 轉換為詳情格式
        const details = paginatedTransactions.map((t) =>
          InventoryTransactionHelper.toDetail(t)
        );

        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);

        this.transactionsSignal.set(details);
        this.loadingSignal.set(false);

        return {
          transactions: details,
          total,
          page,
          pageSize,
          totalPages,
          hasNext: page < totalPages,
        };
      })
    );
  }

  /**
   * 取得單筆交易
   * Get single transaction
   */
  getTransaction(id: string): Observable<InventoryTransactionDetail> {
    return this.getMockTransactions().pipe(
      delay(200),
      map((transactions) => {
        const transaction = transactions.find((t) => t.id === id);
        if (!transaction) {
          throw new Error(`Transaction not found: ${id}`);
        }
        return InventoryTransactionHelper.toDetail(transaction);
      })
    );
  }

  /**
   * 創建庫存交易
   * Create inventory transaction
   */
  createTransaction(
    request: CreateInventoryTransactionRequest
  ): Observable<InventoryTransactionDetail> {
    return this.getMockTransactions().pipe(
      delay(500),
      map((transactions) => {
        // 找到對應商品
        const productTransactions = transactions.filter(
          (t) => t.productId === request.productId
        );

        // 計算當前庫存
        const currentStock = this.calculateCurrentStock(productTransactions);
        const newStock = currentStock + request.quantityChange;

        // 創建新交易
        const newTransaction: InventoryTransaction = {
          id: `txn-${Date.now()}`,
          productId: request.productId,
          productName: 'iPhone 15 Pro Max', // Mock
          productSku: 'APPLE-IP15PM-256-TIT', // Mock
          variantId: request.variantId,
          variantAttributes: request.variantId
            ? { 顏色: '原色鈦金屬', 容量: '256GB' }
            : undefined,
          type: request.type,
          quantityChange: request.quantityChange,
          beforeQuantity: currentStock,
          afterQuantity: newStock,
          referenceType: request.referenceType,
          referenceId: request.referenceId,
          referenceNumber: request.referenceNumber,
          note: request.note,
          createdBy: 'current-user', // Mock
          createdByName: '系統管理員', // Mock
          createdAt: new Date(),
          version: 1,
        };

        // 加入列表
        const updatedTransactions = [newTransaction, ...transactions];
        const details = updatedTransactions.map((t) =>
          InventoryTransactionHelper.toDetail(t)
        );
        this.transactionsSignal.set(details);

        console.log('[InventoryService] Transaction created:', newTransaction);
        return InventoryTransactionHelper.toDetail(newTransaction);
      })
    );
  }

  /**
   * 取得商品庫存統計
   * Get product inventory statistics
   */
  getProductStatistics(
    productId: string,
    variantId?: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Observable<InventoryStatistics> {
    return this.getMockTransactions().pipe(
      delay(300),
      map((transactions) => {
        // 篩選該商品的交易
        let filtered = transactions.filter((t) => t.productId === productId);

        if (variantId) {
          filtered = filtered.filter((t) => t.variantId === variantId);
        }

        // 日期範圍篩選
        const start = periodStart || new Date(0);
        const end = periodEnd || new Date();
        filtered = filtered.filter((t) => {
          const txDate = new Date(t.createdAt);
          return txDate >= start && txDate <= end;
        });

        // 計算統計
        let totalSales = 0;
        let totalReturns = 0;
        let totalAdjustments = 0;
        let lastTransactionAt: Date | undefined;

        filtered.forEach((t) => {
          if (t.type === 'sale') {
            totalSales += Math.abs(t.quantityChange);
          } else if (t.type === 'return') {
            totalReturns += Math.abs(t.quantityChange);
          } else if (t.type === 'adjustment') {
            totalAdjustments += t.quantityChange;
          }

          if (!lastTransactionAt || new Date(t.createdAt) > lastTransactionAt) {
            lastTransactionAt = new Date(t.createdAt);
          }
        });

        const currentStock = this.calculateCurrentStock(filtered);

        const statistics: InventoryStatistics = {
          productId,
          variantId,
          currentStock,
          totalSales,
          totalReturns,
          totalAdjustments,
          lastTransactionAt,
          periodStart: start,
          periodEnd: end,
        };

        this.statisticsSignal.set(statistics);
        return statistics;
      })
    );
  }

  /**
   * 計算當前庫存
   * Calculate current stock
   */
  private calculateCurrentStock(transactions: InventoryTransaction[]): number {
    return transactions.reduce((acc, t) => acc + t.quantityChange, 0);
  }

  /**
   * 取得 Mock 交易資料
   * Get mock transaction data
   */
  private getMockTransactions(): Observable<InventoryTransaction[]> {
    const now = new Date();
    const mockTransactions: InventoryTransaction[] = [
      // 初始庫存
      {
        id: 'txn-1',
        productId: '1',
        productName: 'iPhone 15 Pro Max',
        productSku: 'APPLE-IP15PM-256-TIT',
        variantId: 'var-1',
        variantAttributes: { 顏色: '原色鈦金屬', 容量: '256GB' },
        type: 'initial',
        quantityChange: 100,
        beforeQuantity: 0,
        afterQuantity: 100,
        referenceType: 'system',
        referenceId: 'init-1',
        referenceNumber: 'INIT-20241101-00001',
        note: '期初建立庫存',
        createdBy: 'system',
        createdByName: '系統',
        createdAt: new Date('2024-11-01T00:00:00'),
        version: 1,
      },
      // 銷售出庫
      {
        id: 'txn-2',
        productId: '1',
        productName: 'iPhone 15 Pro Max',
        productSku: 'APPLE-IP15PM-256-TIT',
        variantId: 'var-1',
        variantAttributes: { 顏色: '原色鈦金屬', 容量: '256GB' },
        type: 'sale',
        quantityChange: -2,
        beforeQuantity: 100,
        afterQuantity: 98,
        referenceType: 'order',
        referenceId: 'order-1',
        referenceNumber: 'ORD-20241105-00001',
        note: '訂單銷售出庫',
        createdBy: 'user-1',
        createdByName: '王小明',
        createdAt: new Date('2024-11-05T10:30:00'),
        version: 1,
      },
      {
        id: 'txn-3',
        productId: '1',
        productName: 'iPhone 15 Pro Max',
        productSku: 'APPLE-IP15PM-256-TIT',
        variantId: 'var-1',
        variantAttributes: { 顏色: '原色鈦金屬', 容量: '256GB' },
        type: 'sale',
        quantityChange: -1,
        beforeQuantity: 98,
        afterQuantity: 97,
        referenceType: 'order',
        referenceId: 'order-2',
        referenceNumber: 'ORD-20241106-00002',
        note: '訂單銷售出庫',
        createdBy: 'user-2',
        createdByName: '李小華',
        createdAt: new Date('2024-11-06T14:20:00'),
        version: 1,
      },
      // 退貨入庫
      {
        id: 'txn-4',
        productId: '1',
        productName: 'iPhone 15 Pro Max',
        productSku: 'APPLE-IP15PM-256-TIT',
        variantId: 'var-1',
        variantAttributes: { 顏色: '原色鈦金屬', 容量: '256GB' },
        type: 'return',
        quantityChange: 1,
        beforeQuantity: 97,
        afterQuantity: 98,
        referenceType: 'order',
        referenceId: 'order-1',
        referenceNumber: 'ORD-20241105-00001',
        note: '客戶退貨，商品完好',
        createdBy: 'admin-1',
        createdByName: '客服專員',
        createdAt: new Date('2024-11-08T09:15:00'),
        version: 1,
      },
      // 手動調整
      {
        id: 'txn-5',
        productId: '1',
        productName: 'iPhone 15 Pro Max',
        productSku: 'APPLE-IP15PM-256-TIT',
        variantId: 'var-1',
        variantAttributes: { 顏色: '原色鈦金屬', 容量: '256GB' },
        type: 'adjustment',
        quantityChange: -3,
        beforeQuantity: 98,
        afterQuantity: 95,
        referenceType: 'manual',
        referenceId: 'adj-1',
        referenceNumber: 'ADJ-20241110-00001',
        note: '盤點發現損壞品，扣除庫存',
        createdBy: 'admin-2',
        createdByName: '倉庫管理員',
        createdAt: new Date('2024-11-10T16:45:00'),
        version: 1,
      },
      {
        id: 'txn-6',
        productId: '1',
        productName: 'iPhone 15 Pro Max',
        productSku: 'APPLE-IP15PM-256-TIT',
        variantId: 'var-1',
        variantAttributes: { 顏色: '原色鈦金屬', 容量: '256GB' },
        type: 'adjustment',
        quantityChange: 50,
        beforeQuantity: 95,
        afterQuantity: 145,
        referenceType: 'manual',
        referenceId: 'adj-2',
        referenceNumber: 'ADJ-20241115-00002',
        note: '進貨補充庫存',
        createdBy: 'admin-2',
        createdByName: '倉庫管理員',
        createdAt: new Date('2024-11-15T11:00:00'),
        version: 1,
      },
      // 最近的銷售
      {
        id: 'txn-7',
        productId: '1',
        productName: 'iPhone 15 Pro Max',
        productSku: 'APPLE-IP15PM-256-TIT',
        variantId: 'var-1',
        variantAttributes: { 顏色: '原色鈦金屬', 容量: '256GB' },
        type: 'sale',
        quantityChange: -2,
        beforeQuantity: 145,
        afterQuantity: 143,
        referenceType: 'order',
        referenceId: 'order-3',
        referenceNumber: 'ORD-20241118-00003',
        note: '訂單銷售出庫',
        createdBy: 'user-3',
        createdByName: '張小美',
        createdAt: new Date('2024-11-18T13:30:00'),
        version: 1,
      },
    ];

    return of(mockTransactions);
  }
}
