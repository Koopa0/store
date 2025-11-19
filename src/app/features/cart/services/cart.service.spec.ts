/**
 * CartService 單元測試
 * CartService Unit Tests
 *
 * 測試覆蓋：
 * - 購物車項目管理（新增、更新、移除、清空）
 * - 計算屬性（總計、稅額、運費）
 * - LocalStorage 持久化
 * - Signal 狀態管理
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CartService } from './cart.service';
import { StorageService } from '@core/services/storage.service';
import { CartItemDetail } from '@core/models/cart.model';
import { ProductListItem } from '@core/models/product.model';

describe('CartService', () => {
  let service: CartService;
  let storageService: jasmine.SpyObj<StorageService>;

  // Mock 商品資料
  const mockProduct1: ProductListItem = {
    id: 'product-1',
    name: 'Test Product 1',
    slug: 'test-product-1',
    sku: 'SKU-001',
    price: 100,
    primaryImageUrl: 'https://example.com/image1.jpg',
    stockQuantity: 10,
    isActive: true,
    isFeatured: false,
    categoryName: 'Test Category',
    categoryPath: 'test',
    brandName: 'Test Brand',
    ratingAverage: 4.5,
    reviewCount: 10,
    totalSold: 50,
    totalRevenue: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct2: ProductListItem = {
    id: 'product-2',
    name: 'Test Product 2',
    slug: 'test-product-2',
    sku: 'SKU-002',
    price: 200,
    primaryImageUrl: 'https://example.com/image2.jpg',
    stockQuantity: 5,
    isActive: true,
    isFeatured: false,
    categoryName: 'Test Category',
    categoryPath: 'test',
    brandName: 'Test Brand',
    ratingAverage: 4.0,
    reviewCount: 5,
    totalSold: 20,
    totalRevenue: 4000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCartItem: CartItemDetail = {
    id: 'cart-item-1',
    cartId: 'cart-1',
    productId: 'product-1',
    quantity: 2,
    unitPrice: 100,
    subtotal: 200,
    isSavedForLater: false,
    version: 1,
    addedAt: new Date(),
    updatedAt: new Date(),
    productName: 'Test Product 1',
    productImageUrl: 'https://example.com/image1.jpg',
    productSku: 'SKU-001',
    currentPrice: 100,
    stockQuantity: 10,
    isInStock: true,
    isActive: true,
  };

  beforeEach(() => {
    // 創建 StorageService spy
    const storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'get',
      'set',
      'remove',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        { provide: StorageService, useValue: storageServiceSpy },
      ],
    });

    // 預設返回空購物車
    storageServiceSpy.get.and.returnValue(null);

    service = TestBed.inject(CartService);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
  });

  describe('初始化 (Initialization)', () => {
    it('應該成功創建服務', () => {
      expect(service).toBeTruthy();
    });

    it('初始狀態應該為空購物車', () => {
      expect(service.cartItems()).toEqual([]);
      expect(service.itemsCount()).toBe(0);
      expect(service.subtotal()).toBe(0);
      expect(service.estimatedTax()).toBe(0);
      expect(service.estimatedTotal()).toBe(100); // 空購物車還是有運費 100
    });

    it('應該從 localStorage 載入購物車', () => {
      const savedItems = [mockCartItem];
      storageService.get.and.returnValue(savedItems);

      const newService = TestBed.inject(CartService);

      expect(newService.cartItems().length).toBe(1);
      expect(newService.cartItems()[0].productId).toBe('product-1');
    });

    it('應該處理無效的 localStorage 資料', () => {
      storageService.get.and.returnValue('invalid-data');

      const newService = TestBed.inject(CartService);

      expect(newService.cartItems()).toEqual([]);
    });
  });

  describe('加入商品到購物車 (Add to Cart)', () => {
    it('應該成功加入新商品', fakeAsync(() => {
      let result: CartItemDetail | undefined;

      service.addToCart(mockProduct1, 2).subscribe((item) => {
        result = item;
      });

      tick(300);

      expect(result).toBeDefined();
      expect(result!.productId).toBe('product-1');
      expect(result!.quantity).toBe(2);
      expect(result!.subtotal).toBe(200);

      expect(service.cartItems().length).toBe(1);
      expect(service.itemsCount()).toBe(2);
      expect(service.subtotal()).toBe(200);

      flush();
    }));

    it('應該合併相同商品的數量', fakeAsync(() => {
      // 第一次加入 2 個
      service.addToCart(mockProduct1, 2).subscribe();
      tick(300);

      // 第二次再加入 3 個
      service.addToCart(mockProduct1, 3).subscribe();
      tick(300);

      expect(service.cartItems().length).toBe(1);
      expect(service.cartItems()[0].quantity).toBe(5);
      expect(service.cartItems()[0].subtotal).toBe(500);
      expect(service.itemsCount()).toBe(5);

      flush();
    }));

    it('應該支援加入多個不同商品', fakeAsync(() => {
      service.addToCart(mockProduct1, 1).subscribe();
      tick(300);

      service.addToCart(mockProduct2, 2).subscribe();
      tick(300);

      expect(service.cartItems().length).toBe(2);
      expect(service.itemsCount()).toBe(3);
      expect(service.subtotal()).toBe(500); // 100 * 1 + 200 * 2

      flush();
    }));

    it('應該支援相同商品不同變體', fakeAsync(() => {
      service.addToCart(mockProduct1, 1, 'variant-1', { size: 'S' }).subscribe();
      tick(300);

      service.addToCart(mockProduct1, 1, 'variant-2', { size: 'M' }).subscribe();
      tick(300);

      expect(service.cartItems().length).toBe(2);
      expect(service.itemsCount()).toBe(2);

      flush();
    }));

    it('應該在加入商品時儲存到 localStorage', fakeAsync(() => {
      service.addToCart(mockProduct1, 1).subscribe();
      tick(300);

      expect(storageService.set).toHaveBeenCalledWith(
        'cart_items',
        jasmine.any(Array)
      );

      flush();
    }));
  });

  describe('更新購物車項目 (Update Cart Item)', () => {
    beforeEach(fakeAsync(() => {
      service.addToCart(mockProduct1, 2).subscribe();
      tick(300);
      flush();

      // 重置 spy 計數
      storageService.set.calls.reset();
    }));

    it('應該成功更新項目數量', fakeAsync(() => {
      const cartItemId = service.cartItems()[0].id;
      let result: CartItemDetail | undefined;

      service.updateQuantity(cartItemId, 5).subscribe((item) => {
        result = item;
      });

      tick(300);

      expect(result).toBeDefined();
      expect(result!.quantity).toBe(5);
      expect(result!.subtotal).toBe(500);

      expect(service.cartItems()[0].quantity).toBe(5);
      expect(service.itemsCount()).toBe(5);
      expect(service.subtotal()).toBe(500);

      flush();
    }));

    it('應該處理更新不存在的項目', fakeAsync(() => {
      let error: any;

      service.updateQuantity('nonexistent-id', 5).subscribe({
        next: () => fail('應該拋出錯誤'),
        error: (err) => {
          error = err;
        },
      });

      tick(300);

      expect(error).toBeDefined();
      expect(error.message).toContain('not found');

      flush();
    }));

    it('應該在更新時儲存到 localStorage', fakeAsync(() => {
      const cartItemId = service.cartItems()[0].id;

      service.updateQuantity(cartItemId, 5).subscribe();
      tick(300);

      expect(storageService.set).toHaveBeenCalled();

      flush();
    }));
  });

  describe('移除購物車項目 (Remove Cart Item)', () => {
    beforeEach(fakeAsync(() => {
      service.addToCart(mockProduct1, 2).subscribe();
      tick(300);
      service.addToCart(mockProduct2, 1).subscribe();
      tick(300);
      flush();
    }));

    it('應該成功移除項目', fakeAsync(() => {
      const cartItemId = service.cartItems()[0].id;

      service.removeItem(cartItemId).subscribe();
      tick(300);

      expect(service.cartItems().length).toBe(1);
      expect(service.cartItems()[0].productId).toBe('product-2');

      flush();
    }));

    it('應該正確更新計算屬性', fakeAsync(() => {
      const cartItemId = service.cartItems()[0].id;

      service.removeItem(cartItemId).subscribe();
      tick(300);

      expect(service.itemsCount()).toBe(1);
      expect(service.subtotal()).toBe(200);

      flush();
    }));

    it('應該處理移除不存在的項目', fakeAsync(() => {
      const initialLength = service.cartItems().length;

      service.removeItem('nonexistent-id').subscribe();
      tick(300);

      expect(service.cartItems().length).toBe(initialLength);

      flush();
    }));
  });

  describe('清空購物車 (Clear Cart)', () => {
    beforeEach(fakeAsync(() => {
      service.addToCart(mockProduct1, 2).subscribe();
      tick(300);
      service.addToCart(mockProduct2, 1).subscribe();
      tick(300);
      flush();
    }));

    it('應該清空所有項目', fakeAsync(() => {
      service.clearCart().subscribe();
      tick(300);

      expect(service.cartItems().length).toBe(0);
      expect(service.itemsCount()).toBe(0);
      expect(service.subtotal()).toBe(0);

      flush();
    }));

    it('應該在清空時更新 localStorage', fakeAsync(() => {
      storageService.set.calls.reset();

      service.clearCart().subscribe();
      tick(300);

      expect(storageService.set).toHaveBeenCalled();

      flush();
    }));
  });

  describe('計算屬性 (Computed Properties)', () => {
    beforeEach(fakeAsync(() => {
      // 加入商品：100 * 2 + 200 * 3 = 800
      service.addToCart(mockProduct1, 2).subscribe();
      tick(300);
      service.addToCart(mockProduct2, 3).subscribe();
      tick(300);
      flush();
    }));

    it('itemsCount 應該計算總數量', () => {
      expect(service.itemsCount()).toBe(5); // 2 + 3
    });

    it('subtotal 應該計算小計', () => {
      expect(service.subtotal()).toBe(800); // 100*2 + 200*3
    });

    it('estimatedTax 應該計算稅額（5%）', () => {
      expect(service.estimatedTax()).toBe(40); // 800 * 0.05 = 40
    });

    it('estimatedShipping 應該在未滿 1000 時收取 100 運費', () => {
      expect(service.estimatedShipping()).toBe(100);
    });

    it('estimatedShipping 應該在滿 1000 時免運', fakeAsync(() => {
      // 清空並加入 1000 元商品
      service.clearCart().subscribe();
      tick(300);

      const expensiveProduct: ProductListItem = {
        ...mockProduct1,
        price: 1000,
      };

      service.addToCart(expensiveProduct, 1).subscribe();
      tick(300);

      expect(service.estimatedShipping()).toBe(0);

      flush();
    }));

    it('estimatedTotal 應該計算總額', () => {
      // 800 + 40 (稅) + 100 (運費) = 940
      expect(service.estimatedTotal()).toBe(940);
    });

    it('cartSummary 應該包含所有摘要資訊', () => {
      const summary = service.cartSummary();

      expect(summary.itemsCount).toBe(5);
      expect(summary.subtotal).toBe(800);
      expect(summary.estimatedTax).toBe(40);
      expect(summary.estimatedShipping).toBe(100);
      expect(summary.estimatedTotal).toBe(940);
    });
  });

  describe('取得購物車詳情 (Get Cart)', () => {
    it('應該返回完整購物車詳情', fakeAsync(() => {
      let cartDetail: any;

      service.getCart().subscribe((detail) => {
        cartDetail = detail;
      });

      tick(300);

      expect(cartDetail).toBeDefined();
      expect(cartDetail.cart).toBeDefined();
      expect(cartDetail.items).toBeDefined();
      expect(cartDetail.summary).toBeDefined();

      flush();
    }));

    it('購物車詳情應包含正確的摘要', fakeAsync(() => {
      service.addToCart(mockProduct1, 2).subscribe();
      tick(300);

      let cartDetail: any;
      service.getCart().subscribe((detail) => {
        cartDetail = detail;
      });
      tick(300);

      expect(cartDetail.summary.itemsCount).toBe(2);
      expect(cartDetail.summary.subtotal).toBe(200);

      flush();
    }));
  });

  describe('邊界情況 (Edge Cases)', () => {
    it('應該處理數量為 0 的商品', fakeAsync(() => {
      service.addToCart(mockProduct1, 0).subscribe();
      tick(300);

      expect(service.itemsCount()).toBe(0);
      expect(service.subtotal()).toBe(0);

      flush();
    }));

    it('應該處理負數數量', fakeAsync(() => {
      service.addToCart(mockProduct1, 2).subscribe();
      tick(300);

      const cartItemId = service.cartItems()[0].id;
      service.updateQuantity(cartItemId, -1).subscribe();
      tick(300);

      // 負數數量應該更新，但計算會得到負數
      expect(service.cartItems()[0].quantity).toBe(-1);

      flush();
    }));

    it('空購物車應有基本運費', () => {
      expect(service.cartItems().length).toBe(0);
      expect(service.estimatedShipping()).toBe(100);
      expect(service.estimatedTotal()).toBe(100); // 0 + 0 + 100
    });

    it('計算屬性應該即時更新', fakeAsync(() => {
      expect(service.itemsCount()).toBe(0);

      service.addToCart(mockProduct1, 1).subscribe();
      tick(300);

      expect(service.itemsCount()).toBe(1);

      service.addToCart(mockProduct1, 2).subscribe();
      tick(300);

      expect(service.itemsCount()).toBe(3);

      flush();
    }));
  });

  describe('LocalStorage 持久化 (LocalStorage Persistence)', () => {
    it('購物車變更應觸發 storage 寫入', fakeAsync(() => {
      storageService.set.calls.reset();

      service.addToCart(mockProduct1, 1).subscribe();
      tick(300);

      expect(storageService.set).toHaveBeenCalled();

      flush();
    }));

    it('從 storage 載入後應保持狀態一致', () => {
      const savedItems = [
        {
          ...mockCartItem,
          quantity: 3,
          subtotal: 300,
        },
      ];

      storageService.get.and.returnValue(savedItems);

      const newService = TestBed.inject(CartService);

      expect(newService.itemsCount()).toBe(3);
      expect(newService.subtotal()).toBe(300);
    });
  });
});
