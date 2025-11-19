/**
 * 商品服務
 * Product Service
 *
 * 管理商品資料的 CRUD 操作
 * Manages product data CRUD operations
 *
 * 教學重點 / Teaching Points:
 * 1. RESTful API 服務模式
 * 2. Observable 和 RxJS 操作符
 * 3. Signal-based 狀態管理
 * 4. 分頁處理
 * 5. Mock 資料模擬
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ProductListItem,
  ProductListParams,
  ProductStatus,
  ProductVariant,
  ProductVariantConfig,
  VariantOption,
  VariantOptionValue,
} from '@core/models/product.model';
import { PaginatedResponse, ApiResponse } from '@core/models/common.model';

/**
 * Mock 商品資料
 * Mock product data
 */
const MOCK_PRODUCTS: ProductListItem[] = [
  {
    id: '1',
    sku: 'IPH15PM-256-BLK',
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    summary: 'Apple 最強旗艦手機',
    price: 36900,
    comparePrice: 39900,
    stockQuantity: 50,
    isActive: true,
    isFeatured: true,
    categoryName: '智慧型手機',
    categoryPath: 'smartphones',
    brandName: 'Apple',
    ratingAverage: 4.8,
    reviewCount: 256,
    totalSold: 1520,
    totalRevenue: 36900 * 1520,
    primaryImageUrl: '/assets/images/products/iphone-15-pro-max-1.jpg',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '2',
    sku: 'SGS24U-256-GRY',
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    summary: 'Android 最強旗艦',
    price: 35900,
    comparePrice: 38900,
    stockQuantity: 30,
    isActive: true,
    isFeatured: true,
    categoryName: '智慧型手機',
    categoryPath: 'smartphones',
    brandName: 'Samsung',
    ratingAverage: 4.7,
    reviewCount: 189,
    totalSold: 980,
    totalRevenue: 35900 * 980,
    primaryImageUrl: '/assets/images/products/galaxy-s24-ultra-1.jpg',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '3',
    sku: 'MBP14-M3-512',
    name: 'MacBook Pro 14" M3',
    slug: 'macbook-pro-14-m3',
    summary: '專業創作者首選筆電',
    price: 59900,
    comparePrice: 62900,
    stockQuantity: 15,
    isActive: true,
    isFeatured: true,
    categoryName: '筆記型電腦',
    categoryPath: 'laptops',
    brandName: 'Apple',
    ratingAverage: 4.9,
    reviewCount: 342,
    totalSold: 1200,
    totalRevenue: 59900 * 1200,
    primaryImageUrl: '/assets/images/products/macbook-pro-14-1.jpg',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '4',
    sku: 'APP2-WHT',
    name: 'AirPods Pro (第 2 代)',
    slug: 'airpods-pro-2',
    summary: '最佳無線耳機',
    price: 7490,
    comparePrice: 7990,
    stockQuantity: 100,
    isActive: true,
    isFeatured: false,
    categoryName: '音訊設備',
    categoryPath: 'audio',
    brandName: 'Apple',
    ratingAverage: 4.6,
    reviewCount: 523,
    totalSold: 3200,
    totalRevenue: 7490 * 3200,
    primaryImageUrl: '/assets/images/products/airpods-pro-2-1.jpg',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: '5',
    sku: 'SONY-WH1000XM5-BLK',
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    summary: '降噪耳機之王',
    price: 11990,
    comparePrice: 12990,
    stockQuantity: 45,
    isActive: true,
    isFeatured: true,
    categoryName: '音訊設備',
    categoryPath: 'audio',
    brandName: 'Sony',
    ratingAverage: 4.8,
    reviewCount: 412,
    totalSold: 1850,
    totalRevenue: 11990 * 1850,
    primaryImageUrl: '/assets/images/products/sony-wh-1000xm5-1.jpg',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-11-01'),
  },
];

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private readonly useMock = true;

  private readonly productsSignal = signal<ProductListItem[]>([]);
  private readonly selectedProductSignal = signal<ProductListItem | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  public readonly products = this.productsSignal.asReadonly();
  public readonly selectedProduct = this.selectedProductSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();

  public readonly featuredProducts = computed(() => {
    return this.productsSignal().filter((p) => p.isFeatured);
  });

  getProducts(
    params?: ProductListParams
  ): Observable<PaginatedResponse<ProductListItem>> {
    if (this.useMock) {
      return this.getMockProducts(params);
    }

    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<PaginatedResponse<ProductListItem>>(this.apiUrl, {
        params: httpParams,
      })
      .pipe(
        map((response) => {
          this.productsSignal.set(response.items);
          return response;
        }),
        catchError((error) => {
          console.error('Failed to fetch products:', error);
          return throwError(() => error);
        })
      );
  }

  getProduct(id: string): Observable<ProductListItem> {
    if (this.useMock) {
      return this.getMockProduct(id);
    }

    return this.http
      .get<ApiResponse<ProductListItem>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => {
          this.selectedProductSignal.set(response.data!);
          return response.data!;
        }),
        catchError((error) => {
          console.error('Failed to fetch product:', error);
          return throwError(() => error);
        })
      );
  }

  private getMockProducts(
    params?: ProductListParams
  ): Observable<PaginatedResponse<ProductListItem>> {
    let filteredProducts = [...MOCK_PRODUCTS];

    if (params?.search) {
      const search = params.search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.summary?.toLowerCase().includes(search) ||
          p.categoryName.toLowerCase().includes(search) ||
          p.brandName?.toLowerCase().includes(search)
      );
    }

    if (params?.categoryId) {
      filteredProducts = filteredProducts.filter(
        (p) => p.categoryPath === params.categoryId || p.categoryName === params.categoryId
      );
    }

    if (params?.status) {
      // ProductListItem doesn't have status field, so we use isActive
      if (params.status === 'active') {
        filteredProducts = filteredProducts.filter((p) => p.isActive);
      }
    }

    if (params?.minPrice) {
      filteredProducts = filteredProducts.filter(
        (p) => p.price >= params.minPrice!
      );
    }
    if (params?.maxPrice) {
      filteredProducts = filteredProducts.filter(
        (p) => p.price <= params.maxPrice!
      );
    }

    if (params?.isFeatured !== undefined) {
      filteredProducts = filteredProducts.filter(
        (p) => p.isFeatured === params.isFeatured
      );
    }

    if (params?.sortBy) {
      filteredProducts.sort((a, b) => {
        const aVal = (a as any)[params.sortBy!];
        const bVal = (b as any)[params.sortBy!];

        if (params.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    this.productsSignal.set(paginatedProducts);

    return of({
      items: paginatedProducts,
      totalItems: total,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    }).pipe(delay(500));
  }

  private getMockProduct(id: string): Observable<ProductListItem> {
    const product = MOCK_PRODUCTS.find((p) => p.id === id);

    if (!product) {
      return throwError(() => new Error('Product not found'));
    }

    this.selectedProductSignal.set(product);

    return of(product).pipe(delay(300));
  }

  /**
   * 獲取商品變體配置
   * Get product variant configuration
   *
   * @param productId 商品 ID
   * @returns Observable<ProductVariantConfig>
   */
  getProductVariantConfig(productId: string): Observable<ProductVariantConfig> {
    // Mock: 只有特定商品有變體
    const variantConfigs = this.getMockVariantConfigs();
    const config = variantConfigs[productId];

    if (!config) {
      // 無變體的商品
      return of({
        hasVariants: false,
        options: [],
        variants: [],
      }).pipe(delay(200));
    }

    return of(config).pipe(delay(200));
  }

  /**
   * 根據選擇的屬性查找變體
   * Find variant by selected attributes
   *
   * @param productId 商品 ID
   * @param attributes 選擇的屬性
   * @returns Observable<ProductVariant | null>
   */
  findVariantByAttributes(
    productId: string,
    attributes: Record<string, string>
  ): Observable<ProductVariant | null> {
    const config = this.getMockVariantConfigs()[productId];

    if (!config) {
      return of(null).pipe(delay(100));
    }

    const variant = config.variants.find((v) => {
      return Object.entries(attributes).every(
        ([key, value]) => v.attributes[key] === value
      );
    });

    return of(variant || null).pipe(delay(100));
  }

  /**
   * Mock 變體配置資料
   * Mock variant configuration data
   */
  private getMockVariantConfigs(): Record<string, ProductVariantConfig> {
    return {
      // iPhone 15 Pro Max 的變體配置（顏色 x 容量）
      '1': {
        hasVariants: true,
        options: [
          {
            name: '顏色',
            type: 'color',
            values: [
              {
                value: 'natural-titanium',
                displayName: '原色鈦金屬',
                colorCode: '#E8E3DC',
                isAvailable: true,
              },
              {
                value: 'blue-titanium',
                displayName: '藍色鈦金屬',
                colorCode: '#5F6A7D',
                isAvailable: true,
              },
              {
                value: 'white-titanium',
                displayName: '白色鈦金屬',
                colorCode: '#E8E8E8',
                isAvailable: true,
              },
              {
                value: 'black-titanium',
                displayName: '黑色鈦金屬',
                colorCode: '#3D3D3D',
                isAvailable: true,
              },
            ],
          },
          {
            name: '容量',
            type: 'size',
            values: [
              {
                value: '256GB',
                displayName: '256GB',
                isAvailable: true,
                priceAdjustment: 0,
              },
              {
                value: '512GB',
                displayName: '512GB',
                isAvailable: true,
                priceAdjustment: 4000,
              },
              {
                value: '1TB',
                displayName: '1TB',
                isAvailable: true,
                priceAdjustment: 8000,
              },
            ],
          },
        ],
        variants: [
          // 原色鈦金屬 variants
          {
            id: '1-v1',
            productId: '1',
            variantSku: 'IPH15PM-256-NTT',
            attributes: { 顏色: 'natural-titanium', 容量: '256GB' },
            variantName: '原色鈦金屬 256GB',
            stockQuantity: 15,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '1-v2',
            productId: '1',
            variantSku: 'IPH15PM-512-NTT',
            attributes: { 顏色: 'natural-titanium', 容量: '512GB' },
            variantName: '原色鈦金屬 512GB',
            priceOverride: 40900,
            stockQuantity: 12,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '1-v3',
            productId: '1',
            variantSku: 'IPH15PM-1TB-NTT',
            attributes: { 顏色: 'natural-titanium', 容量: '1TB' },
            variantName: '原色鈦金屬 1TB',
            priceOverride: 44900,
            stockQuantity: 8,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          // 藍色鈦金屬 variants
          {
            id: '1-v4',
            productId: '1',
            variantSku: 'IPH15PM-256-BTT',
            attributes: { 顏色: 'blue-titanium', 容量: '256GB' },
            variantName: '藍色鈦金屬 256GB',
            stockQuantity: 10,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '1-v5',
            productId: '1',
            variantSku: 'IPH15PM-512-BTT',
            attributes: { 顏色: 'blue-titanium', 容量: '512GB' },
            variantName: '藍色鈦金屬 512GB',
            priceOverride: 40900,
            stockQuantity: 6,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '1-v6',
            productId: '1',
            variantSku: 'IPH15PM-1TB-BTT',
            attributes: { 顏色: 'blue-titanium', 容量: '1TB' },
            variantName: '藍色鈦金屬 1TB',
            priceOverride: 44900,
            stockQuantity: 3,
            isActive: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          // 其他顏色省略...（可根據需要添加）
        ],
        defaultVariant: {
          id: '1-v1',
          productId: '1',
          variantSku: 'IPH15PM-256-NTT',
          attributes: { 顏色: 'natural-titanium', 容量: '256GB' },
          variantName: '原色鈦金屬 256GB',
          stockQuantity: 15,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };
  }
}
