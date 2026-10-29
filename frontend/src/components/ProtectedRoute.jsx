import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole, allowedRoles }) {
  const { isAuthenticated, loading, user, isAdmin, isChairman, isPrincipal, isTeacher } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check explicit allowedRoles array if provided
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Role checks for specific required roles
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'chairman' && !isChairman) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'principal' && (!isPrincipal && !isAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Chairman is strictly blocked from teacher/generator routes
  if (requiredRole === 'teacher' && isChairman) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
