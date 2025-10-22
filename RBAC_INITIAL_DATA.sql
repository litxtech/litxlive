-- RBAC Initial Data Setup
-- =======================

-- 1. Insert Default Roles
INSERT INTO admin_roles (name, description, is_system_role) VALUES
('super_admin', 'Full system access', true),
('admin', 'Standard admin access', true),
('moderator', 'Content and user moderation', true),
('support', 'Customer support access', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Permissions
INSERT INTO admin_permissions (name, description, category) VALUES
-- User Management
('manage_users', 'Manage user accounts', 'users'),
('view_users', 'View user information', 'users'),
('ban_users', 'Ban/unban users', 'users'),
('verify_users', 'Verify user accounts', 'users'),
('add_coins', 'Add coins to users', 'users'),

-- Agency Management
('manage_agencies', 'Manage agency applications', 'agencies'),
('approve_agencies', 'Approve/reject agencies', 'agencies'),
('view_agencies', 'View agency information', 'agencies'),

-- Payment Management
('manage_payments', 'Manage payment operations', 'payments'),
('view_payments', 'View payment information', 'payments'),
('refund_payments', 'Process refunds', 'payments'),
('approve_payments', 'Approve payment operations', 'payments'),

-- Content Management
('manage_content', 'Manage app content', 'content'),
('moderate_content', 'Moderate user content', 'content'),
('manage_policies', 'Manage policies and terms', 'content'),
('approve_content', 'Approve content changes', 'content'),

-- System Management
('view_analytics', 'View system analytics', 'system'),
('manage_system', 'Manage system settings', 'system'),
('view_logs', 'View audit logs', 'system'),
('manage_roles', 'Manage roles and permissions', 'system')
ON CONFLICT (name) DO NOTHING;

-- 3. Assign Permissions to Roles
-- Super Admin gets all permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin gets most permissions except system management
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'admin' 
AND p.name NOT IN ('manage_roles', 'manage_system')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Moderator gets user and content permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'moderator' 
AND p.name IN (
  'view_users', 'ban_users', 'verify_users',
  'view_agencies', 'manage_content', 'moderate_content',
  'view_analytics', 'view_logs'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Support gets limited permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'support' 
AND p.name IN (
  'view_users', 'view_agencies', 'view_payments',
  'view_analytics'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert Default Ban Types
INSERT INTO ban_types (name, description, duration_hours, severity_level) VALUES
('spam', 'Spam behavior', 24, 1),
('harassment', 'Harassment or bullying', 168, 2), -- 7 days
('inappropriate_content', 'Inappropriate content', 72, 2), -- 3 days
('fraud', 'Fraudulent activity', 720, 4), -- 30 days
('severe_violation', 'Severe terms violation', NULL, 5), -- Permanent
('temporary_suspension', 'Temporary account suspension', 24, 1)
ON CONFLICT (name) DO NOTHING;

-- 5. Create Admin User for Current User
-- First, get the current admin user ID
DO $$
DECLARE
  admin_role_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the super_admin role ID
  SELECT id INTO admin_role_id FROM admin_roles WHERE name = 'super_admin';
  
  -- Get current user ID (assuming it's the one with support@litxtech.com)
  SELECT id INTO current_user_id FROM auth.users WHERE email = 'support@litxtech.com';
  
  -- Insert admin user if not exists
  IF current_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    INSERT INTO admin_users (user_id, role_id, is_active, created_at)
    VALUES (current_user_id, admin_role_id, true, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      role_id = admin_role_id,
      is_active = true,
      updated_at = NOW();
  END IF;
END $$;
