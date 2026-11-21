import { useNavigate } from 'react-router-dom';
import { KeyRound, Building2, ChevronRight } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f3ead6] px-4 font-sans">
      <div className="relative z-10 flex w-full flex-col items-center max-w-2xl">
        <div className="mb-6 rounded-2xl bg-[#fffaf0] p-3 shadow-md">
          <img src="/assets/pointkey-logo.png" alt="PointKey" className="h-14 w-auto" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#1f2f6b]/60">You are</p>
        <h1 className="mt-2 text-3xl font-black text-[#1f2f6b]">Choose your role</h1>
        <p className="mt-1 text-sm text-[#334155]">This personalises your PointKey experience.</p>

        <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
          <button
            onClick={() => navigate('/auth?role=tenant')}
            className="group rounded-2xl border-2 border-[#d8cba9] bg-[#fffaf0] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1f4d3f] hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1f4d3f]/15 text-[#1f4d3f] transition group-hover:bg-[#1f4d3f] group-hover:text-white">
              <KeyRound size={28} />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-[#17324D]">I&apos;m a Tenant</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#334155]">
              Search verified rooms, PGs &amp; flats on the map. Move in with confidence.
            </p>
            <span className="mt-4 flex items-center gap-1 text-sm font-bold text-[#1f4d3f]">
              Continue <ChevronRight size={16} />
            </span>
          </button>

          <button
            onClick={() => navigate('/auth?role=owner')}
            className="group rounded-2xl border-2 border-[#d8cba9] bg-[#fffaf0] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#070738] hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#070738]/15 text-[#070738] transition group-hover:bg-[#070738] group-hover:text-white">
              <Building2 size={28} />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-[#17324D]">I&apos;m an Owner</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#334155]">
              List your property simply. Meet verified tenants who are looking right now.
            </p>
            <span className="mt-4 flex items-center gap-1 text-sm font-bold text-[#070738]">
              Continue <ChevronRight size={16} />
            </span>
          </button>
        </div>

        <button
          onClick={() => navigate('/admin/login')}
          className="mt-8 text-xs font-semibold text-[#1f2f6b]/70 underline-offset-2 hover:text-[#e08a1e] hover:underline"
        >
          Administrator log in
        </button>
      </div>
    </div>
  );
}
