-- ADMIN USERS TABLOSU INFINITE RECURSION DÜZELTMESİ
-- RLS politikalarını düzelt

-- ==============================================
-- 1. MEVCUT POLİTİKALARI SİL
-- ==============================================

-- Admin users politikalarını sil
DROP POLICY IF EXISTS "Admin users can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin users" ON admin_users;

-- ==============================================
-- 2. YENİ POLİTİKALARI OLUŞTUR (RECURSION OLMADAN)
-- ==============================================

-- Admin users için basit politikalar
CREATE POLICY "Users can view admin users" ON admin_users
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage admin users" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 3. ADMIN USERS TABLOSU KONTROL ET
-- ==============================================

-- Eğer admin_users tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 4. INDEXLER
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- ==============================================
-- 5. RLS ENABLE
-- ==============================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 6. TEST VERİSİ EKLE
-- ==============================================

-- Admin kullanıcısı ekle (eğer yoksa)
INSERT INTO admin_users (user_id, is_active)
SELECT id, true
FROM auth.users
WHERE email = 'support@litxtech.com'
ON CONFLICT (user_id) DO UPDATE SET is_active = true;

-- ==============================================
-- ADMIN USERS RECURSION DÜZELTMESİ TAMAMLANDI
-- ==============================================
