-- ============================================================================
-- 電商平台企業級資料庫架構
-- ============================================================================
-- PostgreSQL: 18+
-- 架構設計原則:
--   1. 資料完整性優先：使用約束、觸發器、規則確保資料正確性
--   2. 並發安全：樂觀鎖 + 悲觀鎖混合策略
--   3. 效能優化：分區表、物化視圖、適當的索引策略
--   4. 安全性：Row Level Security、加密敏感資料
--   5. 可維護性：完整的註解、審計日誌、監控視圖
-- ============================================================================

-- 建立專案資料庫和角色
-- CREATE DATABASE ecommerce_db WITH ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8';

-- ============================================================================
-- 基礎設定和擴展
-- ============================================================================

-- 啟用必要的擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";          -- UUID 生成
CREATE EXTENSION IF NOT EXISTS "pgcrypto";           -- 加密功能
CREATE EXTENSION IF NOT EXISTS "pg_trgm";            -- 相似度搜尋
CREATE EXTENSION IF NOT EXISTS "btree_gist";         -- GIST 索引支援
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- 查詢效能分析
CREATE EXTENSION IF NOT EXISTS "tablefunc";          -- 樞紐分析功能
CREATE EXTENSION IF NOT EXISTS "pg_cron";            -- 定時任務
-- CREATE EXTENSION IF NOT EXISTS "pg_jieba";           -- 中文分詞
CREATE EXTENSION IF NOT EXISTS "ltree";

-- 設定時區（持久化設定，需要在資料庫層級設定）
-- 注意：此設定僅對當前會話有效
-- 建議使用: ALTER DATABASE ecommerce_db SET timezone = 'Asia/Taipei';
SET timezone = 'Asia/Taipei';

-- ============================================================================
-- 自定義域和類型
-- ============================================================================

-- Email 域類型（內建驗證）
CREATE DOMAIN email_address AS VARCHAR(255)
    CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
    NOT NULL;

COMMENT ON DOMAIN email_address IS 'Email 地址域，自動驗證格式';

-- 正數金額域（金融級精度）
CREATE DOMAIN positive_amount AS NUMERIC(19, 4)
    CHECK (VALUE >= 0)
    NOT NULL DEFAULT 0;

COMMENT ON DOMAIN positive_amount IS '正數金額域，NUMERIC(19,4) 提供金融級精度，用於價格、金額等欄位';

-- 百分比域
CREATE DOMAIN percentage AS NUMERIC(5, 2)
    CHECK (VALUE >= 0 AND VALUE <= 100)
    NOT NULL DEFAULT 0;

COMMENT ON DOMAIN percentage IS '百分比域，0-100 之間';

-- 電話號碼域
CREATE DOMAIN phone_number AS VARCHAR(20)
    CHECK (VALUE ~ '^\+?[0-9\-\s\(\)]+$');

COMMENT ON DOMAIN phone_number IS '電話號碼域，支援國際格式';

-- ============================================================================
-- ENUM 類型定義（穩定的分類）
-- ============================================================================

-- 用戶角色
CREATE TYPE user_role AS ENUM (
    'customer',     -- 顧客
    'seller',       -- 賣家
    'admin',        -- 管理員
    'super_admin'   -- 超級管理員
);

CREATE TYPE reservation_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'expired'
);

-- 庫存異動類型
CREATE TYPE inventory_change_type AS ENUM (
    'initial',      -- 初始庫存
    'purchase',     -- 進貨
    'sale',         -- 銷售
    'return',       -- 退貨
    'adjustment',   -- 調整
    'transfer',     -- 調撥
    'damaged',      -- 損壞
    'expired'       -- 過期
);

-- 通知優先級
CREATE TYPE notification_priority AS ENUM (
    'low',          -- 低
    'normal',       -- 普通
    'high',         -- 高
    'urgent'        -- 緊急
);

-- ============================================================================
-- 核心表結構
-- ============================================================================

-- ============================================================================
-- 1. 用戶管理系統
-- ============================================================================

-- 用戶主表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email email_address,
    username VARCHAR(50) NOT NULL,
    password_hash TEXT NOT NULL,

    -- 基本資訊
    full_name VARCHAR(100),
    phone phone_number,
    avatar_url TEXT,
    date_of_birth DATE,

    -- 角色和狀態
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,

    -- 安全相關
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret VARCHAR(255),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,

    -- 偏好設定（JSONB 提供彈性）
    preferences JSONB NOT NULL DEFAULT '{}',

    -- 版本控制（樂觀鎖）
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,

    -- 約束
    CONSTRAINT users_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,50}$'),
    CONSTRAINT users_age_check CHECK (
        date_of_birth IS NULL OR
        date_of_birth <= CURRENT_DATE - INTERVAL '13 years'
    )
);

-- 建立索引
CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_username_active ON users(username) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_phone_active ON users(phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE INDEX idx_users_username_lower ON users(LOWER(username));
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- 函數索引（支援不區分大小寫搜尋）
CREATE INDEX idx_users_email_lower ON users(LOWER(email::text));

COMMENT ON TABLE users IS '用戶主表 - 儲存所有用戶核心資訊';
COMMENT ON COLUMN users.version IS '樂觀鎖版本號，每次更新時遞增';
COMMENT ON COLUMN users.preferences IS 'JSON 格式的用戶偏好設定，如 {"theme": "dark", "language": "zh-TW"}';
COMMENT ON COLUMN users.locked_until IS '帳號鎖定到期時間，NULL 表示未鎖定';

-- 用戶地址表
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 地址類型
    label VARCHAR(50) NOT NULL DEFAULT 'home', -- home, office, other
    is_default BOOLEAN NOT NULL DEFAULT false,

    -- 收件人資訊
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone phone_number NOT NULL,

    -- 地址資訊（結構化）
    country_code CHAR(2) NOT NULL DEFAULT 'TW',
    postal_code VARCHAR(10) NOT NULL,
    state_province VARCHAR(50),
    city VARCHAR(50) NOT NULL,
    district VARCHAR(50),
    street_address VARCHAR(255) NOT NULL,
    building_floor VARCHAR(50),

    -- 地理座標（用於距離計算）
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
-- 部分唯一索引：確保每個用戶只能有一個預設地址
CREATE UNIQUE INDEX idx_user_addresses_unique_default ON user_addresses(user_id) WHERE is_default = true;

-- 地理空間索引（如果需要基於位置的查詢）
CREATE INDEX idx_user_addresses_location
    ON user_addresses USING gist (
        point(longitude, latitude)
    ) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON TABLE user_addresses IS '用戶地址表 - 支援多地址管理';
COMMENT ON COLUMN user_addresses.building_floor IS '大樓/樓層資訊，如 "A棟5樓"';

-- ============================================================================
-- 2. 商品管理系統
-- ============================================================================

-- 商品分類表（支援無限層級）
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT,

    -- 基本資訊
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    ltree_path ltree,

    -- 層級資訊（使用 ltree）
    level INTEGER GENERATED ALWAYS AS (nlevel(ltree_path) - 1) STORED,

    -- 排序和狀態
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- SEO
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    meta_keywords TEXT[],

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE UNIQUE INDEX idx_categories_code ON categories(code);
CREATE UNIQUE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX idx_categories_ltree_gist ON categories USING GIST(ltree_path);
CREATE INDEX idx_categories_ltree_path ON categories USING BTREE(ltree_path);

COMMENT ON TABLE categories IS '商品分類表 - 支援無限層級分類，使用 ltree 實現';

-- 品牌表
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 基本資訊
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    logo_url TEXT,
    description TEXT,
    website_url TEXT,

    -- 品牌資訊
    country_of_origin CHAR(2), -- ISO 國家代碼
    established_year INTEGER,

    -- 狀態
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_brands_code ON brands(code);
CREATE UNIQUE INDEX idx_brands_name ON brands(name);
CREATE UNIQUE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_active ON brands(is_active) WHERE is_active = true;
CREATE INDEX idx_brands_featured ON brands(is_featured) WHERE is_featured = true;

COMMENT ON TABLE brands IS '品牌表';

-- 商品主表
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 關聯
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,

    -- 基本資訊
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    summary VARCHAR(500),
    description TEXT,

    -- 價格（使用自定義域）
    price positive_amount NOT NULL,
    compare_price positive_amount,
    cost positive_amount,

    -- 稅務
    tax_rate percentage DEFAULT 5, -- 稅率
    is_tax_included BOOLEAN NOT NULL DEFAULT true,

    -- 庫存管理
    track_inventory BOOLEAN NOT NULL DEFAULT true,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    allow_backorder BOOLEAN NOT NULL DEFAULT false,

    -- 物理屬性
    weight NUMERIC(10, 3), -- 公克
    length NUMERIC(10, 2), -- 公分
    width NUMERIC(10, 2),  -- 公分
    height NUMERIC(10, 2), -- 公分

    -- 狀態旗標
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_digital BOOLEAN NOT NULL DEFAULT false, -- 數位商品
    requires_shipping BOOLEAN GENERATED ALWAYS AS (NOT is_digital) STORED,

    -- SEO 和搜尋
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    tags TEXT[] DEFAULT '{}',
    search_vector tsvector,

    -- 統計資料（由觸發器維護）
    view_count INTEGER NOT NULL DEFAULT 0,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    discontinued_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,

    -- 約束
    CONSTRAINT products_price_check CHECK (
        compare_price IS NULL OR compare_price > price
    ),
    CONSTRAINT products_stock_check CHECK (
        NOT track_inventory OR stock_quantity >= 0 OR allow_backorder
    )
);

