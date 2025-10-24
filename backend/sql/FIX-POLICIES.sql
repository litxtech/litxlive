-- POLİTİKALARI DÜZELT
-- Mevcut politikaları sil ve yeniden oluştur

-- ==============================================
-- 1. MEVCUT POLİTİKALARI SİL
-- ==============================================

-- Profiles politikalarını sil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can access all profiles" ON profiles;

-- User bans politikalarını sil
DROP POLICY IF EXISTS "Admin users can manage user bans" ON user_bans;

-- Coin transactions politikalarını sil
DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Admin users can manage all coin transactions" ON coin_transactions;

-- Admin users politikalarını sil
DROP POLICY IF EXISTS "Admin users can view admin users" ON admin_users;

-- ==============================================
-- 2. YENİ POLİTİKALARI OLUŞTUR
-- ==============================================

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
-- POLİTİKALAR DÜZELTİLDİ
-- ==============================================
