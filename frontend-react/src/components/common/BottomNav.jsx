import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, User, ListChecks, CalendarClock, ShieldCheck, Users, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Hide completely on splash, auth, role-selection & admin login
  if (
    pathname === '/auth' ||
    pathname === '/admin/login' ||
    pathname === '/onboarding' ||
    pathname === '/splash' ||
    pathname === '/role-selection'
  ) {
    return null;
  }

  let items = [];
  if (!user) {
    items = [
      { to: '/tenant', label: 'Home', icon: Home },
      { to: '/tenant/search', label: 'Search', icon: Search },
      { to: '/tenant/chats', label: 'Support', icon: MessageCircle },
      { to: '/auth', label: 'Log in', icon: LogIn },
    ];
  } else if (user.role === 'TENANT') {
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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ebe1c9] bg-white/95 backdrop-blur-lg md:hidden pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`nav-link flex flex-col items-center gap-1 py-1 text-[11px] font-semibold transition-all ${
                active ? 'text-[#14532D] scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
