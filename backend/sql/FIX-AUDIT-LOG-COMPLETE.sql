-- AUDIT LOG TABLOSU TAM DÜZELTMESİ
-- Tüm eksik kolonları ekle

-- ==============================================
-- 1. AUDIT LOG TABLOSU TAM DÜZELTMESİ
-- ==============================================

-- Önce mevcut audit_log tablosunu kontrol et ve düzelt
DO $$
BEGIN
    -- Eğer audit_log tablosu yoksa oluştur
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        CREATE TABLE audit_log (
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
    ELSE
        -- Eğer tablo varsa eksik kolonları ekle
        ALTER TABLE audit_log 
        ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS entity_id UUID,
        ADD COLUMN IF NOT EXISTS old_values JSONB,
        ADD COLUMN IF NOT EXISTS new_values JSONB,
        ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS ip_address INET,
        ADD COLUMN IF NOT EXISTS user_agent TEXT;
    END IF;
END $$;

-- ==============================================
-- 2. INDEXLER
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user_id ON audit_log(admin_user_id);

-- ==============================================
-- 3. RLS POLİTİKALARI
-- ==============================================

-- RLS enable
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Eski politikaları sil
DROP POLICY IF EXISTS "Admin users can view audit logs" ON audit_log;
DROP POLICY IF EXISTS "Admin users can insert audit logs" ON audit_log;

-- Yeni politikaları oluştur
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

-- ==============================================
-- 4. TEST
-- ==============================================

-- Test için basit bir audit log ekle
INSERT INTO audit_log (action, entity_type, new_values)
VALUES ('TEST_AUDIT_LOG', 'test', '{"test": true}')
ON CONFLICT DO NOTHING;

-- ==============================================
-- AUDIT LOG TAM DÜZELTMESİ TAMAMLANDI
-- ==============================================
