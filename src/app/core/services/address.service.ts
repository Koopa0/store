/**
 * 地址服務
 * Address Service
 *
 * 管理用戶地址的 CRUD 操作
 * Manages user address CRUD operations
 *
 * 教學重點 / Teaching Points:
 * 1. Signal-based 狀態管理
 * 2. CRUD 操作標準實現
 * 3. Mock 資料模擬
 * 4. 預設地址邏輯處理
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, catchError, throwError, tap } from 'rxjs';
import { environment } from '@environments/environment';

// Models
import {
  UserAddress,
  AddAddressRequest,
  UpdateAddressRequest,
  AddressLabel,
} from '@core/models/user.model';
import { ApiResponse } from '@core/models/common.model';

/**
 * 地址服務
 * Address service
 */
@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/addresses`;
  private readonly useMock = true; // 使用 Mock 資料 / Use mock data

  /**
   * 狀態 Signals
   * State signals
   */
  private readonly addressesSignal = signal<UserAddress[]>([]);
  private readonly loadingSignal = signal<boolean>(false);

  /**
   * 唯讀公開的 Signals
   * Readonly public signals
   */
  public readonly addresses = this.addressesSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();

  /**
   * 建構函式
   * Constructor
   */
  constructor() {
    // 初始化時載入地址列表
    // Load addresses on initialization
    this.loadAddresses();
  }

  /**
   * 載入用戶地址列表
   * Load user addresses
   */
  loadAddresses(): void {
    this.loadingSignal.set(true);
    this.getUserAddresses().subscribe({
      next: (addresses) => {
        this.addressesSignal.set(addresses);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.error('Failed to load addresses:', err);
        this.loadingSignal.set(false);
      },
    });
  }

  /**
   * 取得用戶所有地址
   * Get all user addresses
   */
  getUserAddresses(): Observable<UserAddress[]> {
    if (this.useMock) {
      return this.getMockAddresses();
    }

    return this.http
      .get<ApiResponse<UserAddress[]>>(`${this.apiUrl}`)
      .pipe(
        map((response) => response.data!),
        catchError((error) => {
          console.error('Failed to fetch addresses:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 取得預設地址
   * Get default address
   */
  getDefaultAddress(): Observable<UserAddress | null> {
    if (this.useMock) {
      return this.getMockDefaultAddress();
    }

    return this.http
      .get<ApiResponse<UserAddress>>(`${this.apiUrl}/default`)
      .pipe(
        map((response) => response.data || null),
        catchError((error) => {
          console.error('Failed to fetch default address:', error);
          return of(null);
        })
      );
  }

  /**
   * 取得特定地址
   * Get address by ID
   */
  getAddressById(id: string): Observable<UserAddress | null> {
    if (this.useMock) {
      return this.getMockAddressById(id);
    }

    return this.http
      .get<ApiResponse<UserAddress>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data || null),
        catchError((error) => {
          console.error('Failed to fetch address:', error);
          return of(null);
        })
      );
  }

  /**
   * 新增地址
   * Add new address
   */
  addAddress(request: AddAddressRequest): Observable<UserAddress> {
    if (this.useMock) {
      return this.mockAddAddress(request);
    }

    return this.http
      .post<ApiResponse<UserAddress>>(`${this.apiUrl}`, request)
      .pipe(
        map((response) => response.data!),
        tap((address) => {
          // 更新本地狀態
          const currentAddresses = this.addressesSignal();
          this.addressesSignal.set([...currentAddresses, address]);
        }),
        catchError((error) => {
          console.error('Failed to add address:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 更新地址
   * Update address
   */
  updateAddress(request: UpdateAddressRequest): Observable<UserAddress> {
    if (this.useMock) {
      return this.mockUpdateAddress(request);
    }

    return this.http
      .put<ApiResponse<UserAddress>>(`${this.apiUrl}/${request.id}`, request)
      .pipe(
        map((response) => response.data!),
        tap((updatedAddress) => {
          // 更新本地狀態
          const currentAddresses = this.addressesSignal();
          const index = currentAddresses.findIndex((a) => a.id === updatedAddress.id);
          if (index >= 0) {
            const updated = [...currentAddresses];
            updated[index] = updatedAddress;
            this.addressesSignal.set(updated);
          }
        }),
        catchError((error) => {
          console.error('Failed to update address:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 刪除地址
   * Delete address
   */
  deleteAddress(id: string): Observable<void> {
    if (this.useMock) {
      return this.mockDeleteAddress(id);
    }

    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data!),
        tap(() => {
          // 更新本地狀態
          const currentAddresses = this.addressesSignal();
          this.addressesSignal.set(currentAddresses.filter((a) => a.id !== id));
        }),
        catchError((error) => {
          console.error('Failed to delete address:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 設定預設地址
   * Set default address
   */
  setDefaultAddress(id: string): Observable<UserAddress> {
    if (this.useMock) {
      return this.mockSetDefaultAddress(id);
    }

    return this.http
      .put<ApiResponse<UserAddress>>(`${this.apiUrl}/${id}/set-default`, {})
      .pipe(
        map((response) => response.data!),
        tap(() => {
          // 更新本地狀態：將所有地址的 isDefault 設為 false，除了指定的地址
          const currentAddresses = this.addressesSignal();
          const updated = currentAddresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id,
          }));
          this.addressesSignal.set(updated);
        }),
        catchError((error) => {
          console.error('Failed to set default address:', error);
          return throwError(() => error);
        })
      );
  }

  // ==================== Mock 資料方法 / Mock Data Methods ====================

  /**
   * Mock: 取得用戶地址列表
   * Mock: Get user addresses
   */
  private getMockAddresses(): Observable<UserAddress[]> {
    const mockAddresses: UserAddress[] = [
      {
        id: 'addr-1',
        userId: 'user-1',
        label: 'home',
        isDefault: true,
        recipientName: '王小明',
        recipientPhone: '0912-345-678',
        countryCode: 'TW',
        postalCode: '106',
        city: '台北市',
        district: '大安區',
        streetAddress: '信義路四段1號',
        buildingFloor: '10樓',
        version: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'addr-2',
        userId: 'user-1',
        label: 'office',
        isDefault: false,
        recipientName: '王小明',
        recipientPhone: '02-2345-6789',
        countryCode: 'TW',
        postalCode: '110',
        city: '台北市',
        district: '信義區',
        streetAddress: '松仁路100號',
        buildingFloor: '5樓',
        version: 1,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
      },
      {
        id: 'addr-3',
        userId: 'user-1',
        label: 'other',
        customLabel: '父母家',
        isDefault: false,
        recipientName: '王大明',
        recipientPhone: '0923-456-789',
        countryCode: 'TW',
        postalCode: '220',
        city: '新北市',
        district: '板橋區',
        streetAddress: '文化路二段123號',
        version: 1,
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
      },
    ];

    return of(mockAddresses).pipe(delay(300));
  }

  /**
   * Mock: 取得預設地址
   * Mock: Get default address
   */
  private getMockDefaultAddress(): Observable<UserAddress | null> {
    return this.getMockAddresses().pipe(
      map((addresses) => addresses.find((addr) => addr.isDefault) || null)
    );
  }

  /**
   * Mock: 取得特定地址
   * Mock: Get address by ID
   */
  private getMockAddressById(id: string): Observable<UserAddress | null> {
    return this.getMockAddresses().pipe(
      map((addresses) => addresses.find((addr) => addr.id === id) || null)
    );
  }

  /**
   * Mock: 新增地址
   * Mock: Add address
   */
  private mockAddAddress(request: AddAddressRequest): Observable<UserAddress> {
    const newAddress: UserAddress = {
      id: `addr-${Date.now()}`,
      userId: 'user-1',
      ...request,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 如果設為預設，將其他地址的預設狀態移除
    if (request.isDefault) {
      const currentAddresses = this.addressesSignal();
      const updated = currentAddresses.map((addr) => ({
        ...addr,
        isDefault: false,
      }));
      this.addressesSignal.set([...updated, newAddress]);
    } else {
      const currentAddresses = this.addressesSignal();
      this.addressesSignal.set([...currentAddresses, newAddress]);
    }

    return of(newAddress).pipe(delay(300));
  }

  /**
   * Mock: 更新地址
   * Mock: Update address
   */
  private mockUpdateAddress(request: UpdateAddressRequest): Observable<UserAddress> {
    const currentAddresses = this.addressesSignal();
    const index = currentAddresses.findIndex((a) => a.id === request.id);

    if (index < 0) {
      return throwError(() => new Error('Address not found'));
    }

    const existingAddress = currentAddresses[index];
    const updatedAddress: UserAddress = {
      ...existingAddress,
      ...request,
      updatedAt: new Date(),
    };

    // 如果設為預設，將其他地址的預設狀態移除
    let updated = [...currentAddresses];
    if (request.isDefault) {
      updated = updated.map((addr) => ({
        ...addr,
        isDefault: addr.id === request.id,
      }));
    }

    updated[index] = updatedAddress;
    this.addressesSignal.set(updated);

    return of(updatedAddress).pipe(delay(300));
  }

  /**
   * Mock: 刪除地址
   * Mock: Delete address
   */
  private mockDeleteAddress(id: string): Observable<void> {
    const currentAddresses = this.addressesSignal();
    const filtered = currentAddresses.filter((a) => a.id !== id);
    this.addressesSignal.set(filtered);

    return of(void 0).pipe(delay(300));
  }

  /**
   * Mock: 設定預設地址
   * Mock: Set default address
   */
  private mockSetDefaultAddress(id: string): Observable<UserAddress> {
    const currentAddresses = this.addressesSignal();
    const targetAddress = currentAddresses.find((a) => a.id === id);

    if (!targetAddress) {
      return throwError(() => new Error('Address not found'));
    }

    const updated = currentAddresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));

    this.addressesSignal.set(updated);

    return of({ ...targetAddress, isDefault: true }).pipe(delay(300));
  }
}
