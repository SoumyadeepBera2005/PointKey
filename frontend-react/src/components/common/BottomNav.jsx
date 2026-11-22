import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, User, ListChecks, CalendarClock, ShieldCheck, Users, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * =============================================================================
 * POINTKEY MOBILE BOTTOM NAVIGATION COMPONENT (BottomNav.jsx)
 * =============================================================================
 * এই কম্পোনেন্টটি শুধুমাত্র মোবাইল ডিসপ্লেতে (স্ক্রিন সাইজ < 768px) স্ক্রিনের নিচে
 * অ্যাপের মতো ফ্লোটিং বটম বার হিসেবে দেখায় (যেমন Zomato / Airbnb / Swiggy-তে থাকে)।
 * 
 * মূল বৈশিষ্ট্যসমূহ:
 * ১. Role-Based Navigation:
 *    - সাধারণ ভিজিটর (Guest / Not Logged In): Home, Search, Support, Log in
 *    - ভাড়াটিয়া (Tenant): Home, Search, Chats, Profile
 *    - বাড়ির মালিক (Owner): Home, Listings, Requests, Profile
 *    - অ্যাডমিন (Admin): Dashboard, Tenants, Owners, Profile
 * 
 * ২. Auto-Hide Logic:
 *    - লগইন, সাইন-আপ, অনবোর্ডিং বা স্প্ল্যাশ স্ক্রিনে এই বারটি হাইড থাকে।
 * 
 * ৩. iOS Safe Area Padding:
 *    - iPhone-এর নিচের হোম-ইন্ডিকেটর বারের সাথে যাতে লেগে না যায়, তার জন্য
 *      `env(safe-area-inset-bottom)` ব্যবহার করা হয়েছে।
 * =============================================================================
 */

export default function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // যে সমস্ত পেজে বটম নেভিগেশন দেখানোর প্রয়োজন নেই (অথেনটিকেশন / অনবোর্ডিং ফ্লো)
  if (
    pathname === '/auth' ||
    pathname === '/admin/login' ||
    pathname === '/onboarding' ||
    pathname === '/splash' ||
    pathname === '/role-selection'
  ) {
    return null;
  }

  // ইউজারের রোল অনুযায়ী বটম মেনু আইটেম নির্ধারণ করা
  let items = [];
  if (!user) {
    // গেস্ট / লগইন ছাড়া ভিজিটরদের মেনু
    items = [
      { to: '/tenant', label: 'Home', icon: Home },
      { to: '/tenant/search', label: 'Search', icon: Search },
      { to: '/tenant/chats', label: 'Support', icon: MessageCircle },
      { to: '/auth', label: 'Log in', icon: LogIn },
    ];
  } else if (user.role === 'TENANT') {
    // ভাড়াটিয়াদের মেনু
    items = [
      { to: '/tenant', label: 'Home', icon: Home },
      { to: '/tenant/search', label: 'Search', icon: Search },
      { to: '/tenant/chats', label: 'Chats', icon: MessageCircle },
      { to: '/tenant/profile', label: 'Profile', icon: User },
    ];
  } else if (user.role === 'OWNER') {
    // বাড়ির মালিকদের মেনু
    items = [
      { to: '/owner', label: 'Home', icon: Home },
      { to: '/owner/listings', label: 'Listings', icon: ListChecks },
      { to: '/owner/requests', label: 'Requests', icon: CalendarClock },
      { to: '/owner/profile', label: 'Profile', icon: User },
    ];
  } else if (user.role === 'ADMIN') {
    // অ্যাডমিনদের মেনু
    items = [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/tenants', label: 'Tenants', icon: Users },
      { to: '/admin/owners', label: 'Owners', icon: ShieldCheck },
      { to: '/admin/profile', label: 'Profile', icon: User },
    ];
  }

  return (
    // md:hidden ক্লাস নিশ্চিত করে যে বড় স্ক্রিনে (ডেস্কটপ) এই বারটি লুকিয়ে থাকবে
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
              {/* অ্যাক্টিভ ট্যাবে আইকন গাঢ় হবে */}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
