'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'

interface User {
  username: string;
  displayName: string;
  email?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  isLoading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  register: async () => ({ success: false }),
  logout: () => {},
  isLoading: true
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('restaurantAnalyticsUser')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Get stored users
    const usersJson = localStorage.getItem('restaurantAnalyticsUsers') || '{}';
    const users = JSON.parse(usersJson);
    
    // Check if user exists and password matches
    if (!users[username] || users[username].password !== password) {
      return false;
    }

    const userData = {
      username,
      displayName: users[username].displayName || username,
      email: users[username].email,
      createdAt: users[username].createdAt
    };

    setUser(userData)
    localStorage.setItem('restaurantAnalyticsUser', JSON.stringify(userData))
    return true
  }
  
  const register = async (username: string, email: string, password: string): Promise<{success: boolean, error?: string}> => {
    // Validate inputs
    if (!username.trim() || !email.trim() || !password.trim()) {
      return { success: false, error: 'All fields are required' };
    }
    
    if (username.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    
    // Get stored users
    const usersJson = localStorage.getItem('restaurantAnalyticsUsers') || '{}';
    const users = JSON.parse(usersJson);
    
    // Check if username already exists
    if (users[username]) {
      return { success: false, error: 'Username already exists' };
    }
    
    // Create new user
    const newUser = {
      username,
      displayName: username,
      email,
      password, // In a real app, this would be hashed
      createdAt: new Date().toISOString()
    };
    
    // Save user
    users[username] = newUser;
    localStorage.setItem('restaurantAnalyticsUsers', JSON.stringify(users));
    
    // Auto login
    const userData = {
      username,
      displayName: username,
      email,
      createdAt: newUser.createdAt
    };
    
    setUser(userData);
    localStorage.setItem('restaurantAnalyticsUser', JSON.stringify(userData));
    
    return { success: true };
  };

  const logout = () => {
    setUser(null)
    localStorage.removeItem('restaurantAnalyticsUser')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
} 