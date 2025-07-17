import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import PersistLogin from './components/PersistLogin'; // Import PersistLogin component
import RequireAuth from './pages/RequireAuth'; // Import RequireAuth component
import Login from './pages/Login'; // Import the Login component
import useAuth from './hooks/useAuth'; // Import useAuth hook for conditional rendering
import useAxiosPrivate from './api/axiosPrivate'; // Import useAxiosPrivate for logout in HomePage/Dashboard/Admin/Editor

// Import other components
import AdminPage from './components/AdminPage';
import DashboardPage from './components/DashboardPage';
import EditorPage from './components/EditorPage';
import DataDisplay from './components/DataDisplay';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFound from './pages/NotFound';


// Define numeric role codes for frontend use (must match backend)
const ROLES = {
  User: 100,
  Editor: 200,
  Admin: 999,
};

// --- HomePage Component (Defined here for simplicity in App.jsx) ---
// In a larger app, you'd keep this in its own file like other components.
const HomePage = () => {
  const { auth, setAuth } = useAuth(); // Access auth context
  const axiosPrivate = useAxiosPrivate(); // Access private axios for logout

  const handleLogout = async () => {
    try {
      await axiosPrivate.post('/api/auth/logout');
      setAuth({}); // Clear auth state on frontend
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-inter">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to the Home Page!</h1>
      <p className="text-lg text-gray-700 mb-8 text-center">
        This is a public page.
      </p>
      <nav className="flex flex-wrap justify-center gap-4 mb-8">
        {!auth?.accessToken ? (
          <Link
            to="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            Login
          </Link>
        ) : (
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
            {auth?.user?.roles?.includes(ROLES.Editor) && (
              <Link
                to="/editor"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Editor Panel
              </Link>
            )}
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

// Main App component that sets up routing and authentication context.
function App() {
  return (
    // BrowserRouter enables client-side routing.
    <BrowserRouter>
      {/* AuthProvider wraps the entire application to provide authentication context */}
      <AuthProvider>
        {/* Routes component defines the application's routes. */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes (using PersistLogin and RequireAuth) */}
          {/* PersistLogin attempts to refresh token on app load */}
          <Route element={<PersistLogin />}>
            {/* Routes requiring authentication (any logged-in user) */}
            <Route element={<RequireAuth allowedRoles={[ROLES.User, ROLES.Editor, ROLES.Admin]} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* New route for DataDisplay, accessible by User, Editor, Admin */}
              <Route path="/data" element={<DataDisplay />} />
            </Route>

            {/* Routes requiring Editor or Admin roles */}
            <Route element={<RequireAuth allowedRoles={[ROLES.Editor, ROLES.Admin]} />}>
              <Route path="/editor" element={<EditorPage />} />
            </Route>

            {/* Routes requiring specific roles (e.g., Admin) */}
            <Route element={<RequireAuth allowedRoles={[ROLES.Admin]} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>

          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