-- 建立索引
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_brand ON products(brand_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_products_sku_active ON products(sku) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_products_slug_active ON products(slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_products_barcode_active ON products(barcode) WHERE deleted_at IS NULL AND barcode IS NOT NULL;
CREATE INDEX idx_products_price ON products(price) WHERE is_active = true;
CREATE INDEX idx_products_stock ON products(stock_quantity)
    WHERE track_inventory = true AND deleted_at IS NULL;
CREATE INDEX idx_products_featured ON products(is_featured, created_at DESC)
    WHERE is_featured = true AND deleted_at IS NULL;
CREATE INDEX idx_products_search_vector ON products USING gin(search_vector);
CREATE INDEX idx_products_tags ON products USING gin(tags);

COMMENT ON TABLE products IS '商品主表 - 儲存商品核心資訊';
COMMENT ON COLUMN products.requires_shipping IS '計算欄位：非數位商品需要配送';

-- 商品變體表（顏色、尺寸等）
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    -- 變體識別
    variant_sku VARCHAR(100) NOT NULL,
    variant_barcode VARCHAR(100),

    -- 變體屬性（結構化 JSONB）
    attributes JSONB NOT NULL, -- {"color": "red", "size": "L"}
    variant_name VARCHAR(100), -- 應用層生成，根據 attributes 動態組合

    -- 價格覆蓋（NULL 表示使用主商品價格）
    price_override positive_amount,

    -- 庫存
    stock_quantity INTEGER NOT NULL DEFAULT 0,

    -- 狀態
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    -- 確保同一商品的變體組合唯一
    CONSTRAINT unique_variant_attributes UNIQUE (product_id, attributes)
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_product_variants_sku_active ON product_variants(variant_sku) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_product_variants_barcode_active ON product_variants(variant_barcode) WHERE deleted_at IS NULL AND variant_barcode IS NOT NULL;
CREATE INDEX idx_product_variants_attributes ON product_variants USING gin(attributes);
CREATE INDEX idx_product_variants_active ON product_variants(product_id)
    WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_product_variants_deleted ON product_variants(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE product_variants IS '商品變體表 - 管理不同規格的商品，支援軟刪除';

-- 商品圖片表
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

    -- 圖片資訊
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),

    -- 排序
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,

    -- 圖片元資料
    width INTEGER,
    height INTEGER,
    file_size INTEGER, -- bytes
    mime_type VARCHAR(50),

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_variant ON product_images(variant_id)
    WHERE variant_id IS NOT NULL;
CREATE INDEX idx_product_images_primary ON product_images(product_id)
    WHERE is_primary = true;

-- 確保每個產品只有一個主圖
CREATE UNIQUE INDEX unique_primary_image ON product_images(product_id)
    WHERE is_primary = true;

COMMENT ON TABLE product_images IS '商品圖片表';

-- ============================================================================
-- 3. 購物和訂單系統
-- ============================================================================

-- 購物車表（支援暫時和永久購物車）
CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- 未登入用戶使用

    -- 狀態
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 確保用戶或會話至少有一個
    CONSTRAINT cart_user_or_session CHECK (
        user_id IS NOT NULL OR session_id IS NOT NULL
    )
);

CREATE INDEX idx_shopping_carts_user ON shopping_carts(user_id)
    WHERE is_active = true;
CREATE INDEX idx_shopping_carts_session ON shopping_carts(session_id)
    WHERE is_active = true;
CREATE INDEX idx_shopping_carts_expires ON shopping_carts(expires_at)
    WHERE expires_at IS NOT NULL;

-- 一個用戶只能有一個活躍購物車
CREATE UNIQUE INDEX unique_active_user_cart ON shopping_carts(user_id)
    WHERE is_active = true AND user_id IS NOT NULL;

COMMENT ON TABLE shopping_carts IS '購物車表 - 支援登入和未登入用戶';

-- 購物車項目表
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,

    -- 數量和價格
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price positive_amount NOT NULL, -- 加入時的價格快照
    subtotal positive_amount GENERATED ALWAYS AS (quantity * unit_price) STORED,

    -- 狀態
    is_saved_for_later BOOLEAN NOT NULL DEFAULT false,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 約束
    CONSTRAINT cart_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id, variant_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
CREATE INDEX idx_cart_items_saved ON cart_items(cart_id)
    WHERE is_saved_for_later = true;

COMMENT ON TABLE cart_items IS '購物車項目表 - 使用 RESTRICT 外鍵強制應用層在軟刪除商品時處理購物車清理';

-- 訂單狀態查詢表（取代 ENUM 以提供更好的彈性）
CREATE TABLE order_statuses (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入訂單狀態
INSERT INTO order_statuses (code, name, description, sort_order) VALUES
('draft', '草稿', '訂單草稿', 0),
('pending', '待付款', '等待付款', 1),
('paid', '已付款', '付款完成', 2),
('confirmed', '已確認', '訂單已確認', 3),
('processing', '處理中', '訂單處理中', 4),
('shipped', '已發貨', '訂單已發貨', 5),
('delivered', '已送達', '訂單已送達', 6),
('completed', '已完成', '訂單已完成', 7),
('cancelled', '已取消', '訂單已取消', 90),
('refunding', '退款中', '退款處理中', 91),
('refunded', '已退款', '退款已完成', 92);

CREATE INDEX idx_order_statuses_active ON order_statuses(is_active) WHERE is_active = true;

COMMENT ON TABLE order_statuses IS '訂單狀態查詢表 - 取代 ENUM 以提供更好的維護彈性';

-- 訂單主表
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- 訂單狀態
    status VARCHAR(20) NOT NULL DEFAULT 'pending' REFERENCES order_statuses(code),

    -- 金額資訊
    subtotal positive_amount NOT NULL DEFAULT 0,
    shipping_fee positive_amount DEFAULT 0,
    tax_amount positive_amount DEFAULT 0,
    discount_amount positive_amount DEFAULT 0,
    total_amount positive_amount GENERATED ALWAYS AS (
        subtotal + shipping_fee + tax_amount - discount_amount
    ) STORED,

    -- 貨幣
    currency_code CHAR(3) NOT NULL DEFAULT 'TWD',
    exchange_rate NUMERIC(10, 6) DEFAULT 1,

    -- 配送資訊快照
    shipping_address JSONB NOT NULL,
    billing_address JSONB,

    -- 促銷資訊
    promotion_codes TEXT[],
    promotion_discount positive_amount DEFAULT 0,

    -- 備註
    customer_note TEXT,
    internal_note TEXT,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,

    -- 約束
    CONSTRAINT orders_total_positive CHECK (total_amount >= 0)
);

-- 建立索引
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- 部分索引優化常見查詢
CREATE INDEX idx_orders_pending ON orders(created_at)
    WHERE status = 'pending';
CREATE INDEX idx_orders_processing ON orders(user_id, created_at DESC)
    WHERE status IN ('paid', 'confirmed', 'processing');

COMMENT ON TABLE orders IS '訂單主表 - 訂單核心資訊';
COMMENT ON COLUMN orders.shipping_address IS 'JSON 格式的配送地址快照';

-- 訂單項目表
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,

    -- 商品快照（防止商品資訊變更影響歷史訂單）
    product_snapshot JSONB NOT NULL,

    -- 數量和價格
    quantity INTEGER NOT NULL,
    unit_price positive_amount NOT NULL,
    subtotal positive_amount GENERATED ALWAYS AS (quantity * unit_price) STORED,

    -- 折扣
    discount_amount positive_amount DEFAULT 0,
    final_amount positive_amount GENERATED ALWAYS AS (
        quantity * unit_price - discount_amount
    ) STORED,

    -- 成本和利潤（用於報表）
    unit_cost positive_amount,
    profit_amount positive_amount GENERATED ALWAYS AS (
        CASE
            WHEN unit_cost IS NOT NULL
            THEN (quantity * unit_price - discount_amount) - (quantity * unit_cost)
            ELSE NULL
        END
    ) STORED,

    -- 履行狀態
    is_shipped BOOLEAN NOT NULL DEFAULT false,
    is_returned BOOLEAN NOT NULL DEFAULT false,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,

    -- 約束
    CONSTRAINT order_items_quantity_check CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id)
    WHERE variant_id IS NOT NULL;

