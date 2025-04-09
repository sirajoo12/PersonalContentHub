import React, { createContext, useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import CreatePost from "@/pages/create-post";
import AuthPage from "@/pages/auth-page";
import { apiRequest } from "./lib/queryClient";
import { ProtectedRoute } from "./lib/protected-route";

interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  has_instagram: boolean;
  has_youtube: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
});

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard}/>
      <ProtectedRoute path="/settings" component={Settings}/>
      <ProtectedRoute path="/create-post" component={CreatePost}/>
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [_, navigate] = useLocation();

  const checkSession = async () => {
    try {
      // Try to get user data directly - will return 401 if not authenticated
      const userResponse = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-login the demo user if needed
  const autoLogin = async () => {
    try {
      await login('demo', 'password');
    } catch (error) {
      console.error('Auto-login failed:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await checkSession();
      if (!isAuthenticated) {
        await autoLogin();
      }
    };
    
    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // First, attempt direct API login
      await apiRequest('POST', '/api/login', { username, password });
      
      // After login, check if we're authenticated and get user data
      const userResponse = await apiRequest('GET', '/api/user', undefined);
      const userData = await userResponse.json();
      
      // Set authentication state in React
      setIsAuthenticated(true);
      setUser(userData);
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/logout', undefined);
      setIsAuthenticated(false);
      setUser(null);
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
        <Router />
        <Toaster />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
