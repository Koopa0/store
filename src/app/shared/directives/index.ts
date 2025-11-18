/**
 * Shared Directives Barrel Export
 * 共用指令統一匯出
 *
 * 教學說明：
 * 使用 Barrel Export 模式簡化匯入路徑
 * 例如：import { ClickOutsideDirective, LazyLoadDirective } from '@shared/directives';
 */

// 點擊外部指令
export * from './click-outside.directive';

// 懶載入指令
export * from './lazy-load.directive';

// 自動聚焦指令
export * from './autofocus.directive';

// 防抖和節流指令
export * from './debounce.directive';

// 權限指令
export * from './permission.directive';
