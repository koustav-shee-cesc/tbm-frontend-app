import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PersistLogin from './components/PersistLogin';
import RequireAuth from './components/RequireAuth';
import useAuth from './hooks/useAuth'; // For conditional rendering in HomePage/Login redirect

// Import core pages from tbm-frontend-app (now in src/pages)
import Login from './pages/Login';
import HomePage from './components/HomePage'; // Reusing the HomePage structure from tbm-frontend-app, will be updated with links
import AdminPage from './components/AdminPage';
import EditorPage from './components/EditorPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFound from './pages/NotFound';
import DataDisplay from './components/DataDisplay'; // Example protected data page

// Import TBM-specific components from my-tbm-app (will be in src/components/tbm-forms)
// Note: DashboardPage from my-tbm-app is more feature-rich, so we'll use that one.
import DashboardPage from './components/DashboardPage'; // This is the one from my-tbm-app
import CompaniesTable from './components/CompaniesTable';
import CreateCompanyForm from './components/CreateCompanyForm';
import CreateMemberForm from './components/CreateMemberForm';
import DSSiteChecklistForm from './components/DSSiteChecklistForm';
import MasterAllocationTable from './components/MasterAllocationTable';
import MembersTable from './components/MembersTable';
import PreSiteChecklistForm from './components/PreSiteChecklistForm';
import SiteChecklistOfficeForm from './components/SiteChecklistOfficeForm';
import SiteJobStartChecklistForm from './components/SiteJobStartChecklistForm';
import TodaysTBMPage from './components/TodaysTBMPage';
import UploadMasterAllocation from './components/UploadMasterAllocation';
import AnalyticsPage from './components/AnalyticsPage'; // New Analytics Page
import AppLayout from './components/layout/AppDesktopLayout';

// Define numeric role codes for frontend use (must match backend)
const ROLES = {
  User: 100,
  Editor: 200,
  Admin: 999,
};

// Main App component that sets up routing and authentication context.
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          {/* Default route redirects to login if not authenticated, otherwise to dashboard */}
          <Route path="/" element={<InitialRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes (using PersistLogin and RequireAuth) */}
          <Route element={<PersistLogin />}>
          <Route path='/' element={<AppLayout />}>
            {/* Routes requiring authentication (any logged-in user) */}
            <Route element={<RequireAuth allowedRoles={[ROLES.User, ROLES.Editor, ROLES.Admin]} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/data" element={<DataDisplay />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/master-allocation-table" element={<MasterAllocationTable />} />
              <Route path="/todays-tbm" element={<TodaysTBMPage />} />
            </Route>

            {/* Routes requiring Editor or Admin roles */}
            <Route element={<RequireAuth allowedRoles={[ROLES.Editor, ROLES.Admin]} />}>   
                <Route path="/companies-table" element={<CompaniesTable />} />
                <Route path="/members-table" element={<MembersTable />} />
                <Route path="/editor" element={<EditorPage />} />
                <Route path="/create-company" element={<CreateCompanyForm />} />
                <Route path="/create-member" element={<CreateMemberForm />} />
                <Route path="/ds-site-checklist" element={<DSSiteChecklistForm />} />
                <Route path="/pre-site-checklist" element={<PreSiteChecklistForm />} />
                <Route path="/site-checklist-office" element={<SiteChecklistOfficeForm />} />
                <Route path="/site-job-start-checklist" element={<SiteJobStartChecklistForm />} />
                <Route path="/upload-master-allocation" element={<UploadMasterAllocation />} />
            </Route>

            {/* Routes requiring Admin role */}
            <Route element={<RequireAuth allowedRoles={[ROLES.Admin]} />}>
              <Route path="/admin" element={<AdminPage />} />
              {/* Admin-specific routes can be added here */}
            </Route>
            </Route>
          </Route>

          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Helper component to redirect based on authentication status
const InitialRedirect = () => {
  const { auth } = useAuth();
  // If authenticated, redirect to dashboard, otherwise to login
  return auth?.accessToken ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default App;
