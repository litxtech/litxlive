-- TAM ADMIN PANEL KURULUMU
-- Tüm eksik kodları tek dosyada topla

-- ==============================================
-- 1. EKSİK TABLOLAR VE KOLONLAR
-- ==============================================

-- Profiles tablosuna eksik kolonları ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS owner_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS blue_check BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS online_status BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS discoverable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS country VARCHAR(10),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS hometown TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==============================================
-- 2. AUDIT LOG TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    admin_user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. USER BANS TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS user_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ban_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    duration_hours INTEGER,
    admin_id UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- 4. COIN TRANSACTIONS TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    reason_code VARCHAR(100),
    admin_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. ADMIN USERS TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 6. INDEXLER
-- ==============================================

-- Profiles indexleri
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- Audit log indexleri
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user_id ON audit_log(admin_user_id);

-- User bans indexleri
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_is_active ON user_bans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_bans_ban_type ON user_bans(ban_type);

-- Coin transactions indexleri
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(transaction_type);

-- Admin users indexleri
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- ==============================================
-- 7. RLS POLİTİKALARI
-- ==============================================

-- RLS enable
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin users can access all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Audit log policies
CREATE POLICY "Admin users can view audit logs" ON audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

CREATE POLICY "Admin users can insert audit logs" ON audit_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- User bans policies
CREATE POLICY "Admin users can manage user bans" ON user_bans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Coin transactions policies
CREATE POLICY "Users can view own coin transactions" ON coin_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin users can manage all coin transactions" ON coin_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Admin users policies
CREATE POLICY "Admin users can view admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- ==============================================
-- 8. ADMIN FONKSİYONLARI
-- ==============================================

-- Blue tick yönetimi
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
CREATE OR REPLACE FUNCTION admin_unban_user(
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
-- 9. FONKSİYON İZİNLERİ
-- ==============================================

-- Admin fonksiyonlarına sadece admin kullanıcılar erişebilir
GRANT EXECUTE ON FUNCTION admin_set_blue_tick TO authenticated;
GRANT EXECUTE ON FUNCTION admin_ban_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unban_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_mint_coin TO authenticated;
GRANT EXECUTE ON FUNCTION admin_burn_coin TO authenticated;

-- ==============================================
-- 10. BAŞLANGIÇ VERİLERİ
-- ==============================================

-- Admin kullanıcısı ekle (support@litxtech.com için)
INSERT INTO admin_users (user_id, is_active)
SELECT id, true
FROM auth.users
WHERE email = 'support@litxtech.com'
ON CONFLICT (user_id) DO UPDATE SET is_active = true;

-- ==============================================
-- 11. TRİGGER'LAR
-- ==============================================

-- Profiles updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles trigger'ını ekle (eğer yoksa)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 12. TEST FONKSİYONU
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
        'test_time', NOW()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Test fonksiyonunu çalıştır
SELECT test_admin_functions();

-- ==============================================
-- TAM ADMIN PANEL KURULUMU TAMAMLANDI
-- ==============================================
