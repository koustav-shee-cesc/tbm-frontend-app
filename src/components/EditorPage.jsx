import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Import useAuth hook
import useAxiosPrivate from '../api/axiosPrivate'; // Import useAxiosPrivate for logout

const EditorPage = () => {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4 font-inter">
      <h1 className="text-4xl font-bold text-green-800 mb-6">Editor Panel</h1>
      {auth?.user ? (
        <div className="text-lg text-green-700 mb-8 text-center">
          <p>Welcome, Editor {auth.user.username}!</p>
          <p>You have privileges to edit content.</p>
          <p>Your roles: {auth.user.roles.join(', ')}</p>
          {/* Add more editor-specific content here */}
        </div>
      ) : (
        <p className="text-lg text-green-700 mb-8 text-center">
          You need to be logged in as an editor to view this page.
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          Go to Home
        </Link>
        {auth?.accessToken && ( // Only show logout if logged in
          <button
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
