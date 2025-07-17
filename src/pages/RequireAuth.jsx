import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Custom hook for auth context

// Define the numeric role codes for clarity in the frontend.
// IMPORTANT: These should match the codes used in your backend schema.
const ROLES = {
  'User': 100,
  'Editor': 200,
  'Admin': 999
};

// RequireAuth component protects routes based on user authentication and roles.
// It takes an array of `allowedRoles` (numeric codes) as a prop.
const RequireAuth = ({ allowedRoles }) => {
  const { auth } = useAuth(); // Get authentication state from context
  const location = useLocation(); // Get current location for redirection after login

  // Check if the user has at least one of the allowed roles.
  // `auth?.user?.roles` is an array of numeric role codes from the JWT payload.
  // `some()` checks if any of the user's roles are included in the `allowedRoles` prop.
  const hasRequiredRole = auth?.user?.roles?.some(role => allowedRoles?.includes(role));

  return (
    // Check if the user has the required role(s) AND an access token.
    // If both are true, render the child routes using <Outlet />.
    hasRequiredRole && auth?.accessToken
      ? <Outlet />
      // If user is authenticated but doesn't have the required role, redirect to unauthorized page.
      : auth?.user // Check if user object exists (meaning they are logged in, but wrong role)
        ? <Navigate to="/unauthorized" state={{ from: location }} replace />
        // If user is not authenticated at all, redirect to the login page.
        : <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default RequireAuth;
