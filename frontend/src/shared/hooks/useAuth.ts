import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'ADMIN' | 'RH' | 'MANAGER' | 'EMPLOYEE';
  admin?: boolean;
  rh?: boolean;
  manager?: boolean;
  employee?: boolean;
  organisation?: {
    id: string;
    name: string;
    orgInfo?: any;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const loadUser = () => {
      try {
        const saved = localStorage.getItem('user');
        if (saved) {
          const user = JSON.parse(saved) as User;
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    loadUser();

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshUser = () => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const user = JSON.parse(saved) as User;
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  };

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    logout,
    refreshUser,
  };
}
