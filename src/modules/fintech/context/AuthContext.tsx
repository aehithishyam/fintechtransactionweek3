/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole, Permission } from '../types';
import { ROLE_PERMISSIONS, DEMO_USERS } from '../constants';

interface AuthContextType {
  currentUser: User; 
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canTransitionStatus: (currentStatus: string, targetStatus: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User>(
    initialUser || DEMO_USERS[0]
  );

  const switchRole = useCallback((role: UserRole) => {
    const user = DEMO_USERS.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    const permissions = ROLE_PERMISSIONS[currentUser.role];
    return permissions.includes(permission);
  }, [currentUser.role]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);

  const canTransitionStatus = useCallback((
    currentStatus: string, 
    targetStatus: string
  ): boolean => {
    const role = currentUser.role;
    if (role === 'admin') return true;
    if (role === 'finance_ops' && targetStatus === 'settled') return true;
    if (role === 'risk_analyst' && (targetStatus === 'approved' || targetStatus === 'rejected')) return true;
    if (currentStatus === 'created' && targetStatus === 'under_review') return true;
    return false;
  }, [currentUser.role]);

  const value: AuthContextType = {
    currentUser,
    setCurrentUser,
    switchRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canTransitionStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

