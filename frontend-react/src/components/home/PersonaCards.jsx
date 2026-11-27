export default function PersonaCards({ onSelectPersona }) {
  const personas = [
    {
      id: 'student',
      title: 'For Students',
      desc: 'Budget PGs, meal options, Wi-Fi & study-friendly rooms near colleges.',
      icon: 'fa-graduation-cap',
      emoji: '🎓',
      bgIcon: 'bg-[#0B2545]',
      textIcon: 'text-[#F97316]',
    },
    {
      id: 'bachelor',
      title: 'For Working Bachelors',
      desc: '100% Bachelor-Friendly flats, private rooms & flatmates with zero restrictions.',
      icon: 'fa-briefcase',
      emoji: '💼',
      bgIcon: 'bg-[#14532D]',
      textIcon: 'text-[#A7F3D0]',
    },
    {
      id: 'family',
      title: 'For Families',
      desc: 'Verified 2 & 3 BHK apartments with bill/tax-checked owners near schools & metro.',
      icon: 'fa-house-chimney-user',
      emoji: '👨‍👩‍👧‍👦',
      bgIcon: 'bg-[#EA580C]',
      textIcon: 'text-white',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personas.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectPersona && onSelectPersona(p.id)}
            className="marketplace-card rounded-2xl p-4 cursor-pointer flex items-center gap-4 transition hover:-translate-y-1 shadow-sm hover:shadow-md"
            role="button"
            tabIndex={0}
          >
            <div
              className={`w-12 h-12 rounded-xl ${p.bgIcon} ${p.textIcon} flex items-center justify-center text-xl shrink-0 shadow-sm`}
            >
              <i className={`fa-solid ${p.icon}`}></i>
              <span className="sr-only">{p.emoji}</span>
            </div>
            <div>
              <h3 className="font-extrabold text-[#0B2545] text-base leading-snug">
                {p.title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
