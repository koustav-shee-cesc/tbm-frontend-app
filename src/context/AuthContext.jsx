import React, { createContext, useState, useEffect } from 'react';

// This will hold the authentication state and functions.
const AuthContext = createContext({});

// AuthProvider component wraps the entire application (or parts that need auth context).
// It manages the authentication state and provides it to its children.
export const AuthProvider = ({ children }) => {
  // State to store user information (id, username, email, roles) and the access token.
  // Initialize from localStorage if available to persist login across sessions (though refresh token is primary).
  const [auth, setAuth] = useState(() => {
    try {
      const storedAuth = localStorage.getItem('auth');
      return storedAuth ? JSON.parse(storedAuth) : {};
    } catch (error) {
      console.error("Failed to parse auth from localStorage", error);
      return {};
    }
  });

  // Effect to update localStorage whenever the auth state changes.
  useEffect(() => {
    try {
      localStorage.setItem('auth', JSON.stringify(auth));
    } catch (error) {
      console.error("Failed to save auth to localStorage", error);
    }
  }, [auth]);

  // The value provided to consumers of this context.
  // `auth` contains the user data and access token.
  // `setAuth` allows updating the authentication state.
  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
