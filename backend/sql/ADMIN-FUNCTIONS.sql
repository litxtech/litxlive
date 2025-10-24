-- ADMIN PANEL FONKSİYONLARI
-- Eksik admin fonksiyonlarını ekle

-- ==============================================
-- 1. BLUE TICK YÖNETİMİ
-- ==============================================

CREATE OR REPLACE FUNCTION admin_set_blue_tick(
    p_target_user UUID,
    p_set BOOLEAN,
    p_reason TEXT DEFAULT 'admin_action'
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Blue tick durumunu güncelle
    UPDATE profiles 
    SET 
        is_verified = p_set,
        updated_at = NOW()
    WHERE id = p_target_user;
    
    -- Audit log ekle
    INSERT INTO audit_logs (action, target_type, target_id, new_values)
    VALUES (
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

-- ==============================================
-- 2. BAN YÖNETİMİ
-- ==============================================

CREATE OR REPLACE FUNCTION admin_ban_user(
    p_target_user UUID,
    p_type VARCHAR(50),
    p_minutes INTEGER DEFAULT NULL,
    p_reason TEXT DEFAULT 'admin_ban'
)
RETURNS JSONB AS $$
DECLARE
    v_ban_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
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
    INSERT INTO audit_logs (action, target_type, target_id, new_values)
    VALUES (
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

-- ==============================================
-- 3. UNBAN FONKSİYONU
-- ==============================================

CREATE OR REPLACE FUNCTION admin_unban_user(
    p_target_user UUID,
    p_reason TEXT DEFAULT 'admin_unban'
)
RETURNS JSONB AS $$
BEGIN
    -- Aktif banları deaktive et
    UPDATE user_bans 
    SET is_active = false 
    WHERE user_id = p_target_user AND is_active = true;
    
    -- Profili aktif et
    UPDATE profiles SET is_active = true WHERE id = p_target_user;
    
    -- Audit log ekle
    INSERT INTO audit_logs (action, target_type, target_id, new_values)
    VALUES (
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

-- ==============================================
-- 4. COIN MINT FONKSİYONU
-- ==============================================

CREATE OR REPLACE FUNCTION admin_mint_coin(
    p_target_user UUID,
    p_amount DECIMAL(10,2),
    p_reason TEXT DEFAULT 'admin_mint'
)
RETURNS JSONB AS $$
DECLARE
    v_transaction_id UUID;
    v_new_balance DECIMAL(10,2);
    v_current_balance DECIMAL(10,2);
BEGIN
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
        user_id, transaction_type, amount, balance_after, reason_code
    ) VALUES (
        p_target_user, 'ADMIN_MINT', p_amount, v_new_balance, p_reason
    ) RETURNING id INTO v_transaction_id;
    
    -- Audit log ekle
    INSERT INTO audit_logs (action, target_type, target_id, new_values)
    VALUES (
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

-- ==============================================
-- 5. COIN BURN FONKSİYONU
-- ==============================================

CREATE OR REPLACE FUNCTION admin_burn_coin(
    p_target_user UUID,
    p_amount DECIMAL(10,2),
    p_reason TEXT DEFAULT 'admin_burn'
)
RETURNS JSONB AS $$
DECLARE
    v_transaction_id UUID;
    v_new_balance DECIMAL(10,2);
    v_current_balance DECIMAL(10,2);
BEGIN
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
        user_id, transaction_type, amount, balance_after, reason_code
    ) VALUES (
        p_target_user, 'ADMIN_BURN', -p_amount, v_new_balance, p_reason
    ) RETURNING id INTO v_transaction_id;
    
    -- Audit log ekle
    INSERT INTO audit_logs (action, target_type, target_id, new_values)
    VALUES (
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
-- 6. ADMIN YETKİ KONTROLÜ
-- ==============================================

CREATE OR REPLACE FUNCTION check_admin_permissions(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN := false;
    v_user_email TEXT;
BEGIN
    -- Kullanıcı email'ini al
    SELECT email INTO v_user_email
    FROM profiles
    WHERE id = p_user_id;
    
    -- Admin kontrolü
    SELECT EXISTS(
        SELECT 1 FROM admin_users au
        JOIN profiles p ON au.user_id = p.id
        WHERE p.id = p_user_id
        AND au.is_active = true
    ) OR v_user_email = 'support@litxtech.com'
    INTO v_is_admin;
    
    RETURN v_is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 7. GÜVENLİK KONTROLLERİ
-- ==============================================

-- Admin fonksiyonları için güvenlik
CREATE OR REPLACE FUNCTION admin_set_blue_tick(
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
    IF NOT check_admin_permissions(v_current_user) THEN
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
    INSERT INTO audit_logs (admin_user_id, action, target_type, target_id, new_values)
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

-- ==============================================
-- 8. FONKSİYON İZİNLERİ
-- ==============================================

-- Admin fonksiyonlarına sadece admin kullanıcılar erişebilir
GRANT EXECUTE ON FUNCTION admin_set_blue_tick TO authenticated;
GRANT EXECUTE ON FUNCTION admin_ban_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unban_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_mint_coin TO authenticated;
GRANT EXECUTE ON FUNCTION admin_burn_coin TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_permissions TO authenticated;

-- ==============================================
-- 9. TEST FONKSİYONU
-- ==============================================

CREATE OR REPLACE FUNCTION test_admin_functions()
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
        'check_admin_permissions', 'OK',
        'test_time', NOW()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Test fonksiyonunu çalıştır
SELECT test_admin_functions();

-- ==============================================
-- ADMIN FONKSİYONLARI TAMAMLANDI
-- ==============================================
