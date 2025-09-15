import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, AuthUser } from '../types';
import { authenticateUser, verifyToken } from '../utils/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔐 Initializing authentication...');
      
      // Check for existing token on app load
      const token = localStorage.getItem('timetracker_auth_token');
      if (token) {
        console.log('🔐 Found existing token, verifying...');
        const decoded = verifyToken(token);
        if (decoded) {
          console.log('✅ Token valid, user logged in:', decoded.username);
          setUser({
            id: decoded.id,
            username: decoded.username,
            name: decoded.name,
            role: decoded.role
          });
        } else {
          console.log('❌ Token invalid, removing...');
          localStorage.removeItem('timetracker_auth_token');
        }
      } else {
        console.log('🔐 No existing token found');
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      localStorage.removeItem('timetracker_auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log(`🔐 Login attempt for user: ${username}`);
      
      if (!username.trim() || !password.trim()) {
        console.log('❌ Login failed: Empty credentials');
        return false;
      }

      const result = await authenticateUser(username.trim(), password);
      
      if (result) {
        console.log('✅ Login successful, storing token...');
        localStorage.setItem('timetracker_auth_token', result.token);
        setUser({
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          role: result.user.role
        });
        return true;
      } else {
        console.log('❌ Login failed: Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🔐 Logging out user...');
    localStorage.removeItem('timetracker_auth_token');
    setUser(null);
    console.log('✅ User logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};