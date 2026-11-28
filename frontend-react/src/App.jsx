import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

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

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageTenants from './pages/admin/ManageTenants';
import ManageOwners from './pages/admin/ManageOwners';
import ManageProperties from './pages/admin/ManageProperties';
import AdminProfile from './pages/admin/AdminProfile';

function RequireRole({ roles }) {
  const { user, openAuthModal } = useAuth();
  const location = useLocation();

  if (!user) {
    setTimeout(() => {
      if (roles.includes('ADMIN')) {
        openAuthModal?.('admin', 'admin', 'Please log in as Admin to access this panel.');
      } else {
        openAuthModal?.('input', 'tenant', 'Please log in to continue.');
      }
    }, 120);

    // If coming from property page, return to that property instead of bouncing to home
    const isPropertyRoute = location.pathname.startsWith('/tenant/property/');
    const propertyMatch = location.pathname.match(/^\/tenant\/property\/([^/]+)/);
    const fallback = isPropertyRoute && propertyMatch ? `/tenant/property/${propertyMatch[1]}` : '/';

    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  const userRole = (user.role || 'TENANT').toUpperCase();
  const isAllowed = roles.some((r) => {
    const target = r.toUpperCase();
    if (userRole === target) return true;
    if (target === 'TENANT' && (userRole.includes('TENANT') || userRole.includes('OWNER') || userRole.includes('BUILDER'))) return true;
    if (target === 'OWNER' && (userRole.includes('OWNER') || userRole.includes('BUILDER'))) return true;
    if (userRole === 'ADMIN') return true;
    return false;
  });

  if (!isAllowed) {
    const isPropertyRoute = location.pathname.startsWith('/tenant/property/');
    const propertyMatch = location.pathname.match(/^\/tenant\/property\/([^/]+)/);
    const fallback = isPropertyRoute && propertyMatch ? `/tenant/property/${propertyMatch[1]}` : '/';
    return <Navigate to={fallback} replace />;
  }
  return <Outlet />;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'OWNER') return <Navigate to="/owner" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <TenantHome />;
}

function AuthRedirect() {
  const { openAuthModal } = useAuth();
  useEffect(() => {
    openAuthModal?.('input', 'tenant');
  }, [openAuthModal]);
  return <Navigate to="/" replace />;
}

function AdminLoginRedirect() {
  const { openAuthModal } = useAuth();
  useEffect(() => {
    openAuthModal?.('admin', 'admin', 'Admin authentication required.');
  }, [openAuthModal]);
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/tenant" element={<TenantHome />} />
      <Route path="/tenant/search" element={<SearchResults />} />
      <Route path="/tenant/property/:id" element={<PropertyDetails />} />

      {/* Auth route redirects to main UI and opens Login/Signup Modal */}
      <Route path="/auth" element={<AuthRedirect />} />
      <Route path="/splash" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="/role-selection" element={<Navigate to="/" replace />} />
      <Route path="/admin/login" element={<AdminLoginRedirect />} />

      {/* Checkout and Visit Booking: Accessible to any authenticated user (TENANT, OWNER, TENANT+OWNER, ADMIN) */}
      <Route element={<RequireRole roles={['TENANT', 'OWNER', 'ADMIN', 'TENANT+OWNER', 'TENANT+BUILDER']} />}>
        <Route path="/tenant/property/:id/checkout" element={<PaymentCheckout />} />
        <Route path="/tenant/property/:id/visit" element={<VisitBooking />} />
      </Route>

      {/* Protected Tenant Routes */}
      <Route element={<RequireRole roles={['TENANT']} />}>
        <Route path="/tenant/chats" element={<TenantChats />} />
        <Route path="/tenant/profile" element={<TenantProfile />} />
      </Route>

      {/* Protected Owner Routes */}
      <Route element={<RequireRole roles={['OWNER']} />}>
        <Route path="/owner" element={<OwnerHome />} />
        <Route path="/owner/add-property" element={<AddPropertyWizard />} />
        <Route path="/owner/listings" element={<MyListings />} />
        <Route path="/owner/requests" element={<VisitRequests />} />
        <Route path="/owner/profile" element={<OwnerProfile />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<RequireRole roles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/properties" element={<ManageProperties />} />
        <Route path="/admin/tenants" element={<ManageTenants />} />
        <Route path="/admin/owners" element={<ManageOwners />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
