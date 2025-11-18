# 🎨 Gemini 風格設計指南

本專案採用 **Gemini Web** 的設計語言，提供現代、簡潔、優雅的使用者體驗。

---

## 📐 設計原則

### 1. 極簡主義
- 乾淨簡潔的介面
- 減少視覺雜訊
- 突出重要內容

### 2. 柔和美學
- 使用柔和的配色
- 大圓角設計 (16-24px)
- 細膩的陰影效果

### 3. 流暢體驗
- 平滑的過渡動畫
- 響應式的互動反饋
- 符合直覺的操作

---

## 🎨 配色方案

### 淺色模式
```scss
背景色：     #f8f9fa (極淺灰)
卡片背景：   #ffffff (純白)
主要文字：   #202124 (深灰黑)
次要文字：   #5f6368 (中灰)
邊框：       #dadce0 (淺灰)
```

### 深色模式
```scss
背景色：     #1e1e1e (深灰)
卡片背景：   #292929 (稍淺灰)
主要文字：   #e8eaed (淺灰白)
次要文字：   #9aa0a6 (中淺灰)
邊框：       #3c4043 (中灰)
```

### 語意色
```scss
成功：  #34a853 (Google 綠)
警告：  #fbbc04 (Google 黃)
錯誤：  #ea4335 (Google 紅)
資訊：  #4285f4 (Google 藍)
```

### 主色漸層
```scss
淺色模式： linear-gradient(135deg, #667eea 0%, #764ba2 100%)
深色模式： linear-gradient(135deg, #8ab4f8 0%, #a8c7fa 100%)
```

---

## 🔧 CSS 變數使用

### 文字顏色
```css
color: var(--text-primary);    /* 主要文字 */
color: var(--text-secondary);  /* 次要文字 */
color: var(--text-tertiary);   /* 三級文字 */
color: var(--text-disabled);   /* 禁用文字 */
```

### 背景色
```css
background: var(--background);          /* 頁面背景 */
background: var(--surface);             /* 卡片/表面 */
background: var(--surface-variant);     /* 變體表面 */
background: var(--card-background);     /* 卡片背景 */
```

### 圓角
```css
border-radius: var(--radius-sm);    /* 12px - 小圓角 */
border-radius: var(--radius-md);    /* 16px - 中圓角 */
border-radius: var(--radius-lg);    /* 20px - 大圓角 */
border-radius: var(--radius-xl);    /* 24px - 超大圓角 */
border-radius: var(--radius-full);  /* 9999px - 完全圓角 */
```

### 陰影
```css
box-shadow: var(--shadow-sm);      /* 細微陰影 */
box-shadow: var(--shadow-md);      /* 中等陰影 */
box-shadow: var(--shadow-lg);      /* 大陰影 */
box-shadow: var(--shadow-float);   /* 懸浮陰影 */
```

### 漸層
```css
background: var(--primary-gradient);        /* 主色漸層 */
background: var(--primary-gradient-hover);  /* 懸停漸層 */
```

---

## 🎭 Mixins 使用

### Gemini 卡片樣式
```scss
.my-card {
  @include gemini-card;
}
```

生成效果：
- 白色/深灰背景
- 20px 圓角
- 柔和陰影
- 懸停時上浮效果

### Gemini 按鈕樣式
```scss
// 填充按鈕（帶漸層）
.btn-filled {
  @include gemini-button('filled');
}

// 線框按鈕
.btn-outlined {
  @include gemini-button('outlined');
}

// 文字按鈕
.btn-text {
  @include gemini-button('text');
}
```

### Gemini 輸入框
```scss
.my-input {
  @include gemini-input;
}
```

### 毛玻璃效果
```scss
.glass-panel {
  @include gemini-glass;
}
```

### 懸浮效果
```scss
.float-card {
  @include gemini-float;
}
```

### 文字漸層
```scss
.gradient-text {
  @include gemini-gradient-text;
}
```

---

## ✨ 動畫效果

### 懸浮動畫
```html
<div class="gemini-float">
  <!-- 內容會輕柔地上下浮動 -->
</div>
```

### 漸層動畫
```html
<div class="gemini-gradient-animated"
     style="background: var(--primary-gradient)">
  <!-- 漸層會緩慢移動 -->
</div>
```

### 脈衝動畫
```html
<div class="gemini-pulse">
  <!-- 元素會柔和地閃爍 -->
</div>
```

---

## 📦 組件範例

