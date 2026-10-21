import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RoleRoute Component
 * Restricts access to users with specific roles (e.g., ['admin'], ['author', 'admin'])
 */
const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#1A382B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-[#EDE8DF] rounded-3xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold border border-amber-200">
          !
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">Access Restricted</h2>
        <p className="text-xs text-stone-600">
          Your current role (<strong className="capitalize">{user?.role}</strong>) does not have permission to view this section.
        </p>
        <a
          href="/"
          className="inline-block px-4 py-2 bg-[#1A382B] text-white text-xs font-semibold rounded-xl hover:bg-[#12281E] transition"
        >
          Return to Home
        </a>
      </div>
    );
  }

  return children;
};

export default RoleRoute;