COMMENT ON TABLE order_items IS '訂單項目表';
COMMENT ON COLUMN order_items.product_snapshot IS '商品快照，包含名稱、SKU、圖片等';
COMMENT ON COLUMN order_items.unit_cost IS '訂單確認時的單位成本快照，由應用層填入，用於計算利潤';

-- 訂單狀態轉換規則表
CREATE TABLE order_status_transitions (
    from_status VARCHAR(20) NOT NULL REFERENCES order_statuses(code),
    to_status VARCHAR(20) NOT NULL REFERENCES order_statuses(code),
    role_required user_role,
    description TEXT,

    PRIMARY KEY (from_status, to_status)
);

-- 插入允許的狀態轉換
INSERT INTO order_status_transitions (from_status, to_status, role_required, description) VALUES
('draft', 'pending', NULL, '提交訂單'),
('pending', 'paid', NULL, '支付成功'),
('pending', 'cancelled', NULL, '取消訂單'),
('paid', 'confirmed', 'seller', '賣家確認'),
('confirmed', 'processing', 'seller', '開始處理'),
('processing', 'shipped', 'seller', '已發貨'),
('shipped', 'delivered', NULL, '已送達'),
('delivered', 'completed', NULL, '訂單完成'),
('delivered', 'refunding', 'customer', '申請退款'),
('refunding', 'refunded', 'admin', '退款完成'),
('refunding', 'completed', 'admin', '拒絕退款');

COMMENT ON TABLE order_status_transitions IS '訂單狀態轉換規則 - 定義合法的狀態流轉';

-- ============================================================================
-- 4. 支付系統
-- ============================================================================

-- 支付狀態查詢表（與訂單狀態保持架構一致性）
CREATE TABLE payment_statuses (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入支付狀態
INSERT INTO payment_statuses (code, name, description, sort_order) VALUES
('pending', '待處理', '等待支付處理', 0),
('processing', '處理中', '支付處理中', 1),
('completed', '完成', '支付完成', 2),
('failed', '失敗', '支付失敗', 90),
('cancelled', '取消', '支付已取消', 91),
('refunded', '已退款', '已全額退款', 92),
('partial_refunded', '部分退款', '已部分退款', 93);

CREATE INDEX idx_payment_statuses_active ON payment_statuses(is_active) WHERE is_active = true;

COMMENT ON TABLE payment_statuses IS '支付狀態查詢表 - 資料驅動狀態機';

-- 退款狀態查詢表（與訂單狀態保持架構一致性）
CREATE TABLE refund_statuses (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入退款狀態
INSERT INTO refund_statuses (code, name, description, sort_order) VALUES
('pending', '待處理', '退款申請待處理', 0),
('approved', '已批准', '退款已批准', 1),
('processing', '處理中', '退款處理中', 2),
('completed', '已完成', '退款已完成', 3),
('rejected', '已拒絕', '退款申請被拒絕', 90),
('cancelled', '已取消', '退款已取消', 91);

CREATE INDEX idx_refund_statuses_active ON refund_statuses(is_active) WHERE is_active = true;

COMMENT ON TABLE refund_statuses IS '退款狀態查詢表 - 資料驅動狀態機';

-- 支付方式表（替代 ENUM，提供更多彈性）
CREATE TABLE payment_methods (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50), -- stripe, paypal, etc
    configuration JSONB, -- 配置資訊
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入預設支付方式
INSERT INTO payment_methods (code, name, provider) VALUES
('credit_card', '信用卡', 'stripe'),
('debit_card', '簽帳金融卡', 'stripe'),
('paypal', 'PayPal', 'paypal'),
('bank_transfer', '銀行轉帳', 'manual'),
('cash_on_delivery', '貨到付款', 'manual');

-- 支付記錄表
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),

    -- 金額
    amount positive_amount NOT NULL,
    currency_code CHAR(3) NOT NULL DEFAULT 'TWD',

    -- 狀態
    status VARCHAR(20) NOT NULL DEFAULT 'pending' REFERENCES payment_statuses(code),

    -- 第三方支付資訊
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    gateway_raw_response TEXT, -- 原始回應備份

    -- 錯誤處理
    failure_reason TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway_transaction ON payments(gateway_transaction_id);

-- 確保每個訂單只有一個完成的支付
CREATE UNIQUE INDEX unique_order_payment ON payments(order_id)
    WHERE status = 'completed';

COMMENT ON TABLE payments IS '支付記錄表';

-- 退款表
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,

    -- 退款資訊
    amount positive_amount NOT NULL,
    reason TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'full', -- full, partial

    -- 狀態
    status VARCHAR(20) NOT NULL DEFAULT 'pending' REFERENCES refund_statuses(code),

    -- 處理資訊
    processed_by UUID REFERENCES users(id),
    processor_note TEXT,

    -- 第三方退款資訊
    gateway_refund_id VARCHAR(255),
    gateway_response JSONB,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,

    -- 約束
    CONSTRAINT refunds_amount_check CHECK (amount > 0)
);

CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);

COMMENT ON TABLE refunds IS '退款表';

-- 支付狀態轉換規則表（資料驅動狀態機）
CREATE TABLE payment_status_transitions (
    from_status VARCHAR(20) NOT NULL REFERENCES payment_statuses(code),
    to_status VARCHAR(20) NOT NULL REFERENCES payment_statuses(code),
    description TEXT,

    PRIMARY KEY (from_status, to_status)
);

-- 插入允許的支付狀態轉換
INSERT INTO payment_status_transitions (from_status, to_status, description) VALUES
('pending', 'processing', '開始處理支付'),
('pending', 'cancelled', '取消支付'),
('processing', 'completed', '支付成功'),
('processing', 'failed', '支付失敗'),
('completed', 'refunded', '全額退款'),
('completed', 'partial_refunded', '部分退款'),
('partial_refunded', 'refunded', '完成全額退款'),
('failed', 'pending', '重試支付');

COMMENT ON TABLE payment_status_transitions IS '支付狀態轉換規則 - 定義合法的狀態流轉';

-- 退款狀態轉換規則表（資料驅動狀態機）
CREATE TABLE refund_status_transitions (
    from_status VARCHAR(20) NOT NULL REFERENCES refund_statuses(code),
    to_status VARCHAR(20) NOT NULL REFERENCES refund_statuses(code),
    description TEXT,

    PRIMARY KEY (from_status, to_status)
);

-- 插入允許的退款狀態轉換
INSERT INTO refund_status_transitions (from_status, to_status, description) VALUES
('pending', 'approved', '批准退款'),
('pending', 'rejected', '拒絕退款'),
('pending', 'cancelled', '取消退款'),
('approved', 'processing', '開始處理退款'),
('processing', 'completed', '退款完成'),
('processing', 'rejected', '處理失敗，拒絕退款');

COMMENT ON TABLE refund_status_transitions IS '退款狀態轉換規則 - 定義合法的狀態流轉';

-- ============================================================================
-- 5. 庫存管理系統
-- ============================================================================

-- 庫存異動記錄表
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

    -- 異動資訊
    type inventory_change_type NOT NULL,
    quantity INTEGER NOT NULL, -- 正數表示增加，負數表示減少

    -- 庫存快照
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,

    -- 關聯資訊
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    reference_type VARCHAR(50), -- order, return, adjustment, etc
    reference_id UUID,

    -- 原因和備註
    reason TEXT,
    performed_by UUID REFERENCES users(id),

    -- 成本（用於庫存價值計算）
    unit_cost positive_amount,
    total_cost positive_amount GENERATED ALWAYS AS (
        ABS(quantity) * unit_cost
    ) STORED,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 約束
    CONSTRAINT inventory_quantity_after_check CHECK (
        quantity_after = quantity_before + quantity
    )
);

CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_variant ON inventory_transactions(variant_id)
    WHERE variant_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX idx_inventory_transactions_order ON inventory_transactions(order_id)
    WHERE order_id IS NOT NULL;

COMMENT ON TABLE inventory_transactions IS '庫存異動記錄 - 完整的庫存追蹤';

-- 庫存預留表（處理並發訂單）
CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    status reservation_status NOT NULL DEFAULT 'pending',

    -- 預留資訊
    quantity INTEGER NOT NULL,
    reserved_for VARCHAR(50) NOT NULL, -- order, cart
    reserved_for_id UUID NOT NULL,

    -- 過期時間
    expires_at TIMESTAMPTZ NOT NULL,

    -- 狀態
    confirmed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 約束
    CONSTRAINT inventory_reservations_quantity_check CHECK (quantity > 0),
    CONSTRAINT unique_reservation UNIQUE (product_id, variant_id, reserved_for_id)
);

CREATE INDEX idx_inventory_reservations_product ON inventory_reservations(product_id);
CREATE INDEX idx_inventory_reservations_expires ON inventory_reservations(expires_at)
    WHERE released_at IS NULL;
CREATE INDEX idx_inventory_reservations_for ON inventory_reservations(reserved_for_id);

COMMENT ON TABLE inventory_reservations IS '庫存預留表 - 處理並發訂單的庫存鎖定';

-- ============================================================================
-- 6. 評價和評論系統
-- ============================================================================

-- 商品評論表
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- SET NULL 保留評論，僅匿名化
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,

    -- 評分
    rating INTEGER NOT NULL,

    -- 評論內容
    title VARCHAR(200),
    content TEXT NOT NULL,
    pros TEXT, -- 優點
    cons TEXT, -- 缺點

    -- 圖片
    images TEXT[],

    -- 互動統計
    helpful_count INTEGER NOT NULL DEFAULT 0,
    not_helpful_count INTEGER NOT NULL DEFAULT 0,

    -- 狀態
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,

    -- 審核
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 約束
    CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
    -- 注意：user_id 可為 NULL（已刪除用戶的匿名評論），NULL 不參與唯一性檢查
    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id, order_item_id),
    CONSTRAINT chk_verified_purchase CHECK (is_verified_purchase = false OR order_item_id IS NOT NULL)
);

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(product_id, rating);
CREATE INDEX idx_product_reviews_approved ON product_reviews(product_id, created_at DESC)
    WHERE is_approved = true;

COMMENT ON TABLE product_reviews IS '商品評論表';

-- ============================================================================
-- 7. 通知系統
-- ============================================================================

-- 通知模板表
CREATE TABLE notification_templates (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,

    -- 模板內容
    subject_template TEXT NOT NULL, -- 支援變數 {{order_number}}
    body_template TEXT NOT NULL,

    -- 通道
    channels TEXT[] NOT NULL DEFAULT '{email}', -- email, sms, push

    -- 狀態
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 用戶通知表
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES notification_templates(id),

    -- 通知內容
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,

    -- 類型和優先級
    category VARCHAR(50) NOT NULL, -- order, promotion, system, etc
    priority notification_priority NOT NULL DEFAULT 'normal',

    -- 關聯
    related_type VARCHAR(50),
    related_id UUID,

    -- 元數據
    metadata JSONB,

    -- 狀態
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,

    -- 發送狀態
    channels_sent JSONB, -- {"email": true, "sms": false}

    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,

    -- 約束
    CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id, created_at DESC)
    WHERE is_read = false;