### 1. Gemini 風格卡片
```html
<div class="product-card">
  <img src="..." alt="Product">
  <h3>商品名稱</h3>
  <p class="price">$999</p>
  <button class="btn-add">加入購物車</button>
</div>
```

```scss
.product-card {
  @include gemini-card;
  padding: var(--spacing-lg);

  .price {
    color: var(--text-secondary);
    font-size: 18px;
    font-weight: 500;
  }

  .btn-add {
    @include gemini-button('filled');
    width: 100%;
    margin-top: var(--spacing-md);
  }
}
```

### 2. Gemini 風格表單
```html
<form class="gemini-form">
  <input type="text" placeholder="請輸入文字...">
  <button type="submit">送出</button>
</form>
```

```scss
.gemini-form {
  input {
    @include gemini-input;
    width: 100%;
    margin-bottom: var(--spacing-md);
  }

  button {
    @include gemini-button('filled');
  }
}
```

### 3. 毛玻璃導航欄
```html
<nav class="glass-nav">
  <div class="logo">Koopa Store</div>
  <ul class="nav-links">
    <li><a href="/">首頁</a></li>
    <li><a href="/products">商品</a></li>
  </ul>
</nav>
```

```scss
.glass-nav {
  @include gemini-glass;
  padding: var(--spacing-md) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;

  .logo {
    @include gemini-gradient-text;
    font-size: 24px;
    font-weight: 600;
  }
}
```

---

## 🌓 深淺模式切換

### 自動應用
只要在 `<body>` 或 `<html>` 元素上添加 `.dark-theme` 類別，所有顏色都會自動切換：

```typescript
// theme.service.ts
toggleTheme() {
  document.body.classList.toggle('dark-theme');
}
```

### 手動指定
```scss
.my-component {
  background: var(--surface);

  // 深色模式下的特殊樣式
  .dark-theme & {
    // 額外的深色模式樣式
  }
}
```

---

## 📱 響應式設計

### 斷點建議
```scss
// 手機
@media (max-width: 640px) { }

// 平板
@media (min-width: 641px) and (max-width: 1024px) { }

// 桌面
@media (min-width: 1025px) { }
```

### 間距調整
```scss
// 手機使用較小間距
@media (max-width: 640px) {
  .container {
    padding: var(--spacing-sm);
  }
}

// 桌面使用較大間距
@media (min-width: 1025px) {
  .container {
    padding: var(--spacing-xl);
  }
}
```

---

## 🎯 最佳實踐

### ✅ 應該做的
- 使用 CSS 變數而非硬編碼顏色
- 使用提供的 mixins 保持一致性
- 圓角使用 16px 以上
- 使用柔和的陰影
- 添加平滑的過渡動畫

### ❌ 不應該做的
- 避免過度鮮豔的顏色
- 避免使用小於 12px 的圓角
- 避免過重的陰影
- 避免突兀的狀態變化
- 避免混用不同的設計風格

---

## 🚀 快速開始

### 1. 創建 Gemini 風格按鈕
```html
<button class="gemini-btn">點擊我</button>
```

```scss
.gemini-btn {
  @include gemini-button('filled');
}
```

### 2. 創建 Gemini 風格卡片
```html
<div class="gemini-card">
  <h3>標題</h3>
  <p>內容...</p>
</div>
```

```scss
.gemini-card {
  @include gemini-card;
  padding: var(--spacing-lg);
}
```

### 3. 應用漸層文字
```html
<h1 class="gradient-heading">歡迎</h1>
```

```scss
.gradient-heading {
  @include gemini-gradient-text;
  font-size: 48px;
  font-weight: 700;
}
```

---

## 🎨 配色參考

| 用途 | 淺色模式 | 深色模式 |
|------|----------|----------|
| 頁面背景 | #f8f9fa | #1e1e1e |
| 卡片背景 | #ffffff | #292929 |
| 主要文字 | #202124 | #e8eaed |
| 次要文字 | #5f6368 | #9aa0a6 |
| 主要邊框 | #dadce0 | #3c4043 |
| 成功色 | #34a853 | #188038 |
| 錯誤色 | #ea4335 | #d93025 |
| 警告色 | #fbbc04 | #f9ab00 |
| 資訊色 | #4285f4 | #1967d2 |

---

## 📚 參考資源

- [Google Material Design](https://material.io/design)
- [Gemini Web](https://gemini.google.com)
- [Material Design Color System](https://material.io/design/color)

---

**最後更新**: 2025-11-18
**版本**: 1.0.0
**設計系統**: Gemini-Inspired Design
