import { getDatabase } from './database';

export interface TokenPayload {
  id: string;
  username: string;
  name: string;
  role: 'user' | 'admin';
}

// Simple password hashing (for demo - use bcrypt in production)
export const hashPassword = (password: string): string => {
  return btoa(password + 'timetracker_salt_2024');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export const generateToken = (payload: TokenPayload): string => {
  // Simple token (for demo - use JWT in production)
  const tokenData = {
    ...payload,
    timestamp: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return btoa(JSON.stringify(tokenData));
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = JSON.parse(atob(token));
    
    // Check if token is expired
    if (decoded.expires && decoded.expires < Date.now()) {
      console.log('🔐 Token expired');
      return null;
    }
    
    return {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      role: decoded.role
    };
  } catch (error) {
    console.error('🔐 Token verification failed:', error);
    return null;
  }
};

export const authenticateUser = async (username: string, password: string): Promise<{ token: string; user: TokenPayload } | null> => {
  try {
    console.log(`🔐 Attempting to authenticate user: ${username}`);
    
    const db = getDatabase();
    const user = await db.authenticateUser(username, password);
    
    if (!user) {
      console.log('🔐 Authentication failed: Invalid credentials');
      return null;
    }
    
    const tokenPayload: TokenPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };
    
    const token = generateToken(tokenPayload);
    
    console.log('✅ Authentication successful');
    return { token, user: tokenPayload };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return null;
  }
};