import React from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path, component: Component }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Route
      path={path}
      component={() => {
        // Show loading indicator while checking auth
        if (isLoading) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          );
        }
        
        // Redirect if not authenticated
        if (!isAuthenticated || !user) {
          return (
            <div className="min-h-screen flex items-center justify-center flex-col p-4">
              <h1 className="text-2xl font-bold mb-2">Please log in</h1>
              <p className="text-muted-foreground mb-4">You need to be logged in to view this page.</p>
              <Redirect to="/auth" />
            </div>
          );
        }
        
        // Render the protected component
        return <Component />;
      }}
    />
  );
};