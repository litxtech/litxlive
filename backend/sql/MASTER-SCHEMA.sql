-- LITXLIVE MASTER SCHEMA
-- Tüm veritabanı yapısı tek dosyada
-- Deployment için hazır

-- ==============================================
-- 1. TEMEL TABLOLAR
-- ==============================================

-- Profiles tablosu (ana kullanıcı tablosu)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    username TEXT UNIQUE,
    avatar TEXT,
    bio TEXT,
    phone TEXT,
    country VARCHAR(10),
    city TEXT,
    hometown TEXT,
    gender VARCHAR(20),
    orientation VARCHAR(20),
    birth_date DATE,
    interests TEXT[],
    website TEXT,
    coins INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    is_vip BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. ADMIN SİSTEMİ
-- ==============================================

-- Admin rolleri
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin kullanıcıları
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES admin_roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log (değiştirilemez)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. EŞLEŞTİRME SİSTEMİ
-- ==============================================

-- Match queue (eşleştirme kuyruğu)
CREATE TABLE IF NOT EXISTS match_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Matches (eşleştirmeler)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER DEFAULT 0
);

-- ==============================================
-- 4. MESAJLAŞMA SİSTEMİ
-- ==============================================

-- Messages (mesajlar)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. COIN EKONOMİSİ
-- ==============================================

-- Coin transactions (coin hareketleri)
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    reason_code VARCHAR(100),
    admin_id UUID REFERENCES admin_users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 6. GÜVENLİK VE RİSK
-- ==============================================

-- User bans (kullanıcı banları)
CREATE TABLE IF NOT EXISTS user_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ban_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    duration_hours INTEGER,
    admin_id UUID REFERENCES admin_users(id) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Risk scores (risk skorları)
CREATE TABLE IF NOT EXISTS user_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score DECIMAL(3,1) DEFAULT 0.0,
    factors JSONB DEFAULT '{}',
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaints (şikayetler)
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id),
    reported_user_id UUID REFERENCES auth.users(id),
    complaint_type VARCHAR(50) NOT NULL,
    description TEXT,
    evidence JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    assigned_admin_id UUID REFERENCES admin_users(id),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 7. CANLI OTURUMLAR
-- ==============================================

-- Live sessions (canlı oturumlar)
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) NOT NULL,
    room_name VARCHAR(200),
    host_id UUID REFERENCES auth.users(id),
    mode VARCHAR(50) DEFAULT 'chat',
    participants_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- ==============================================
-- 8. İNDEXLER
-- ==============================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_match_queue_user_id ON match_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_match_queue_status ON match_queue(status);
CREATE INDEX IF NOT EXISTS idx_match_queue_created_at ON match_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_is_active ON user_bans(is_active);

CREATE INDEX IF NOT EXISTS idx_user_risk_scores_user_id ON user_risk_scores(user_id);