CREATE INDEX idx_user_notifications_priority ON user_notifications(user_id, priority, created_at DESC)
    WHERE is_read = false;

COMMENT ON TABLE user_notifications IS '用戶通知表';

-- ============================================================================
-- 8. 審計和日誌系統
-- ============================================================================

-- 審計日誌表（按月分區）
CREATE TABLE audit_logs (
    id BIGSERIAL,

    -- 基本資訊
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE

    -- 變更資料
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- 變更的欄位列表

    -- 執行者
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- 請求資訊
    ip_address INET,
    user_agent TEXT,
    request_id UUID, -- 用於追蹤整個請求

    -- 時間戳
    performed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id, performed_at)
) PARTITION BY RANGE (performed_at);

-- 建立預設分區
CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

-- 建立當前月份和下個月的分區（避免所有日誌都寫入 default 分區）
-- 注意：部署時需根據實際日期調整
CREATE TABLE IF NOT EXISTS audit_logs_2025_11 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-11-01 00:00:00+08') TO ('2025-12-01 00:00:00+08');

CREATE TABLE IF NOT EXISTS audit_logs_2025_12 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-12-01 00:00:00+08') TO ('2026-01-01 00:00:00+08');

-- 建立索引（會自動應用到所有分區）
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id, performed_at DESC);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by) WHERE performed_by IS NOT NULL;
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at DESC);
CREATE INDEX idx_audit_logs_request ON audit_logs(request_id) WHERE request_id IS NOT NULL;

COMMENT ON TABLE audit_logs IS '審計日誌 - 追蹤所有重要資料變更';


CREATE TABLE order_number_sequences (
    date DATE PRIMARY KEY,
    last_sequence BIGINT NOT NULL DEFAULT 0
);


-- ============================================================================
-- 觸發器函數
-- ============================================================================

-- 更新 updated_at 時間戳
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 增加版本號（樂觀鎖）
CREATE OR REPLACE FUNCTION trigger_increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新商品搜尋向量（僅包含 products 表自身欄位，避免陳舊數據）
-- 品牌和分類的搜尋依賴 mv_product_catalog 物化視圖
CREATE OR REPLACE FUNCTION trigger_update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    -- 組合多語言搜尋向量（僅使用 products 表自身欄位）
    NEW.search_vector :=
        -- A 權重：名稱
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        -- B 權重：摘要
        setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
        -- C 權重：描述
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
        -- 中文搜尋（如果安裝了 pg_jieba 可以取消註解）
        -- setweight(to_tsvector('jieba', coalesce(NEW.name, '')), 'A') ||
        -- setweight(to_tsvector('jieba', coalesce(NEW.summary, '')), 'B') ||
        -- setweight(to_tsvector('jieba', coalesce(NEW.description, '')), 'C') ||
        -- D 權重：標籤（使用 simple 因為可能包含品牌名等專有名詞）
        setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_update_product_search_vector IS '更新商品搜尋向量 - 僅包含 products 表欄位避免陳舊數據，品牌/分類搜尋請使用 mv_product_catalog';

-- 級聯軟刪除商品變體（當主商品被軟刪除時，自動軟刪除其所有變體）
CREATE OR REPLACE FUNCTION trigger_cascade_soft_delete_variants()
RETURNS TRIGGER AS $$
BEGIN
    -- 檢查是否為軟刪除操作（從 NULL 變為 NOT NULL）
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        -- 級聯更新所有子變體
        UPDATE product_variants
        SET deleted_at = NEW.deleted_at,
            updated_at = NEW.deleted_at  -- 同步更新 updated_at
        WHERE product_id = NEW.id
          AND deleted_at IS NULL;  -- 避免重複觸發或無效更新

        RAISE NOTICE '已級聯軟刪除商品 % 的 % 個變體', NEW.id, FOUND;
    -- 檢查是否為恢復操作（從 NOT NULL 變為 NULL）
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
        -- 級聯恢復所有子變體（僅恢復在同一時間被刪除的變體）
        UPDATE product_variants
        SET deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE product_id = NEW.id
          AND deleted_at = OLD.deleted_at;  -- 僅恢復同時被刪除的變體

        RAISE NOTICE '已級聯恢復商品 % 的 % 個變體', NEW.id, FOUND;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_cascade_soft_delete_variants IS
    '級聯軟刪除/恢復商品變體 - 確保軟刪除的一致性，避免邏輯孤兒資料';

-- 維護分類路徑
CREATE OR REPLACE FUNCTION trigger_maintain_category_ltree()
RETURNS TRIGGER AS $$
DECLARE
    parent_ltree ltree;
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- 根分類
        NEW.ltree_path = text2ltree(NEW.slug);
    ELSE
        -- 取得父分類的 ltree 路徑
        SELECT ltree_path INTO parent_ltree
        FROM categories
        WHERE id = NEW.parent_id;

        IF parent_ltree IS NULL THEN
            RAISE EXCEPTION 'Parent category not found: %', NEW.parent_id;
        END IF;

        -- 檢查深度限制（例如最多 5 層）
        IF nlevel(parent_ltree) >= 5 THEN
            RAISE EXCEPTION 'Category hierarchy too deep (max 5 levels)';
        END IF;

        NEW.ltree_path = parent_ltree || text2ltree(NEW.slug);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新子分類的 ltree 路徑（當父分類移動或 slug 變更時）
CREATE OR REPLACE FUNCTION trigger_update_category_children_ltree()
RETURNS TRIGGER AS $$
DECLARE
    v_old_path ltree;
    v_new_path ltree;
BEGIN
    -- 僅在 ltree_path 實際變更時才觸發
    IF NEW.ltree_path = OLD.ltree_path THEN
        RETURN NEW;
    END IF;

    v_old_path := OLD.ltree_path;
    v_new_path := NEW.ltree_path;

    -- 使用 ltree 的 @> 和 <@ 操作符來更新所有子節點
    -- subpath(path, offset) 從指定偏移量開始取得子路徑
    UPDATE categories
    SET ltree_path = v_new_path || subpath(ltree_path, nlevel(v_old_path))
    WHERE ltree_path <@ v_old_path AND id != NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 檢查訂單狀態轉換
