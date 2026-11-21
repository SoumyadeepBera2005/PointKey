const SLOT_GROUPS = [
  { label: 'Mid-Morning', slots: ['10:00-11:00 AM', '11:00-12:00 PM'] },
  { label: 'Afternoon', slots: ['3:00-4:00 PM', '4:00-5:00 PM'] },
  { label: 'Evening', slots: ['7:00-8:00 PM', '8:00-9:00 PM'] },
];

export const VALID_SLOTS = SLOT_GROUPS.flatMap((g) => g.slots);

export default function SlotPicker({ value, onChange }) {
  return (
    <div className="space-y-4">
      {SLOT_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="label">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.slots.map((slot) => (
              <button
                key={slot}
                type="button"
                role="radio"
                aria-checked={value === slot}
                onClick={() => onChange(slot)}
                className={`pill ${value === slot ? 'pill-active' : ''}`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
