/**
 * 變體選擇器組件
 * Variant Selector Component
 *
 * 用於商品詳情頁的變體選擇（顏色、尺寸等）
 * Used for product variant selection (color, size, etc.) on product detail page
 *
 * 教學重點 / Teaching Points:
 * 1. 組件間通訊（@Input, @Output, EventEmitter）
 * 2. 動態變體組合驗證
 * 3. 顏色選項的視覺化顯示
 * 4. 庫存狀態即時更新
 * 5. Signal-based 狀態管理
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models
import {
  VariantOption,
  VariantOptionValue,
  ProductVariant,
  SelectedVariant,
} from '@core/models/product.model';

// Pipes
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-variant-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './variant-selector.component.html',
  styleUrl: './variant-selector.component.scss',
})
export class VariantSelectorComponent implements OnInit {
  /**
   * 變體選項配置
   * Variant options configuration
   */
  @Input({ required: true }) options: VariantOption[] = [];

  /**
   * 所有可用的變體
   * All available variants
   */
  @Input({ required: true }) variants: ProductVariant[] = [];

  /**
   * 基礎價格（主商品價格）
   * Base price (main product price)
   */
  @Input({ required: true }) basePrice: number = 0;

  /**
   * 預設選擇的變體
   * Default selected variant
   */
  @Input() defaultVariant?: ProductVariant;

  /**
   * 變體選擇變更事件
   * Variant selection change event
   */
  @Output() variantChange = new EventEmitter<SelectedVariant | null>();

  /**
   * 當前選擇的屬性
   * Currently selected attributes
   */
  readonly selectedAttributes = signal<Record<string, string>>({});

  /**
   * 當前匹配的變體
   * Currently matched variant
   */
  readonly matchedVariant = signal<ProductVariant | null>(null);

  /**
   * 計算後的最終價格
   * Computed final price
   */
  readonly finalPrice = computed(() => {
    const variant = this.matchedVariant();
    if (variant?.priceOverride) {
      return variant.priceOverride;
    }

    // 根據選項的 priceAdjustment 計算價格
    let price = this.basePrice;
    const selected = this.selectedAttributes();

    this.options.forEach((option) => {
      const selectedValue = selected[option.name];
      if (selectedValue) {
        const optionValue = option.values.find((v) => v.value === selectedValue);
        if (optionValue?.priceAdjustment) {
          price += optionValue.priceAdjustment;
        }
      }
    });

    return price;
  });

  /**
   * 計算後的可用庫存
   * Computed available stock
   */
  readonly availableStock = computed(() => {
    const variant = this.matchedVariant();
    return variant?.stockQuantity || 0;
  });

  /**
   * 是否已選擇完整的變體
   * Whether complete variant is selected
   */
  readonly isCompleteSelection = computed(() => {
    const selected = this.selectedAttributes();
    return this.options.every((option) => selected[option.name]);
  });

  /**
   * 當前選擇的變體資訊
   * Current selected variant information
   */
  readonly currentSelection = computed<SelectedVariant | null>(() => {
    if (!this.isCompleteSelection()) {
      return null;
    }

    const variant = this.matchedVariant();
    return {
      variantId: variant?.id,
      attributes: this.selectedAttributes(),
      price: this.finalPrice(),
      availableStock: this.availableStock(),
      sku: variant?.variantSku,
    };
  });

  constructor() {
    // 監聽選擇變更，發出事件
    effect(() => {
      const selection = this.currentSelection();
      this.variantChange.emit(selection);
    });
  }

  ngOnInit(): void {
    // 設置預設選擇
    if (this.defaultVariant) {
      this.selectedAttributes.set({ ...this.defaultVariant.attributes });
      this.matchedVariant.set(this.defaultVariant);
    }
  }

  /**
   * 選擇變體選項值
   * Select variant option value
   *
   * @param optionName 選項名稱
   * @param value 選項值
   */
  selectOption(optionName: string, value: string): void {
    const current = this.selectedAttributes();
    const updated = { ...current, [optionName]: value };
    this.selectedAttributes.set(updated);

    // 查找匹配的變體
    this.updateMatchedVariant(updated);
  }

  /**
   * 更新匹配的變體
   * Update matched variant
   *
   * @param attributes 屬性
   */
  private updateMatchedVariant(attributes: Record<string, string>): void {
    // 檢查是否所有選項都已選擇
    const allSelected = this.options.every((option) => attributes[option.name]);

    if (!allSelected) {
      this.matchedVariant.set(null);
      return;
    }

    // 查找完全匹配的變體
    const variant = this.variants.find((v) => {
      return Object.entries(attributes).every(
        ([key, value]) => v.attributes[key] === value
      );
    });

    this.matchedVariant.set(variant || null);
  }

  /**
   * 檢查選項值是否當前選中
   * Check if option value is currently selected
   *
   * @param optionName 選項名稱
   * @param value 選項值
   * @returns 是否選中
   */
  isSelected(optionName: string, value: string): boolean {
    return this.selectedAttributes()[optionName] === value;
  }

  /**
   * 檢查選項值是否可用
   * Check if option value is available
   *
   * @param optionName 選項名稱
   * @param value 選項值
   * @returns 是否可用
   */
  isAvailable(optionName: string, value: string): boolean {
    // 檢查至少有一個變體包含此選項組合且有庫存
    const currentSelection = this.selectedAttributes();
    const testSelection = { ...currentSelection, [optionName]: value };

    return this.variants.some((variant) => {
      // 檢查此變體是否匹配測試選擇
      const matches = Object.entries(testSelection).every(
        ([key, val]) => variant.attributes[key] === val
      );

      // 且有庫存且啟用
      return matches && variant.stockQuantity > 0 && variant.isActive;
    });
  }

  /**
   * 取得選項的已選擇顯示名稱
   * Get selected display name for option
   *
   * @param option 選項
   * @returns 顯示名稱
   */
  getSelectedDisplayName(option: VariantOption): string | undefined {
    const selectedValue = this.selectedAttributes()[option.name];
    if (!selectedValue) {
      return undefined;
    }

    const optionValue = option.values.find((v) => v.value === selectedValue);
    return optionValue?.displayName;
  }
}