CREATE OR REPLACE FUNCTION check_order_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_allowed BOOLEAN;
BEGIN
    -- 如果狀態沒有變化，直接返回
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- 檢查狀態轉換是否允許
    SELECT EXISTS(
        SELECT 1 FROM order_status_transitions
        WHERE from_status = OLD.status AND to_status = NEW.status
    ) INTO v_allowed;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
    END IF;

    -- 更新相應的時間戳
    CASE NEW.status
        WHEN 'paid' THEN NEW.paid_at = CURRENT_TIMESTAMP;
        WHEN 'confirmed' THEN NEW.confirmed_at = CURRENT_TIMESTAMP;
        WHEN 'shipped' THEN NEW.shipped_at = CURRENT_TIMESTAMP;
        WHEN 'delivered' THEN NEW.delivered_at = CURRENT_TIMESTAMP;
        WHEN 'completed' THEN NEW.completed_at = CURRENT_TIMESTAMP;
        WHEN 'cancelled' THEN NEW.cancelled_at = CURRENT_TIMESTAMP;
        WHEN 'refunded' THEN NEW.refunded_at = CURRENT_TIMESTAMP;
        ELSE NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 審計日誌觸發器函數
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed_fields TEXT[];
BEGIN
    -- 準備審計資料
    IF TG_OP = 'DELETE' THEN
        v_old_values := to_jsonb(OLD);
        INSERT INTO audit_logs (
            table_name, record_id, operation, old_values
        ) VALUES (
            TG_TABLE_NAME, OLD.id, TG_OP, v_old_values
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);

        -- 計算變更的欄位
        SELECT array_agg(key) INTO v_changed_fields
        FROM jsonb_each(v_old_values)
        WHERE v_old_values->key IS DISTINCT FROM v_new_values->key;

        INSERT INTO audit_logs (
            table_name, record_id, operation,
            old_values, new_values, changed_fields
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP,
            v_old_values, v_new_values, v_changed_fields
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        v_new_values := to_jsonb(NEW);
        INSERT INTO audit_logs (
            table_name, record_id, operation, new_values
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, v_new_values
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_category_ancestors(p_category_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    slug VARCHAR(100),
    level INTEGER,
    ltree_path ltree
) AS $$
DECLARE
    v_path ltree;
BEGIN
    SELECT ltree_path INTO v_path
    FROM categories
    WHERE id = p_category_id;

    IF v_path IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT c.id, c.name, c.slug, c.level, c.ltree_path
    FROM categories c
    WHERE c.ltree_path @> v_path
      AND c.id != p_category_id
    ORDER BY c.level;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_category_descendants(p_category_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    slug VARCHAR(100),
    level INTEGER,
    ltree_path ltree
) AS $$
DECLARE
    v_path ltree;
BEGIN
    SELECT ltree_path INTO v_path
    FROM categories
    WHERE id = p_category_id;

    IF v_path IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT c.id, c.name, c.slug, c.level, c.ltree_path
    FROM categories c
    WHERE c.ltree_path <@ v_path
      AND c.id != p_category_id
    ORDER BY c.level, c.sort_order;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 建立觸發器
-- ============================================================================

-- 時間戳更新觸發器
CREATE TRIGGER update_timestamp_users BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();
CREATE TRIGGER update_timestamp_products BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();
CREATE TRIGGER update_timestamp_orders BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();
-- ... 為所有需要的表添加

-- 版本號觸發器
CREATE TRIGGER increment_version_users BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_increment_version();
CREATE TRIGGER increment_version_products BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION trigger_increment_version();
CREATE TRIGGER increment_version_orders BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION trigger_increment_version();
-- ... 為所有需要的表添加

-- 搜尋向量更新觸發器
CREATE TRIGGER update_product_search_vector
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION trigger_update_product_search_vector();

-- 級聯軟刪除變體觸發器（當主商品被軟刪除時，自動軟刪除其所有變體）
CREATE TRIGGER cascade_soft_delete_variants
    AFTER UPDATE ON products
    FOR EACH ROW
    WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
    EXECUTE FUNCTION trigger_cascade_soft_delete_variants();

-- 分類路徑維護觸發器
CREATE TRIGGER maintain_category_ltree
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION trigger_maintain_category_ltree();

-- 更新子分類路徑觸發器（處理節點移動）
CREATE TRIGGER update_category_children_ltree
    AFTER UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_category_children_ltree();

-- 訂單狀態檢查觸發器
CREATE TRIGGER check_order_status
    BEFORE UPDATE ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION check_order_status_transition();

-- 審計日誌觸發器（僅對重要表）
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();
-- ... 為其他重要表添加

-- ============================================================================
-- 視圖和物化視圖
-- ============================================================================

-- 產品完整資訊視圖
CREATE MATERIALIZED VIEW mv_product_catalog AS
SELECT
    p.id,
    p.sku,
    p.name,
    p.slug,
    p.summary,
    p.price,
    p.compare_price,
    p.stock_quantity,
    p.is_active,
    p.is_featured,

    -- 分類資訊
    c.name AS category_name,
    c.ltree_path AS category_path,

    -- 品牌資訊
    b.name AS brand_name,

    -- 評價統計
    COALESCE(r.avg_rating, 0) AS rating_average,
    COALESCE(r.review_count, 0) AS review_count,

    -- 銷售統計
    COALESCE(s.total_sold, 0) AS total_sold,
    COALESCE(s.revenue, 0) AS total_revenue,

    -- 首圖
    i.url AS primary_image_url,

    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN (
    SELECT
        product_id,
        AVG(rating)::NUMERIC(3,2) AS avg_rating,
        COUNT(*) AS review_count
    FROM product_reviews
    WHERE is_approved = true
    GROUP BY product_id
) r ON r.product_id = p.id
LEFT JOIN (
    SELECT
        oi.product_id,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.final_amount) AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status IN ('delivered', 'completed')
    GROUP BY oi.product_id
) s ON s.product_id = p.id
LEFT JOIN LATERAL (
    SELECT url
    FROM product_images
    WHERE product_id = p.id AND is_primary = true
    LIMIT 1
) i ON true
WHERE p.deleted_at IS NULL;

-- 建立索引
CREATE UNIQUE INDEX idx_mv_product_catalog_id ON mv_product_catalog(id);
CREATE INDEX idx_mv_product_catalog_sku ON mv_product_catalog(sku);
CREATE INDEX idx_mv_product_catalog_slug ON mv_product_catalog(slug);
CREATE INDEX idx_mv_product_catalog_price ON mv_product_catalog(price);
CREATE INDEX idx_mv_product_catalog_rating ON mv_product_catalog(rating_average DESC);

COMMENT ON MATERIALIZED VIEW mv_product_catalog IS '產品目錄物化視圖 - 用於商品列表和搜尋';

-- 用戶訂單統計視圖
CREATE VIEW v_user_order_stats AS
SELECT
    u.id AS user_id,
    COUNT(DISTINCT o.id) AS total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS completed_orders,
    SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) AS total_spent,
    AVG(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE NULL END) AS avg_order_value,
    MAX(o.created_at) AS last_order_date,

    -- 分類偏好
    mode() WITHIN GROUP (ORDER BY c.id) AS favorite_category_id,

    -- 會員等級計算（基於消費金額）
    CASE
        WHEN SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) >= 100000 THEN 'platinum'
        WHEN SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) >= 50000 THEN 'gold'
        WHEN SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) >= 10000 THEN 'silver'
        ELSE 'bronze'
    END AS customer_tier
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY u.id;

COMMENT ON VIEW v_user_order_stats IS '用戶訂單統計視圖';

