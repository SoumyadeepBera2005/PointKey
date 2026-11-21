import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, User, MapPin, ListChecks, CalendarClock, ShieldCheck, Users, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (!user) return null;

  let items = [];
  if (user.role === 'TENANT') {
    items = [
      { to: '/tenant', label: 'Home', icon: Home },
      { to: '/tenant/search', label: 'Search', icon: Search },
      { to: '/tenant/chats', label: 'Chats', icon: MessageCircle },
      { to: '/tenant/profile', label: 'Profile', icon: User },
    ];
  } else if (user.role === 'OWNER') {
    items = [
      { to: '/owner', label: 'Home', icon: Home },
      { to: '/owner/listings', label: 'Listings', icon: ListChecks },
      { to: '/owner/requests', label: 'Requests', icon: CalendarClock },
      { to: '/owner/profile', label: 'Profile', icon: User },
    ];
  } else if (user.role === 'ADMIN') {
    items = [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/tenants', label: 'Tenants', icon: Users },
      { to: '/admin/owners', label: 'Owners', icon: ShieldCheck },
      { to: '/admin/profile', label: 'Profile', icon: User },
    ];
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-beige-border bg-cream/95 backdrop-blur-lg md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 py-1.5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <NavLink key={to} to={to} className={`nav-link ${active ? 'active' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
