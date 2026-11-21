import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Splash from './pages/auth/Splash';
import Onboarding from './pages/auth/Onboarding';
import RoleSelection from './pages/auth/RoleSelection';
import AuthPage from './pages/auth/AuthPage';

import TenantHome from './pages/tenant/TenantHome';
import SearchResults from './pages/tenant/SearchResults';
import PropertyDetails from './pages/tenant/PropertyDetails';
import PaymentCheckout from './pages/tenant/PaymentCheckout';
import VisitBooking from './pages/tenant/VisitBooking';
import TenantProfile from './pages/tenant/TenantProfile';
import TenantChats from './pages/tenant/TenantChats';

import OwnerHome from './pages/owner/OwnerHome';
import AddPropertyWizard from './pages/owner/AddPropertyWizard';
import MyListings from './pages/owner/MyListings';
import VisitRequests from './pages/owner/VisitRequests';
import OwnerProfile from './pages/owner/OwnerProfile';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageTenants from './pages/admin/ManageTenants';
import ManageOwners from './pages/admin/ManageOwners';
import AdminProfile from './pages/admin/AdminProfile';

function RequireRole({ roles }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/splash" replace />;
  if (user.role === 'OWNER') return <Navigate to="/owner" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/tenant" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<RequireRole roles={['TENANT']} />}>
        <Route path="/tenant" element={<TenantHome />} />
        <Route path="/tenant/search" element={<SearchResults />} />
        <Route path="/tenant/property/:id" element={<PropertyDetails />} />
        <Route path="/tenant/property/:id/checkout" element={<PaymentCheckout />} />
        <Route path="/tenant/property/:id/visit" element={<VisitBooking />} />
        <Route path="/tenant/chats" element={<TenantChats />} />
        <Route path="/tenant/profile" element={<TenantProfile />} />
      </Route>

      <Route element={<RequireRole roles={['OWNER']} />}>
        <Route path="/owner" element={<OwnerHome />} />
        <Route path="/owner/add-property" element={<AddPropertyWizard />} />
        <Route path="/owner/listings" element={<MyListings />} />
        <Route path="/owner/requests" element={<VisitRequests />} />
        <Route path="/owner/profile" element={<OwnerProfile />} />
      </Route>

      <Route element={<RequireRole roles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tenants" element={<ManageTenants />} />
        <Route path="/admin/owners" element={<ManageOwners />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