CREATE INDEX IF NOT EXISTS idx_complaints_reported_user_id ON complaints(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

CREATE INDEX IF NOT EXISTS idx_live_sessions_is_active ON live_sessions(is_active);

-- ==============================================
-- 9. RLS POLİTİKALARI
-- ==============================================

-- RLS enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Match queue policies
CREATE POLICY "Users can manage own match queue" ON match_queue
    FOR ALL USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can view own matches" ON matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert own matches" ON matches
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Admin policies
CREATE POLICY "Admin users can access all data" ON admin_roles
    FOR ALL USING (true);

CREATE POLICY "Admin users can access all data" ON admin_users
    FOR ALL USING (true);

CREATE POLICY "Admin users can access all data" ON audit_logs
    FOR ALL USING (true);

CREATE POLICY "Admin users can access all data" ON user_risk_scores
    FOR ALL USING (true);

CREATE POLICY "Admin users can access all data" ON complaints
    FOR ALL USING (true);

CREATE POLICY "Admin users can access all data" ON live_sessions
    FOR ALL USING (true);

CREATE POLICY "Admin users can access all data" ON coin_transactions
    FOR ALL USING (true);

CREATE POLICY "Admin users can access all data" ON user_bans
    FOR ALL USING (true);

-- ==============================================
-- 10. FONKSİYONLAR
-- ==============================================

-- Update risk score function
CREATE OR REPLACE FUNCTION update_risk_score(p_user_id UUID)
RETURNS DECIMAL(3,1) AS $$
DECLARE
    v_score DECIMAL(3,1) := 0.0;
    v_complaints INTEGER;
    v_bans INTEGER;
BEGIN
    -- Şikayet sayısı (her şikayet +1 puan)
    SELECT COUNT(*) INTO v_complaints
    FROM complaints
    WHERE reported_user_id = p_user_id;
    
    v_score := v_score + v_complaints;
    
    -- Ban sayısı (her ban +2 puan)
    SELECT COUNT(*) INTO v_bans
    FROM user_bans
    WHERE user_id = p_user_id AND is_active = true;
    
    v_score := v_score + (v_bans * 2);
    
    -- Risk skorunu güncelle
    INSERT INTO user_risk_scores (user_id, score, factors, last_calculated)
    VALUES (p_user_id, v_score, jsonb_build_object(
        'complaints', v_complaints,
        'bans', v_bans
    ), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        score = v_score,
        factors = jsonb_build_object(
            'complaints', v_complaints,
            'bans', v_bans
        ),
        last_calculated = NOW();
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Dashboard stats function
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'active_users', (SELECT COUNT(*) FROM profiles WHERE last_seen > NOW() - INTERVAL '1 hour'),
        'live_calls', (SELECT COUNT(*) FROM live_sessions WHERE is_active = true),
        'complaints', (SELECT COUNT(*) FROM complaints WHERE status = 'pending'),
        'revenue', (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions WHERE transaction_type = 'PURCHASE' AND created_at > NOW() - INTERVAL '24 hours'),
        'risk_alerts', (SELECT COUNT(*) FROM user_risk_scores WHERE score > 5)
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Advanced user search function
CREATE OR REPLACE FUNCTION search_users_advanced(
    p_query TEXT DEFAULT '',
    p_status VARCHAR(20) DEFAULT 'all',
    p_verification VARCHAR(20) DEFAULT 'all',
    p_country VARCHAR(10) DEFAULT 'all',
    p_risk_level VARCHAR(20) DEFAULT 'all',
    p_sort_by VARCHAR(50) DEFAULT 'last_seen',
    p_sort_order VARCHAR(10) DEFAULT 'desc',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    display_name TEXT,
    username TEXT,
    country VARCHAR(10),
    is_verified BOOLEAN,
    is_vip BOOLEAN,
    coins INTEGER,
    level INTEGER,
    last_seen TIMESTAMP WITH TIME ZONE,
    risk_score DECIMAL(3,1),
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email,
        p.display_name,
        p.username,
        p.country,
        p.is_verified,
        p.is_vip,
        p.coins,
        p.level,
        p.last_seen,
        COALESCE(urs.score, 0.0) as risk_score,
        CASE 
            WHEN ub.is_active = true THEN 'banned'
            WHEN p.is_active = false THEN 'suspended'
            ELSE 'active'
        END as status,
        p.created_at
    FROM profiles p
    LEFT JOIN user_risk_scores urs ON p.id = urs.user_id
    LEFT JOIN user_bans ub ON p.id = ub.user_id AND ub.is_active = true
    WHERE 
        (p_query = '' OR 
         p.email ILIKE '%' || p_query || '%' OR
         p.display_name ILIKE '%' || p_query || '%' OR
         p.username ILIKE '%' || p_query || '%' OR
         p.id::TEXT ILIKE '%' || p_query || '%')
    AND (p_status = 'all' OR 
         (p_status = 'active' AND (ub.is_active IS NULL OR ub.is_active = false) AND p.is_active = true) OR
         (p_status = 'banned' AND ub.is_active = true) OR
         (p_status = 'suspended' AND p.is_active = false))
    AND (p_verification = 'all' OR 
         (p_verification = 'verified' AND p.is_verified = true) OR
         (p_verification = 'unverified' AND p.is_verified = false))
    AND (p_country = 'all' OR p.country = p_country)
    AND (p_risk_level = 'all' OR 
         (p_risk_level = 'low' AND COALESCE(urs.score, 0) < 3) OR
         (p_risk_level = 'medium' AND COALESCE(urs.score, 0) >= 3 AND COALESCE(urs.score, 0) < 6) OR
         (p_risk_level = 'high' AND COALESCE(urs.score, 0) >= 6))
    ORDER BY 
        CASE WHEN p_sort_by = 'last_seen' AND p_sort_order = 'desc' THEN p.last_seen END DESC,
        CASE WHEN p_sort_by = 'last_seen' AND p_sort_order = 'asc' THEN p.last_seen END ASC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN p.created_at END DESC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at END ASC,
        CASE WHEN p_sort_by = 'coins' AND p_sort_order = 'desc' THEN p.coins END DESC,
        CASE WHEN p_sort_by = 'coins' AND p_sort_order = 'asc' THEN p.coins END ASC,
        CASE WHEN p_sort_by = 'risk_score' AND p_sort_order = 'desc' THEN urs.score END DESC,
        CASE WHEN p_sort_by = 'risk_score' AND p_sort_order = 'asc' THEN urs.score END ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Ban user function
CREATE OR REPLACE FUNCTION ban_user(
    p_user_id UUID,
    p_ban_type VARCHAR(50),
    p_reason TEXT,
    p_duration_hours INTEGER,
    p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_ban_id UUID;
BEGIN
    -- Eski banları deaktive et
    UPDATE user_bans 
    SET is_active = false 
    WHERE user_id = p_user_id AND is_active = true;
    
    -- Yeni ban oluştur
    INSERT INTO user_bans (
        user_id, ban_type, reason, duration_hours, admin_id, expires_at
    ) VALUES (
        p_user_id, p_ban_type, p_reason, p_duration_hours, p_admin_id,
        CASE 
            WHEN p_duration_hours IS NULL THEN NULL
            ELSE NOW() + (p_duration_hours || ' hours')::INTERVAL
        END
    ) RETURNING id INTO v_ban_id;
    
    RETURN v_ban_id;
END;
$$ LANGUAGE plpgsql;

-- Adjust user coins function
CREATE OR REPLACE FUNCTION adjust_user_coins(
    p_user_id UUID,
    p_amount DECIMAL(10,2),
    p_reason_code VARCHAR(100),
    p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_new_balance DECIMAL(10,2);
BEGIN
    -- Mevcut bakiyeyi al
    SELECT COALESCE(coins, 0) INTO v_new_balance
    FROM profiles
    WHERE id = p_user_id;
    
    -- Yeni bakiye hesapla
    v_new_balance := v_new_balance + p_amount;
    
    -- Profili güncelle
    UPDATE profiles 
    SET coins = v_new_balance
    WHERE id = p_user_id;
    
    -- Transaction kaydı oluştur
    INSERT INTO coin_transactions (
        user_id, transaction_type, amount, balance_after, reason_code, admin_id
    ) VALUES (
        p_user_id, 'ADMIN_ADJUSTMENT', p_amount, v_new_balance, p_reason_code, p_admin_id
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 11. BAŞLANGIÇ VERİLERİ
-- ==============================================

-- Admin rolleri ekle
INSERT INTO admin_roles (name, description, permissions) VALUES
('Owner', 'Full system access', '{"all": true}'),
('Admin', 'Administrative access', '{"users": true, "moderation": true, "reports": true, "settings": true}'),
('Trust & Safety', 'Moderation and safety', '{"moderation": true, "reports": true}'),
('Finance', 'Financial operations', '{"coins": true, "transactions": true}'),
('Legal', 'Legal and compliance', '{"policies": true, "consent": true}'),
('Support', 'Customer support', '{"users": true, "tickets": true}'),
('Auditor', 'Read-only access', '{"read": true}')
ON CONFLICT (name) DO NOTHING;

-- Admin kullanıcısı oluştur (support@litxtech.com için)
INSERT INTO admin_users (user_id, role_id) 
SELECT 'cba653e7-6ef9-4152-8a52-19c095cc8f1d', id FROM admin_roles WHERE name = 'Admin'
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================
-- 12. TRİGGER'LAR
-- ==============================================

-- Profiles updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 13. TEMİZLEME
-- ==============================================

-- Eski match queue kayıtlarını temizle (5 dakikadan eski)
CREATE OR REPLACE FUNCTION cleanup_old_match_queue()
RETURNS void AS $$
BEGIN
    DELETE FROM match_queue 
    WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Eski mesajları temizle (30 günden eski)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM messages 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 14. VERİTABANI SAĞLIK KONTROLÜ
-- ==============================================

-- Veritabanı sağlık kontrolü
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS JSONB AS $$
DECLARE
    v_health JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profiles_count', (SELECT COUNT(*) FROM profiles),
        'active_users', (SELECT COUNT(*) FROM profiles WHERE last_seen > NOW() - INTERVAL '1 hour'),
        'match_queue_count', (SELECT COUNT(*) FROM match_queue),
        'active_matches', (SELECT COUNT(*) FROM matches WHERE status = 'active'),
        'total_messages', (SELECT COUNT(*) FROM messages),
        'admin_users', (SELECT COUNT(*) FROM admin_users),
        'pending_complaints', (SELECT COUNT(*) FROM complaints WHERE status = 'pending'),
        'database_size', pg_size_pretty(pg_database_size(current_database())),
        'last_check', NOW()
    ) INTO v_health;
    
    RETURN v_health;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 15. GÜVENLİK KONTROLLERİ
-- ==============================================

-- Şüpheli aktivite tespiti
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE (
    user_id UUID,
    activity_type TEXT,
    severity TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Çok fazla eşleştirme isteği
    SELECT 
        mq.user_id,
        'EXCESSIVE_MATCH_REQUESTS'::TEXT,
        'HIGH'::TEXT,
        'User has made too many match requests in short time'::TEXT
    FROM match_queue mq
    WHERE mq.created_at > NOW() - INTERVAL '1 hour'
    GROUP BY mq.user_id
    HAVING COUNT(*) > 10;
    
    -- Çok fazla mesaj gönderen kullanıcılar
    RETURN QUERY
    SELECT 
        m.sender_id,
        'EXCESSIVE_MESSAGES'::TEXT,
        'MEDIUM'::TEXT,
        'User is sending too many messages'::TEXT
    FROM messages m
    WHERE m.created_at > NOW() - INTERVAL '1 hour'
    GROUP BY m.sender_id
    HAVING COUNT(*) > 50;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 16. PERFORMANS İYİLEŞTİRMELERİ
-- ==============================================

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_active_users 
ON profiles(last_seen) 
WHERE last_seen > NOW() - INTERVAL '24 hours';

CREATE INDEX IF NOT EXISTS idx_messages_recent 
ON messages(created_at) 
WHERE created_at > NOW() - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_match_queue_active 
ON match_queue(created_at) 
WHERE status = 'waiting';

-- ==============================================
-- 17. BACKUP VE KURTARMA
-- ==============================================

-- Kritik verilerin yedeklenmesi için view
CREATE OR REPLACE VIEW critical_data_backup AS
SELECT 
    'profiles' as table_name,
    id,
    email,
    display_name,
    created_at
FROM profiles
UNION ALL
SELECT 
    'admin_users' as table_name,
    id,
    user_id::TEXT as email,
    'admin' as display_name,
    created_at
FROM admin_users;

-- ==============================================
-- 18. MONİTORİNG VE LOGGİNG
-- ==============================================

-- Sistem durumu loglama
CREATE OR REPLACE FUNCTION log_system_status()
RETURNS void AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT check_database_health() INTO v_stats;
    
    INSERT INTO audit_logs (action, target_type, new_values)
    VALUES ('SYSTEM_HEALTH_CHECK', 'system', v_stats);
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 19. FİNAL KONTROLLER
-- ==============================================

-- Tüm tabloların varlığını kontrol et
DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'profiles', 'admin_roles', 'admin_users', 'audit_logs',
        'match_queue', 'matches', 'messages', 'coin_transactions',
        'user_bans', 'user_risk_scores', 'complaints', 'live_sessions'
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
    
    RAISE NOTICE 'All required tables exist. Database schema is ready.';
END $$;

-- ==============================================
-- 20. DEPLOYMENT HAZIRLIK
-- ==============================================

-- Deployment için gerekli kontroller
CREATE OR REPLACE FUNCTION deployment_ready_check()
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'schema_version', '1.0.0',
        'deployment_date', NOW(),
        'tables_created', (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ),
        'functions_created', (
            SELECT COUNT(*) 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_type = 'FUNCTION'
        ),
        'indexes_created', (
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE schemaname = 'public'
        ),
        'policies_created', (
            SELECT COUNT(*) 
            FROM pg_policies 
            WHERE schemaname = 'public'
        ),
        'ready_for_production', true
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Final deployment check
SELECT deployment_ready_check();

-- ==============================================
-- MASTER SCHEMA TAMAMLANDI
-- ==============================================