-- 庫存警報視圖
CREATE VIEW v_inventory_alerts AS
SELECT
    p.id AS product_id,
    p.sku,
    p.name,
    p.stock_quantity,
    p.low_stock_threshold,
    pv.id AS variant_id,
    pv.variant_sku,
    pv.stock_quantity AS variant_stock,
    CASE
        WHEN pv.id IS NOT NULL AND pv.stock_quantity <= p.low_stock_threshold THEN 'variant_low_stock'
        WHEN pv.id IS NULL AND p.stock_quantity <= p.low_stock_threshold THEN 'product_low_stock'
        WHEN pv.id IS NOT NULL AND pv.stock_quantity = 0 THEN 'variant_out_of_stock'
        WHEN pv.id IS NULL AND p.stock_quantity = 0 THEN 'product_out_of_stock'
    END AS alert_type
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.track_inventory = true
  AND (
    (pv.id IS NOT NULL AND pv.stock_quantity <= p.low_stock_threshold)
    OR (pv.id IS NULL AND p.stock_quantity <= p.low_stock_threshold)
  );

COMMENT ON VIEW v_inventory_alerts IS '庫存警報視圖 - 監控低庫存商品';

-- 每日銷售統計視圖
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT
    DATE(o.created_at) AS sale_date,
    COUNT(DISTINCT o.id) AS order_count,
    COUNT(DISTINCT o.user_id) AS unique_customers,
    SUM(o.total_amount) AS gross_revenue,
    SUM(o.discount_amount) AS total_discounts,
    SUM(o.shipping_fee) AS total_shipping,
    SUM(o.tax_amount) AS total_tax,
    SUM(o.total_amount - COALESCE(oi_cost.total_cost, 0)) AS net_profit,
    AVG(o.total_amount) AS avg_order_value
FROM orders o
LEFT JOIN LATERAL (
    SELECT SUM(oi.quantity * oi.unit_cost) AS total_cost
    FROM order_items oi
    WHERE oi.order_id = o.id
) oi_cost ON true
WHERE o.status IN ('paid', 'confirmed', 'processing', 'shipped', 'delivered', 'completed')
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

CREATE UNIQUE INDEX idx_mv_daily_sales_date ON mv_daily_sales(sale_date);

COMMENT ON MATERIALIZED VIEW mv_daily_sales IS '每日銷售統計 - 用於報表和分析';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- 啟用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;

-- 用戶只能看到自己的資料
CREATE POLICY users_self_policy ON users
    FOR ALL
    USING (id = current_setting('app.current_user_id')::UUID OR
           current_setting('app.current_user_role') IN ('admin', 'super_admin'));

CREATE POLICY addresses_owner_policy ON user_addresses
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID OR
           current_setting('app.current_user_role') IN ('admin', 'super_admin'));

CREATE POLICY orders_owner_policy ON orders
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::UUID OR
           current_setting('app.current_user_role') IN ('seller', 'admin', 'super_admin'));

CREATE POLICY carts_owner_policy ON shopping_carts
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID OR
           session_id = current_setting('app.session_id'));

-- ============================================================================
-- 輔助函數
-- ============================================================================

-- 生成訂單號
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
    v_date DATE := CURRENT_DATE;
    v_sequence BIGINT;
    v_order_number VARCHAR;
BEGIN
    -- 使用 Advisory Lock 確保原子性（基於日期的鎖）
    PERFORM pg_advisory_xact_lock(hashtext(v_date::TEXT));

    -- UPSERT: 如果今天的序列不存在則創建，存在則遞增
    INSERT INTO order_number_sequences (date, last_sequence)
    VALUES (v_date, 1)
    ON CONFLICT (date)
    DO UPDATE SET last_sequence = order_number_sequences.last_sequence + 1
    RETURNING last_sequence INTO v_sequence;

    -- 格式: ORD-20241118-00001
    v_order_number := 'ORD-' || TO_CHAR(v_date, 'YYYYMMDD') || '-' || LPAD(v_sequence::TEXT, 5, '0');

    RETURN v_order_number;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION generate_order_number IS '生成訂單號 - 使用 Advisory Lock 確保並發安全';

