-- EKSİK TABLOLAR VE KOLONLAR
-- Admin paneli için gerekli eksik yapıları ekle

-- ==============================================
-- 1. PROFILES TABLOSUNA EKSİK KOLONLAR
-- ==============================================

-- Profiles tablosuna eksik kolonları ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS owner_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS blue_check BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS online_status BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS discoverable BOOLEAN DEFAULT true;

-- ==============================================
-- 2. AUDIT LOG TABLOSU
-- ==============================================

-- Audit log tablosu (eğer yoksa)
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

-- Audit log indexleri
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user_id ON audit_log(admin_user_id);

-- ==============================================
-- 3. USER BANS TABLOSU
-- ==============================================

-- User bans tablosu (eğer yoksa)
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

-- User bans indexleri
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_is_active ON user_bans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_bans_ban_type ON user_bans(ban_type);

-- ==============================================
-- 4. COIN TRANSACTIONS TABLOSU
-- ==============================================

-- Coin transactions tablosu (eğer yoksa)
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

-- Coin transactions indexleri
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(transaction_type);

-- ==============================================
-- 5. ADMIN USERS TABLOSU
-- ==============================================

-- Admin users tablosu (eğer yoksa)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users indexleri
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- ==============================================
-- 6. RLS POLİTİKALARI
-- ==============================================

-- RLS enable
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

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
-- 7. BAŞLANGIÇ VERİLERİ
-- ==============================================

-- Admin kullanıcısı ekle (support@litxtech.com için)
INSERT INTO admin_users (user_id, is_active)
SELECT id, true
FROM auth.users
WHERE email = 'support@litxtech.com'
ON CONFLICT (user_id) DO UPDATE SET is_active = true;

-- ==============================================
-- 8. TRİGGER'LAR
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
-- 9. VERİTABANI SAĞLIK KONTROLÜ
-- ==============================================

-- Eksik tabloları kontrol et
DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'profiles', 'audit_log', 'user_bans', 'coin_transactions', 'admin_users'
    ];
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            RAISE EXCEPTION 'Required table % does not exist', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All required tables exist. Database structure is ready.';
END $$;

-- ==============================================
-- EKSİK TABLOLAR TAMAMLANDI
-- ==============================================
