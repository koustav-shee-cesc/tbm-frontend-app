import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // Used to render child routes
import useAuth from '../hooks/useAuth'; // Custom hook for auth context
import useAxiosPrivate from '../api/axiosPrivate'; // Custom hook for private axios instance

// PersistLogin component attempts to refresh the access token on app load
// if a refresh token (HttpOnly cookie) exists.
// This enables "persistent login" without requiring the user to re-authenticate.
const PersistLogin = () => {
  const [isLoading, setIsLoading] = useState(true); // State to track loading status
  const { auth, setAuth } = useAuth(); // Get auth state and setter
  const axiosPrivate = useAxiosPrivate(); // Get the private axios instance with interceptors

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    // Function to attempt refreshing the access token.
    const verifyRefreshToken = async () => {
      try {
        // Make a request to the refresh token endpoint.
        // axiosPublic is used here because the refresh endpoint doesn't need an access token.
        const response = await axiosPrivate.get('/api/auth/refresh');
        const newAccessToken = response.data.accessToken;

        // Decode the new access token to get updated user info (id, roles).
        // This is important because roles might change on the backend.
        const decodedAccessToken = JSON.parse(atob(newAccessToken.split('.')[1]));
        const { id, roles } = decodedAccessToken;

        // Update the auth context with the new access token and updated user data.
        setAuth(prev => ({
          ...prev,
          accessToken: newAccessToken,
          user: { ...prev.user, id, roles } // Update user info with fresh data from token
        }));
      } catch (err) {
        console.error("Refresh token verification failed:", err);
        // If refresh fails, clear the auth state to ensure user is logged out.
        setAuth({});
      } finally {
        // Set loading to false once the refresh attempt is complete.
        isMounted && setIsLoading(false);
      }
    };

    // Only attempt to verify refresh token if there's no current access token.
    // This prevents unnecessary refresh calls if the user is already logged in with a valid access token.
    if (!auth?.accessToken) {
      verifyRefreshToken();
    } else {
      setIsLoading(false); // If access token exists, no need to load
    }

    // Cleanup function: Set isMounted to false when component unmounts.
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this effect runs only once on mount

  // Render loading indicator while checking for persistent login.
  // Once loading is complete, render the child routes using <Outlet />.
  return (
    <>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
          <p className="text-xl text-gray-700 animate-pulse">Loading persistent session...</p>
        </div>
      ) : (
        <Outlet /> // Renders the child routes defined in App.jsx
      )}
    </>
  );
};

export default PersistLogin;