-- 計算購物車總額（僅聚合數據，稅務/運費/折扣邏輯應在應用層處理）
CREATE OR REPLACE FUNCTION calculate_cart_total(p_cart_id UUID)
RETURNS TABLE(
    items_count INTEGER,
    subtotal NUMERIC,
    estimated_tax NUMERIC,
    estimated_shipping NUMERIC,
    estimated_total NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS items_count,
        COALESCE(SUM(ci.subtotal), 0) AS subtotal,
        0::NUMERIC AS estimated_tax,      -- Deprecated: 應在應用層根據稅務規則計算
        0::NUMERIC AS estimated_shipping, -- Deprecated: 應在應用層根據運費規則計算
        COALESCE(SUM(ci.subtotal), 0) AS estimated_total -- 僅商品小計，應用層應加上稅費和運費
    FROM cart_items ci
    WHERE ci.cart_id = p_cart_id
      AND ci.is_saved_for_later = false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_cart_total IS
    '計算購物車總額 - 僅聚合數據（items_count, subtotal），稅務/運費/折扣等業務邏輯應在應用層根據可配置規則處理，避免資料庫函數包含易變的業務規則';

-- 取得可用庫存（考慮預留，使用行級鎖防止競爭條件）
-- 注意：此函數應在事務中調用，p_lock=true 時會鎖定庫存行
CREATE OR REPLACE FUNCTION get_available_stock(
    p_product_id UUID,
    p_variant_id UUID DEFAULT NULL,
    p_lock BOOLEAN DEFAULT false  -- 是否使用 FOR UPDATE 鎖定
)
RETURNS INTEGER AS $$
DECLARE
    v_physical_stock INTEGER;
    v_reserved_stock INTEGER;
BEGIN
    -- 取得實體庫存（可選擇性加鎖以防止競爭條件）
    IF p_variant_id IS NOT NULL THEN
        IF p_lock THEN
            SELECT stock_quantity INTO v_physical_stock
            FROM product_variants
            WHERE id = p_variant_id
            FOR UPDATE;
        ELSE
            SELECT stock_quantity INTO v_physical_stock
            FROM product_variants
            WHERE id = p_variant_id;
        END IF;
    ELSE
        IF p_lock THEN
            SELECT stock_quantity INTO v_physical_stock
            FROM products
            WHERE id = p_product_id
            FOR UPDATE;
        ELSE
            SELECT stock_quantity INTO v_physical_stock
            FROM products
            WHERE id = p_product_id;
        END IF;
    END IF;

    -- 計算已預留庫存（使用一致性快照，檢查 status）
    SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
    FROM inventory_reservations
    WHERE product_id = p_product_id
      AND (p_variant_id IS NULL OR variant_id = p_variant_id)
      AND status IN ('pending', 'confirmed')
      AND expires_at > CURRENT_TIMESTAMP;

    RETURN v_physical_stock - v_reserved_stock;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reserve_inventory(
    p_product_id UUID,
    p_variant_id UUID,
    p_quantity INTEGER,
    p_reserved_for VARCHAR(50),  -- 'cart', 'order'
    p_reserved_for_id UUID,
    p_duration INTERVAL DEFAULT INTERVAL '15 minutes'
)
RETURNS TABLE (
    reservation_id UUID,
    available_before INTEGER,
    available_after INTEGER,
    status TEXT
) AS $$
DECLARE
    v_reservation_id UUID;
    v_available_stock INTEGER;
    v_physical_stock INTEGER;
    v_reserved_stock INTEGER;
BEGIN
    -- 取得實體庫存（使用行級鎖）
    IF p_variant_id IS NOT NULL THEN
        SELECT stock_quantity INTO v_physical_stock
        FROM product_variants
        WHERE id = p_variant_id
        FOR UPDATE;
    ELSE
        SELECT stock_quantity INTO v_physical_stock
        FROM products
        WHERE id = p_product_id
        FOR UPDATE;
    END IF;

    -- 計算已預留的庫存
    SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
    FROM inventory_reservations
    WHERE product_id = p_product_id
      AND (p_variant_id IS NULL OR variant_id = p_variant_id)
      AND status IN ('pending', 'confirmed')
      AND expires_at > CURRENT_TIMESTAMP;

    -- 計算可用庫存
    v_available_stock := v_physical_stock - v_reserved_stock;

    -- 檢查庫存是否足夠
    IF v_available_stock < p_quantity THEN
        RETURN QUERY
        SELECT
            NULL::UUID,
            v_available_stock,
            v_available_stock,
            'insufficient_stock'::TEXT;
        RETURN;
    END IF;

    -- 創建預留
    INSERT INTO inventory_reservations (
        product_id, variant_id, quantity,
        reserved_for, reserved_for_id,
        expires_at, status
    ) VALUES (
        p_product_id, p_variant_id, p_quantity,
        p_reserved_for, p_reserved_for_id,
        CURRENT_TIMESTAMP + p_duration, 'pending'
    )
    ON CONFLICT (product_id, variant_id, reserved_for_id)
    DO UPDATE SET
        quantity = inventory_reservations.quantity + EXCLUDED.quantity,
        expires_at = EXCLUDED.expires_at
    RETURNING id INTO v_reservation_id;

    RETURN QUERY
    SELECT
        v_reservation_id,
        v_available_stock,
        v_available_stock - p_quantity,
        'reserved'::TEXT;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION confirm_reservation_and_deduct (
    p_reservation_id UUID,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_reservation RECORD;
    v_new_stock INTEGER;
BEGIN
    -- 取得預留資訊並鎖定
    SELECT * INTO v_reservation
    FROM inventory_reservations
    WHERE id = p_reservation_id
      AND status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 執行庫存扣減
    IF v_reservation.variant_id IS NOT NULL THEN
        UPDATE product_variants
        SET stock_quantity = stock_quantity - v_reservation.quantity,
            version = version + 1
        WHERE id = v_reservation.variant_id
        RETURNING stock_quantity INTO v_new_stock;
    ELSE
        UPDATE products
        SET stock_quantity = stock_quantity - v_reservation.quantity,
            version = version + 1
        WHERE id = v_reservation.product_id
        RETURNING stock_quantity INTO v_new_stock;
    END IF;

    -- 更新預留狀態
    UPDATE inventory_reservations
    SET status = 'confirmed',
        confirmed_at = CURRENT_TIMESTAMP
    WHERE id = p_reservation_id;

    -- 記錄庫存異動
    INSERT INTO inventory_transactions (
        product_id, variant_id, type, quantity,
        quantity_before, quantity_after,
        order_id, reference_type, reference_id,
        reason
    ) VALUES (
        v_reservation.product_id,
        v_reservation.variant_id,
        'sale',
        -v_reservation.quantity,
        v_new_stock + v_reservation.quantity,
        v_new_stock,
        p_order_id,
        'order',
        p_order_id,
        'Order confirmed and paid'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cancel_reservation(
    p_reservation_id UUID,
    p_reason TEXT DEFAULT 'User cancelled'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE inventory_reservations
    SET status = 'cancelled',
        released_at = CURRENT_TIMESTAMP
    WHERE id = p_reservation_id
      AND status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH expired AS (
        UPDATE inventory_reservations
        SET status = 'expired',
            released_at = CURRENT_TIMESTAMP
        WHERE expires_at < CURRENT_TIMESTAMP
          AND status = 'pending'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM expired;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 定時任務
-- ============================================================================

-- 清理過期的購物車
SELECT cron.schedule('cleanup-expired-carts', '0 2 * * *', $$
    DELETE FROM shopping_carts
    WHERE expires_at < CURRENT_TIMESTAMP
      AND is_active = true;
$$);

-- 釋放過期的庫存預留（調用函數以保持邏輯一致）
SELECT cron.schedule('release-expired-reservations', '*/5 * * * *', $$
    SELECT release_expired_reservations();
$$);

-- 刷新物化視圖
SELECT cron.schedule('refresh-materialized-views', '0 */6 * * *', $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_catalog;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
$$);

-- 自動建立 audit_logs 未來分區（每月 1 號執行，建立 +2 個月的分區）
SELECT cron.schedule('create-audit-logs-partition', '0 0 1 * *', $cron$
DO $partition$
DECLARE
    v_next_month TEXT := to_char(CURRENT_DATE + interval '2 months', 'YYYY_MM');
    v_next_start TIMESTAMPTZ := date_trunc('month', CURRENT_DATE + interval '2 months');
    v_next_end TIMESTAMPTZ := v_next_start + interval '1 month';
    v_partition_name TEXT := 'audit_logs_' || v_next_month;
BEGIN
    -- 檢查分區是否已存在
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = v_partition_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
            v_partition_name, v_next_start, v_next_end
        );
        RAISE NOTICE 'Created partition: %', v_partition_name;
    END IF;
END;
$partition$;
$cron$);

-- ============================================================================
-- 初始資料
-- ============================================================================

-- 插入基礎分類（ltree_path 會自動由觸發器生成）
INSERT INTO categories (code, name, slug) VALUES
('electronics', '電子產品', 'electronics'),
('clothing', '服飾', 'clothing'),
('books', '書籍', 'books'),
('home', '家居生活', 'home'),
('sports', '運動戶外', 'sports');

-- ============================================================================
-- 權限設置
-- ============================================================================

-- 建立角色
CREATE ROLE app_read;
CREATE ROLE app_write;
CREATE ROLE app_admin;

-- 授予權限
GRANT USAGE ON SCHEMA public TO app_read, app_write, app_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_write;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_write, app_admin;

-- ============================================================================
-- 完成訊息
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '電商資料庫架構 v3.0 建立完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '統計資訊：';
    RAISE NOTICE '- 資料表數量: %', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public');
    RAISE NOTICE '- 索引數量: %', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
    RAISE NOTICE '- 觸發器數量: %', (SELECT COUNT(*) FROM pg_trigger WHERE NOT tgisinternal);
    RAISE NOTICE '- 函數數量: %', (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace);
    RAISE NOTICE '';
    RAISE NOTICE '請記得：';
    RAISE NOTICE '1. 設定 pg_cron 定時任務';
    RAISE NOTICE '2. 配置應用程式連線池';
    RAISE NOTICE '3. 定期執行 VACUUM 和 ANALYZE';
    RAISE NOTICE '4. 監控慢查詢並優化';
    RAISE NOTICE '========================================';
END $$;
