import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Import useAuth hook
import useAxiosPrivate from '../api/axiosPrivate'; // Import useAxiosPrivate for logout

// Define numeric role codes for frontend use (must match backend)
const ROLES = {
  User: 100,
  Editor: 200,
  Admin: 999,
};

const HomePage = () => {
  const { auth, setAuth } = useAuth(); // Access auth context
  const axiosPrivate = useAxiosPrivate(); // Access private axios for logout

  // Handles the logout functionality
  const handleLogout = async () => {
    try {
      // Call the backend logout endpoint. This will clear the HttpOnly cookie.
      await axiosPrivate.post('/api/auth/logout');
      // Clear the authentication state in the frontend.
      setAuth({});
      // Optionally, navigate to the login page or home page after logout.
      // navigate('/login'); // If you want to force redirect to login
    } catch (err) {
      console.error('Logout failed:', err);
      // Even if backend logout fails, clear frontend state for user experience.
      setAuth({});
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-inter">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to the Home Page!</h1>
      <p className="text-lg text-gray-700 mb-8 text-center">
        This is a public page.
      </p>
      <nav className="flex flex-wrap justify-center gap-4 mb-8">
        {/* Conditional rendering based on authentication status */}
        {!auth?.accessToken ? (
          // If not authenticated, show login link
          <Link
            to="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            Login
          </Link>
        ) : (
          // If authenticated, show dashboard, editor (if applicable), admin (if applicable), and logout
          <>
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Dashboard
            </Link>
            {/* Link to Data Items page, visible to all authenticated roles */}
            <Link
              to="/data"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
            >
              Data Items
            </Link>
            {/* Conditionally show Editor Panel link based on user roles */}
            {auth?.user?.roles?.includes(ROLES.Editor) && (
              <Link
                to="/editor"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Editor Panel
              </Link>
            )}
            {/* Conditionally show Admin Panel link based on user roles */}
            {auth?.user?.roles?.includes(ROLES.Admin) && (
              <Link
                to="/admin"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </div>
  );
};

export default HomePage;
