/**
 * 購物車服務
 * Cart Service
 *
 * 管理購物車的 CRUD 操作和狀態
 * Manages cart CRUD operations and state
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. LocalStorage 持久化
 * 3. Computed properties 計算購物車總計
 * 4. Mock 資料模擬
 * 5. RxJS 操作符使用
 */

import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, catchError, throwError, tap } from 'rxjs';
import { environment } from '@environments/environment';

// Models
import {
  CartDetail,
  CartItemDetail,
  CartSummary,
  AddToCartRequest,
  UpdateCartItemRequest,
  ShoppingCart,
} from '@core/models/cart.model';
import { ProductListItem } from '@core/models/product.model';
import { ApiResponse } from '@core/models/common.model';

// Services
import { StorageService } from '@core/services/storage.service';

/**
 * 購物車服務
 * Cart service
 */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly apiUrl = `${environment.apiUrl}/cart`;
  private readonly useMock = true; // 使用 Mock 資料 / Use mock data

  /**
   * 狀態 Signals
   * State signals
   */
  private readonly cartItemsSignal = signal<CartItemDetail[]>([]);
  private readonly loadingSignal = signal<boolean>(false);

  /**
   * 唯讀公開的 Signals
   * Readonly public signals
   */
  public readonly cartItems = this.cartItemsSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();

  /**
   * 計算屬性：購物車項目數量
   * Computed: cart items count
   */
  public readonly itemsCount = computed(() => {
    return this.cartItemsSignal().reduce((sum, item) => sum + item.quantity, 0);
  });

  /**
   * 計算屬性：購物車小計
   * Computed: cart subtotal
   */
  public readonly subtotal = computed(() => {
    return this.cartItemsSignal().reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
  });

  /**
   * 計算屬性：預估稅額（5%）
   * Computed: estimated tax (5%)
   */
  public readonly estimatedTax = computed(() => {
    return Math.round(this.subtotal() * 0.05);
  });

  /**
   * 計算屬性：預估運費
   * Computed: estimated shipping
   */
  public readonly estimatedShipping = computed(() => {
    // 滿 1000 免運，否則 100
    return this.subtotal() >= 1000 ? 0 : 100;
  });

  /**
   * 計算屬性：預估總額
   * Computed: estimated total
   */
  public readonly estimatedTotal = computed(() => {
    return this.subtotal() + this.estimatedTax() + this.estimatedShipping();
  });

  /**
   * 計算屬性：購物車摘要
   * Computed: cart summary
   */
  public readonly cartSummary = computed<CartSummary>(() => {
    return {
      itemsCount: this.itemsCount(),
      subtotal: this.subtotal(),
      estimatedTax: this.estimatedTax(),
      estimatedShipping: this.estimatedShipping(),
      estimatedTotal: this.estimatedTotal(),
    };
  });

  /**
   * 建構函式
   * Constructor
   */
  constructor() {
    // 從 LocalStorage 載入購物車
    // Load cart from LocalStorage
    this.loadCartFromStorage();

    // 當購物車變更時，儲存到 LocalStorage
    // Save to LocalStorage when cart changes
    effect(() => {
      const items = this.cartItemsSignal();
      this.storage.set('cart_items', items);
    });
  }

  /**
   * 從 LocalStorage 載入購物車
   * Load cart from LocalStorage
   */
  private loadCartFromStorage(): void {
    const savedItems = this.storage.get<CartItemDetail[]>('cart_items');
    if (savedItems && Array.isArray(savedItems)) {
      this.cartItemsSignal.set(savedItems);
    }
  }

  /**
   * 取得購物車詳情
   * Get cart details
   */
  getCart(): Observable<CartDetail> {
    if (this.useMock) {
      return this.getMockCart();
    }

    return this.http
      .get<ApiResponse<CartDetail>>(`${this.apiUrl}`)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to fetch cart:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 加入商品到購物車
   * Add product to cart
   */
  addToCart(product: ProductListItem, quantity: number = 1): Observable<CartItemDetail> {
    if (this.useMock) {
      return this.mockAddToCart(product, quantity);
    }

    const request: AddToCartRequest = {
      productId: product.id,
      quantity,
    };

    return this.http
      .post<ApiResponse<CartItemDetail>>(`${this.apiUrl}/items`, request)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to add to cart:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 更新購物車項目數量
   * Update cart item quantity
   */
  updateQuantity(cartItemId: string, quantity: number): Observable<CartItemDetail> {
    if (this.useMock) {
      return this.mockUpdateQuantity(cartItemId, quantity);
    }

    const request: UpdateCartItemRequest = {
      cartItemId,
      quantity,
    };

    return this.http
      .put<ApiResponse<CartItemDetail>>(`${this.apiUrl}/items/${cartItemId}`, request)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to update cart item:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 移除購物車項目
   * Remove cart item
   */
  removeItem(cartItemId: string): Observable<void> {
    if (this.useMock) {
      return this.mockRemoveItem(cartItemId);
    }

    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/items/${cartItemId}`)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to remove cart item:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 清空購物車
   * Clear cart
   */
  clearCart(): Observable<void> {
    if (this.useMock) {
      return this.mockClearCart();
    }

    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}`)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to clear cart:', error);
          return throwError(() => error);
        })
      );
  }

  // ==================== Mock 資料方法 / Mock Data Methods ====================

  /**
   * Mock: 取得購物車詳情
   * Mock: Get cart details
   */
  private getMockCart(): Observable<CartDetail> {
    const cartDetail: CartDetail = {
      cart: {
        id: 'cart-1',
        userId: 'user-1',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      items: this.cartItemsSignal(),
      savedForLaterItems: [],
      summary: this.cartSummary(),
    };

    return of(cartDetail).pipe(delay(300));
  }

  /**
   * Mock: 加入商品到購物車
   * Mock: Add product to cart
   */
  private mockAddToCart(product: ProductListItem, quantity: number): Observable<CartItemDetail> {
    // 檢查商品是否已在購物車中
    const existingItemIndex = this.cartItemsSignal().findIndex(
      (item) => item.productId === product.id
    );

    let updatedItem: CartItemDetail;

    if (existingItemIndex >= 0) {
      // 商品已存在，更新數量
      const existingItem = this.cartItemsSignal()[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      updatedItem = {
        ...existingItem,
        quantity: newQuantity,
        subtotal: product.price * newQuantity,
        updatedAt: new Date(),
      };

      const updatedItems = [...this.cartItemsSignal()];
      updatedItems[existingItemIndex] = updatedItem;
      this.cartItemsSignal.set(updatedItems);
    } else {
      // 新增商品
      updatedItem = {
        id: `cart-item-${Date.now()}`,
        cartId: 'cart-1',
        productId: product.id,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
        isSavedForLater: false,
        version: 1,
        addedAt: new Date(),
        updatedAt: new Date(),
        productName: product.name,
        productImageUrl: product.primaryImageUrl,
        productSku: product.sku,
        currentPrice: product.price,
        stockQuantity: product.stockQuantity,
        isInStock: product.stockQuantity > 0,
        isActive: product.isActive,
      };

      this.cartItemsSignal.set([...this.cartItemsSignal(), updatedItem]);
    }

    return of(updatedItem).pipe(delay(300));
  }

  /**
   * Mock: 更新購物車項目數量
   * Mock: Update cart item quantity
   */
  private mockUpdateQuantity(cartItemId: string, quantity: number): Observable<CartItemDetail> {
    const itemIndex = this.cartItemsSignal().findIndex((item) => item.id === cartItemId);

    if (itemIndex < 0) {
      return throwError(() => new Error('Cart item not found'));
    }

    const item = this.cartItemsSignal()[itemIndex];
    const updatedItem: CartItemDetail = {
      ...item,
      quantity,
      subtotal: item.unitPrice * quantity,
      updatedAt: new Date(),
    };

    const updatedItems = [...this.cartItemsSignal()];
    updatedItems[itemIndex] = updatedItem;
    this.cartItemsSignal.set(updatedItems);

    return of(updatedItem).pipe(delay(300));
  }

  /**
   * Mock: 移除購物車項目
   * Mock: Remove cart item
   */
  private mockRemoveItem(cartItemId: string): Observable<void> {
    const updatedItems = this.cartItemsSignal().filter((item) => item.id !== cartItemId);
    this.cartItemsSignal.set(updatedItems);
    return of(void 0).pipe(delay(300));
  }

  /**
   * Mock: 清空購物車
   * Mock: Clear cart
   */
  private mockClearCart(): Observable<void> {
    this.cartItemsSignal.set([]);
    return of(void 0).pipe(delay(300));
  }
}
