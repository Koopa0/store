-- ============================================================================
-- 訂單編號自動生成 Trigger
-- ============================================================================
-- 目的: 在插入訂單時自動生成 order_number
-- 格式: ORD-YYYYMMDD-XXXXX
--
-- 使用方式:
--   INSERT INTO orders (user_id, subtotal, shipping_address, ...)
--   VALUES (...);
--   -- order_number 會自動生成
-- ============================================================================

-- 創建觸發器函數
CREATE OR REPLACE FUNCTION trigger_generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果 order_number 為 NULL 或空字串，則自動生成
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_generate_order_number IS
'訂單插入時自動生成訂單編號 - 如果 order_number 未提供則調用 generate_order_number()';

-- 創建觸發器
DROP TRIGGER IF EXISTS auto_generate_order_number ON orders;

CREATE TRIGGER auto_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_order_number();

COMMENT ON TRIGGER auto_generate_order_number ON orders IS
'自動生成訂單編號 - 在插入訂單前觸發';

-- ============================================================================
-- 測試案例
-- ============================================================================

-- 測試 1: 插入訂單時自動生成編號
DO $$
DECLARE
    test_user_id UUID;
    test_order_id UUID;
    generated_number VARCHAR;
BEGIN
    -- 確保有測試用戶（如果沒有則跳過測試）
    SELECT id INTO test_user_id FROM users LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- 插入測試訂單
        INSERT INTO orders (
            user_id,
            subtotal,
            shipping_address,
            status
        ) VALUES (
            test_user_id,
            1000,
            '{"address": "測試地址"}'::jsonb,
            'pending'
        ) RETURNING id, order_number INTO test_order_id, generated_number;

        RAISE NOTICE '✅ 測試通過 - 自動生成訂單編號: %', generated_number;

        -- 驗證格式
        IF generated_number ~ '^ORD-\d{8}-\d{5}$' THEN
            RAISE NOTICE '✅ 訂單編號格式正確';
        ELSE
            RAISE WARNING '❌ 訂單編號格式錯誤: %', generated_number;
        END IF;

        -- 清理測試數據
        DELETE FROM orders WHERE id = test_order_id;
        RAISE NOTICE '🧹 已清理測試數據';
    ELSE
        RAISE NOTICE '⏭️  跳過測試 - 資料庫中無測試用戶';
    END IF;
END $$;

-- 測試 2: 手動提供訂單編號（不應被覆蓋）
DO $$
DECLARE
    test_user_id UUID;
    test_order_id UUID;
    manual_number VARCHAR := 'MANUAL-123';
    result_number VARCHAR;
BEGIN
    SELECT id INTO test_user_id FROM users LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        INSERT INTO orders (
            user_id,
            order_number,
            subtotal,
            shipping_address,
            status
        ) VALUES (
            test_user_id,
            manual_number,
            1000,
            '{"address": "測試地址"}'::jsonb,
            'pending'
        ) RETURNING id, order_number INTO test_order_id, result_number;

        IF result_number = manual_number THEN
            RAISE NOTICE '✅ 手動訂單編號保留: %', result_number;
        ELSE
            RAISE WARNING '❌ 手動訂單編號被覆蓋: % -> %', manual_number, result_number;
        END IF;

        DELETE FROM orders WHERE id = test_order_id;
    END IF;
END $$;

-- ============================================================================
-- 使用範例
-- ============================================================================

/*
-- 範例 1: 創建訂單（自動生成編號）
INSERT INTO orders (
    user_id,
    subtotal,
    shipping_address,
    billing_address,
    status
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000'::uuid,
    5999.99,
    '{"country": "TW", "city": "台北市", "address": "信義區信義路五段7號"}'::jsonb,
    '{"country": "TW", "city": "台北市", "address": "信義區信義路五段7號"}'::jsonb,
    'pending'
);
-- order_number 會自動生成為: ORD-20251118-00001

-- 範例 2: 查詢今日訂單
SELECT order_number, user_id, total_amount, status, created_at
FROM orders
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;

-- 範例 3: 查詢特定訂單
SELECT *
FROM orders
WHERE order_number = 'ORD-20251118-00001';

-- 範例 4: 查看今日序號狀態
SELECT date, last_sequence
FROM order_number_sequences
WHERE date = CURRENT_DATE;
*/
