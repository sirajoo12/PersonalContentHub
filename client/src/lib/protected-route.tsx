import React, { useContext } from 'react';
import { Route, Redirect } from 'wouter';
import { AuthContext } from '../App';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path, component: Component }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  return (
    <Route
      path={path}
      component={() => {
        if (!isAuthenticated || !user) {
          return (
            <div className="min-h-screen flex items-center justify-center flex-col p-4">
              <h1 className="text-2xl font-bold mb-2">Please log in</h1>
              <p className="text-muted-foreground mb-4">You need to be logged in to view this page.</p>
              <Redirect to="/auth" />
            </div>
          );
        }
        
        return <Component />;
      }}
    />
  );
};