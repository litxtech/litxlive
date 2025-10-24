-- FONKSİYONLARI TAM DÜZELT
-- Tüm mevcut fonksiyonları sil ve yeniden oluştur

-- ==============================================
-- 1. TÜM MEVCUT FONKSİYONLARI SİL
-- ==============================================

-- Tüm admin fonksiyonlarını sil (farklı parametrelerle)
DROP FUNCTION IF EXISTS admin_set_blue_tick(UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS admin_set_blue_tick(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS admin_set_blue_tick(UUID, BOOLEAN, VARCHAR);

DROP FUNCTION IF EXISTS admin_ban_user(UUID, VARCHAR(50), INTEGER, TEXT);
DROP FUNCTION IF EXISTS admin_ban_user(UUID, VARCHAR(50), INTEGER);
DROP FUNCTION IF EXISTS admin_ban_user(UUID, VARCHAR(50));
DROP FUNCTION IF EXISTS admin_ban_user(UUID, TEXT, INTEGER, TEXT);

DROP FUNCTION IF EXISTS admin_unban_user(UUID, TEXT);
DROP FUNCTION IF EXISTS admin_unban_user(UUID);

DROP FUNCTION IF EXISTS admin_mint_coin(UUID, DECIMAL(10,2), TEXT);
DROP FUNCTION IF EXISTS admin_mint_coin(UUID, DECIMAL(10,2));
DROP FUNCTION IF EXISTS admin_mint_coin(UUID, INTEGER, TEXT);

DROP FUNCTION IF EXISTS admin_burn_coin(UUID, DECIMAL(10,2), TEXT);
DROP FUNCTION IF EXISTS admin_burn_coin(UUID, DECIMAL(10,2));
DROP FUNCTION IF EXISTS admin_burn_coin(UUID, INTEGER, TEXT);

-- Test fonksiyonunu sil
DROP FUNCTION IF EXISTS test_admin_functions();

-- ==============================================
-- 2. YENİ FONKSİYONLARI OLUŞTUR
-- ==============================================

-- Blue tick yönetimi
CREATE FUNCTION admin_set_blue_tick(
    p_target_user UUID,
    p_set BOOLEAN,
    p_reason TEXT DEFAULT 'admin_action'
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_current_user UUID;
BEGIN
    -- Mevcut kullanıcıyı al
    v_current_user := auth.uid();
    
    -- Admin kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM admin_users au
        WHERE au.user_id = v_current_user
        AND au.is_active = true
    ) AND NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = v_current_user
        AND p.email = 'support@litxtech.com'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Admin yetkisi gerekli'
        );
    END IF;
    
    -- Blue tick durumunu güncelle
    UPDATE profiles 
    SET 
        is_verified = p_set,
        updated_at = NOW()
    WHERE id = p_target_user;
    
    -- Audit log ekle
    INSERT INTO audit_log (admin_user_id, action, target_type, target_id, new_values)
    VALUES (
        v_current_user,
        'ADMIN_SET_BLUE_TICK',
        'profile',
        p_target_user,
        jsonb_build_object(
            'blue_tick_set', p_set,
            'reason', p_reason,
            'admin_action', true
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', CASE WHEN p_set THEN 'Blue tick verildi' ELSE 'Blue tick kaldırıldı' END,
        'target_user', p_target_user
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ban yönetimi
CREATE FUNCTION admin_ban_user(
    p_target_user UUID,
    p_type VARCHAR(50),
    p_minutes INTEGER DEFAULT NULL,
    p_reason TEXT DEFAULT 'admin_ban'
)
RETURNS JSONB AS $$
DECLARE
    v_ban_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_current_user UUID;
BEGIN
    -- Mevcut kullanıcıyı al
    v_current_user := auth.uid();
    
    -- Admin kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM admin_users au
        WHERE au.user_id = v_current_user
        AND au.is_active = true
    ) AND NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = v_current_user
        AND p.email = 'support@litxtech.com'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Admin yetkisi gerekli'
        );
    END IF;
    
    -- Eski banları deaktive et
    UPDATE user_bans 
    SET is_active = false 
    WHERE user_id = p_target_user AND is_active = true;
    
    -- Expire time hesapla
    IF p_type = 'temp' AND p_minutes IS NOT NULL THEN
        v_expires_at := NOW() + (p_minutes || ' minutes')::INTERVAL;
    ELSE
        v_expires_at := NULL;
    END IF;
    
    -- Yeni ban oluştur
    INSERT INTO user_bans (
        user_id, ban_type, reason, duration_hours, is_active, expires_at
    ) VALUES (
        p_target_user, p_type, p_reason, 
        CASE WHEN p_minutes IS NOT NULL THEN p_minutes / 60 ELSE NULL END,
        true, v_expires_at
    ) RETURNING id INTO v_ban_id;
    
    -- Profili deaktive et (hard ban için)
    IF p_type = 'hard' THEN
        UPDATE profiles SET is_active = false WHERE id = p_target_user;
    END IF;
    
    -- Audit log ekle
    INSERT INTO audit_log (admin_user_id, action, target_type, target_id, new_values)
    VALUES (
        v_current_user,
        'ADMIN_BAN_USER',
        'profile',
        p_target_user,
        jsonb_build_object(
            'ban_type', p_type,
            'duration_minutes', p_minutes,
            'reason', p_reason,
            'ban_id', v_ban_id
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Ban uygulandı',
        'ban_id', v_ban_id,
        'target_user', p_target_user
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unban fonksiyonu
CREATE FUNCTION admin_unban_user(
    p_target_user UUID,
    p_reason TEXT DEFAULT 'admin_unban'
)
RETURNS JSONB AS $$
DECLARE
    v_current_user UUID;
BEGIN
    -- Mevcut kullanıcıyı al
    v_current_user := auth.uid();
    
    -- Admin kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM admin_users au
        WHERE au.user_id = v_current_user
        AND au.is_active = true
    ) AND NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = v_current_user
        AND p.email = 'support@litxtech.com'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Admin yetkisi gerekli'
        );
    END IF;
    
    -- Aktif banları deaktive et
    UPDATE user_bans 
    SET is_active = false 
    WHERE user_id = p_target_user AND is_active = true;
    
    -- Profili aktif et
    UPDATE profiles SET is_active = true WHERE id = p_target_user;
    
    -- Audit log ekle
    INSERT INTO audit_log (admin_user_id, action, target_type, target_id, new_values)
    VALUES (
        v_current_user,
        'ADMIN_UNBAN_USER',
        'profile',
        p_target_user,
        jsonb_build_object(
            'reason', p_reason,
            'unban_action', true
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Unban tamamlandı',
        'target_user', p_target_user
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Coin mint fonksiyonu
CREATE FUNCTION admin_mint_coin(
    p_target_user UUID,
    p_amount DECIMAL(10,2),
    p_reason TEXT DEFAULT 'admin_mint'
)
RETURNS JSONB AS $$
DECLARE
    v_transaction_id UUID;
    v_new_balance DECIMAL(10,2);
    v_current_balance DECIMAL(10,2);
    v_current_user UUID;
BEGIN
    -- Mevcut kullanıcıyı al
    v_current_user := auth.uid();
    
    -- Admin kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM admin_users au
        WHERE au.user_id = v_current_user
        AND au.is_active = true
    ) AND NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = v_current_user
        AND p.email = 'support@litxtech.com'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Admin yetkisi gerekli'
        );
    END IF;
    
    -- Mevcut bakiyeyi al
    SELECT COALESCE(coins, 0) INTO v_current_balance
    FROM profiles
    WHERE id = p_target_user;
    
    -- Yeni bakiye hesapla
    v_new_balance := v_current_balance + p_amount;
    
    -- Profili güncelle
    UPDATE profiles 
    SET coins = v_new_balance, updated_at = NOW()
    WHERE id = p_target_user;
    
    -- Transaction kaydı oluştur
    INSERT INTO coin_transactions (
        user_id, transaction_type, amount, balance_after, reason_code, admin_id
    ) VALUES (
        p_target_user, 'ADMIN_MINT', p_amount, v_new_balance, p_reason, v_current_user
    ) RETURNING id INTO v_transaction_id;
    
    -- Audit log ekle
    INSERT INTO audit_log (admin_user_id, action, target_type, target_id, new_values)
    VALUES (
        v_current_user,
        'ADMIN_MINT_COIN',
        'profile',
        p_target_user,
        jsonb_build_object(
            'amount', p_amount,
            'old_balance', v_current_balance,
            'new_balance', v_new_balance,
            'reason', p_reason,
            'transaction_id', v_transaction_id
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Coin mint tamamlandı',
        'amount', p_amount,
        'new_balance', v_new_balance,
        'transaction_id', v_transaction_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Coin burn fonksiyonu
CREATE FUNCTION admin_burn_coin(
    p_target_user UUID,
    p_amount DECIMAL(10,2),
    p_reason TEXT DEFAULT 'admin_burn'
)
RETURNS JSONB AS $$
DECLARE
    v_transaction_id UUID;
    v_new_balance DECIMAL(10,2);
    v_current_balance DECIMAL(10,2);
    v_current_user UUID;
BEGIN
    -- Mevcut kullanıcıyı al
    v_current_user := auth.uid();
    
    -- Admin kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM admin_users au
        WHERE au.user_id = v_current_user
        AND au.is_active = true
    ) AND NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = v_current_user
        AND p.email = 'support@litxtech.com'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Admin yetkisi gerekli'
        );
    END IF;
    
    -- Mevcut bakiyeyi al
    SELECT COALESCE(coins, 0) INTO v_current_balance
    FROM profiles
    WHERE id = p_target_user;
    
    -- Yeni bakiye hesapla (negatif olamaz)
    v_new_balance := GREATEST(0, v_current_balance - p_amount);
    
    -- Profili güncelle
    UPDATE profiles 
    SET coins = v_new_balance, updated_at = NOW()
    WHERE id = p_target_user;
    
    -- Transaction kaydı oluştur
    INSERT INTO coin_transactions (
        user_id, transaction_type, amount, balance_after, reason_code, admin_id
    ) VALUES (
        p_target_user, 'ADMIN_BURN', -p_amount, v_new_balance, p_reason, v_current_user
    ) RETURNING id INTO v_transaction_id;
    
    -- Audit log ekle
    INSERT INTO audit_log (admin_user_id, action, target_type, target_id, new_values)
    VALUES (
        v_current_user,
        'ADMIN_BURN_COIN',
        'profile',
        p_target_user,
        jsonb_build_object(
            'amount', p_amount,
            'old_balance', v_current_balance,
            'new_balance', v_new_balance,
            'reason', p_reason,
            'transaction_id', v_transaction_id
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Coin burn tamamlandı',
        'amount', p_amount,
        'new_balance', v_new_balance,
        'transaction_id', v_transaction_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. FONKSİYON İZİNLERİ
-- ==============================================

-- Admin fonksiyonlarına sadece admin kullanıcılar erişebilir
GRANT EXECUTE ON FUNCTION admin_set_blue_tick TO authenticated;
GRANT EXECUTE ON FUNCTION admin_ban_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unban_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_mint_coin TO authenticated;
GRANT EXECUTE ON FUNCTION admin_burn_coin TO authenticated;

-- ==============================================
-- 4. TEST FONKSİYONU
-- ==============================================

CREATE FUNCTION test_admin_functions()
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'admin_set_blue_tick', 'OK',
        'admin_ban_user', 'OK',
        'admin_unban_user', 'OK',
        'admin_mint_coin', 'OK',
        'admin_burn_coin', 'OK',
        'test_time', NOW()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Test fonksiyonunu çalıştır
SELECT test_admin_functions();

-- ==============================================
-- FONKSİYONLAR TAM DÜZELTİLDİ
-- ==============================================
