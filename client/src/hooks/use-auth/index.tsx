import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define user type
export interface User {
  id: number;
  username: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  instagram_auth_token: string | null;
  youtube_auth_token: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
}

function useLoginMutation() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/login', credentials);
      if (!response.ok) throw new Error('Login failed');
      
      // Get user data after successful login
      const userResponse = await apiRequest('GET', '/api/user', undefined);
      if (!userResponse.ok) throw new Error('Failed to fetch user data');
      
      return await userResponse.json();
    },
    onSuccess: (userData) => {
      // Update cached user data
      queryClient.setQueryData(['user'], userData);
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      
      // Navigate to dashboard
      navigate('/');
    },
    onError: (error: Error) => {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid username or password',
        variant: 'destructive',
      });
    },
  });
}

function useLogoutMutation() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/logout', undefined);
      if (!response.ok) throw new Error('Logout failed');
      return true;
    },
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(['user'], null);
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
      
      // Navigate to login page
      navigate('/auth');
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout Failed',
        description: error.message || 'Failed to log out',
        variant: 'destructive',
      });
    },
  });
}

function useRegisterMutation() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userData: {
      username: string;
      password: string;
      email: string | null;
      display_name: string | null;
      avatar_url: string | null;
      instagram_auth_token: string | null;
      youtube_auth_token: string | null;
    }) => {
      const response = await apiRequest('POST', '/api/register', userData);
      if (!response.ok) throw new Error('Registration failed');
      
      return await response.json();
    },
    onSuccess: (userData) => {
      // Update cached user data
      queryClient.setQueryData(['user'], userData);
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
      
      // Navigate to dashboard
      navigate('/');
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    },
  });
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/user', undefined);
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('Failed to fetch user data');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const registerMutation = useRegisterMutation();

  const isAuthenticated = !!user;

  // Provide the auth context
  const value = {
    user,
    isLoading,
    isAuthenticated,
    error,
    loginMutation,
    logoutMutation,
    registerMutation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for accessing the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}