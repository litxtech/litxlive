import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserProvider';
import { supabase } from '@/lib/supabase';

interface AdminRole {
  name: string;
}

interface AdminData {
  id: string;
  email?: string;
  is_active: boolean;
  admin_roles: AdminRole[];
  display_name?: string;
  is_super_admin?: boolean;
  permissions?: Record<string, boolean>;
}

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  adminData: AdminData | null;
  isAuthenticated: boolean;
  me?: AdminData | null;
  checkAdminStatus: () => Promise<void>;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAdminStatus = async () => {
    console.log('[AdminProvider] checkAdminStatus called, user:', user?.email);
    
    if (!user) {
      console.log('[AdminProvider] No user, setting isAdmin to false');
      setIsAdmin(false);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log('[AdminProvider] Already checking, skipping');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[AdminProvider] Starting admin check for user:', user.email);
      
      // First check if admin_users table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('admin_users')
        .select('id')
        .limit(1);

      if (tableError) {
        console.log('[AdminProvider] Admin table not found, using fallback admin check');
        
        // Fallback: Check if user email is admin email
        if (user.email === 'support@litxtech.com' || user.id === 'cba653e7-6ef9-4152-8a52-19c095cc8f1d') {
          console.log('[AdminProvider] User is admin via fallback check');
          setIsAdmin(true);
          setIsAuthenticated(true);
          setAdminData({ id: user.id, email: user.email, is_active: true, admin_roles: [{ name: 'admin' }] });
          console.log('[AdminProvider] Admin status set to true, isAuthenticated: true');
          setIsLoading(false);
          return;
        }
        
        console.log('[AdminProvider] User is not admin via fallback check');
        setIsAdmin(false);
        return;
      }

      // Check if user has admin role in admin_users table
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('id, is_active, admin_roles(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        // Fallback: Check if user email is admin email
        if (user.email === 'support@litxtech.com' || user.id === 'cba653e7-6ef9-4152-8a52-19c095cc8f1d') {
          console.log('[AdminProvider] User is admin via fallback check (error case)');
          setIsAdmin(true);
          setIsAuthenticated(true);
          setAdminData({ id: user.id, email: user.email, is_active: true, admin_roles: [{ name: 'admin' }] });
          setIsLoading(false);
          return;
        }
        
        console.log('[AdminProvider] User is not admin');
        setIsAdmin(false);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      if (adminUser && adminUser.is_active) {
        console.log('[AdminProvider] User is admin via database check');
        setIsAdmin(true);
        setIsAuthenticated(true);
        const mappedAdminData: AdminData = {
          id: adminUser.id,
          is_active: adminUser.is_active,
          admin_roles: adminUser.admin_roles || [],
        };
        setAdminData(mappedAdminData);
      } else {
        console.log('[AdminProvider] User is not admin via database check');
        setIsAdmin(false);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[AdminProvider] Admin check error:', error);
      setIsAdmin(false);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async () => {
    await checkAdminStatus();
  };

  const logout = async () => {
    setIsAdmin(false);
    setIsAuthenticated(false);
    setAdminData(null);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const value = {
    isAdmin,
    isLoading,
    adminData,
    isAuthenticated,
    me: adminData,
    checkAdminStatus,
    checkSession,
    logout,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}