const RADII = [1, 2, 5, 10];

export default function MapRadiusToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Search radius">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Within</span>
      {RADII.map((r) => (
        <button
          key={r}
          role="radio"
          aria-checked={Number(value) === r}
          onClick={() => onChange(r)}
          className={`h-8 w-12 rounded-full text-xs font-bold transition-all duration-300 ${
            Number(value) === r ? 'bg-trust text-white shadow-md scale-110' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {r} km
        </button>
      ))}
    </div>
  );
}
