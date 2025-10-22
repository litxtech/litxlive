import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { trpcClient } from '@/lib/trpc';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system_role: boolean;
  permissions: Permission[];
}

export interface AdminUser {
  id: string;
  user_id: string;
  role: Role;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface RBACContextType {
  currentUser: AdminUser | null;
  permissions: Permission[];
  roles: Role[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canManageUsers: () => boolean;
  canManageAgencies: () => boolean;
  canManagePayments: () => boolean;
  canManageContent: () => boolean;
  canManageSystem: () => boolean;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
};

interface RBACProviderProps {
  children: React.ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRBACData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load current user with role and permissions
      const userData = await trpcClient.admin.rbac.getCurrentUser.query();
      setCurrentUser(userData);

      // Load all permissions
      const permissionsData = await trpcClient.admin.rbac.getPermissions.query();
      setPermissions(permissionsData);

      // Load all roles
      const rolesData = await trpcClient.admin.rbac.getRoles.query();
      setRoles(rolesData);

    } catch (err) {
      console.error('[RBACProvider] Error loading RBAC data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRBACData();
  }, [loadRBACData]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!currentUser?.role?.permissions) return false;
    return currentUser.role.permissions.some(p => p.name === permission);
  }, [currentUser]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!currentUser?.role?.permissions) return false;
    return permissions.some(permission => 
      currentUser.role.permissions.some(p => p.name === permission)
    );
  }, [currentUser]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!currentUser?.role?.permissions) return false;
    return permissions.every(permission => 
      currentUser.role.permissions.some(p => p.name === permission)
    );
  }, [currentUser]);

  // Convenience methods for common permission checks
  const canManageUsers = useCallback(() => {
    return hasAnyPermission(['manage_users', 'ban_users', 'verify_users', 'add_coins']);
  }, [hasAnyPermission]);

  const canManageAgencies = useCallback(() => {
    return hasAnyPermission(['manage_agencies', 'approve_agencies', 'view_agencies']);
  }, [hasAnyPermission]);

  const canManagePayments = useCallback(() => {
    return hasAnyPermission(['manage_payments', 'view_payments', 'refund_payments', 'approve_payments']);
  }, [hasAnyPermission]);

  const canManageContent = useCallback(() => {
    return hasAnyPermission(['manage_content', 'moderate_content', 'manage_policies', 'approve_content']);
  }, [hasAnyPermission]);

  const canManageSystem = useCallback(() => {
    return hasAnyPermission(['manage_system', 'manage_roles', 'view_logs']);
  }, [hasAnyPermission]);

  const refreshPermissions = useCallback(async () => {
    await loadRBACData();
  }, [loadRBACData]);

  const value: RBACContextType = {
    currentUser,
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageUsers,
    canManageAgencies,
    canManagePayments,
    canManageContent,
    canManageSystem,
    isLoading,
    error,
    refreshPermissions,
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};
