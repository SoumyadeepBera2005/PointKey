const TONES = {
  green: 'bg-forest/15 text-forest-dark border-forest/30',
  orange: 'bg-orange/15 text-orange-dark border-orange/30',
  navy: 'bg-navy/10 text-navy border-navy/20',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  slate: 'bg-white text-slate-700 border-beige-border',
  blue: 'bg-navy/10 text-navy-light border-navy/20',
};

export default function Badge({ tone = 'slate', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONES[tone] || TONES.slate}`}>
      {children}
    </span>
  );
}
