import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAxiosPrivate from '../api/axiosPrivate'; // For authenticated requests
import useAuth from '../hooks/useAuth'; // To display user info and handle logout

const DataDisplay = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const axiosPrivate = useAxiosPrivate(); // Get the private Axios instance
  const { auth, setAuth } = useAuth(); // Get auth context for user info and logout

  // Handles the logout functionality
  const handleLogout = async () => {
    try {
      await axiosPrivate.post('/api/auth/logout');
      setAuth({}); // Clear auth state on frontend
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController(); // For cancelling requests if component unmounts

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        // Make an authenticated request to the backend data endpoint
        const response = await axiosPrivate.get('/api/data', {
          signal: controller.signal // Link abort controller to the request
        });
        if (isMounted) {
          setData(response.data);
        }
      } catch (err) {
        if (err.name === 'CanceledError') {
          console.log('Request cancelled:', err.message);
        } else {
          console.error('Error fetching data:', err);
          setError('Failed to fetch data. Please try again.');
          if (err.response?.status === 403) {
            setError('You do not have permission to view this data.');
          } else if (err.response?.status === 401) {
            setError('Your session has expired. Please log in again.');
          }
        }
      } finally {
        isMounted && setLoading(false);
      }
    };

    fetchData();

    // Cleanup function: abort ongoing request if component unmounts
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [axiosPrivate]); // Re-run effect if axiosPrivate instance changes (due to token refresh)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
        <p className="text-xl text-gray-700 animate-pulse">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 font-inter">
        <h2 className="text-2xl font-bold text-red-800 mb-4">Error</h2>
        <p className="text-lg text-red-700 mb-8 text-center">{error}</p>
        <Link
          to="/"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-inter">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {auth?.user?.roles?.includes(999) || auth?.user?.roles?.includes(200)
            ? 'All Data Items'
            : 'Your Data Items'}
        </h1>
        {auth?.user && (
          <div className="text-center text-gray-700 mb-6">
            <p className="text-lg">Logged in as: <span className="font-semibold">{auth.user.username}</span></p>
            <p className="text-sm">Roles: {auth.user.roles.join(', ')}</p>
          </div>
        )}

        {data.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">No data items found for your account.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((item) => (
              <div key={item._id} className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">{item.title}</h3>
                <p className="text-gray-700 text-sm mb-3">{item.description}</p>
                <p className="text-gray-900 font-bold text-lg">Value: ${item.value}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Owner: {item.userId?.username || 'N/A'} ({item.userId?.email || 'N/A'})
                </p>
                <p className="text-gray-500 text-xs">Created: {new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link
            to="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataDisplay;
