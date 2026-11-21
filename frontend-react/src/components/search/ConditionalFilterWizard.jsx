import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, UserRound, GraduationCap, Briefcase, BedDouble, Building, Utensils, Bath, Home } from 'lucide-react';

/**
 * Conditional Search & Filter Tree from the pRent spec:
 *  Step 1 Identity: Male | Female | Any Family member
 *  Step 2: Family → Rooms/Flat only; Male/Female → occupation → unlocks Rooms/PG/Flat
 *  Step 3: Granular sub-filters per category.
 */
export default function ConditionalFilterWizard({ value, onChange }) {
  const f = value;
  const set = (patch) => onChange({ ...f, ...patch });

  const isFamily = f.gender === 'FAMILY';
  const occupationChosen = Boolean(f.occupation);
  const categoryEnabled = isFamily || occupationChosen;

  const pickIdentity = (gender) => {
    if (gender === 'FAMILY') {
      onChange({ gender: 'FAMILY', occupation: 'FAMILY', category: f.category === 'PG' ? undefined : f.category });
    } else {
      onChange({ gender, occupation: undefined, category: undefined });
    }
  };

  const CategoryBtn = ({ id, label, icon: Icon }) => {
    const active = f.category === id;
    return (
      <button type="button" onClick={() => set({ category: id })} className={`pill ${active ? 'pill-active' : ''} flex items-center gap-2`}>
        <Icon size={16} /> {label}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* Step 1 — Identity */}
      <fieldset>
        <legend className="label">Step 1 · Who are you?</legend>
        <div className="flex flex-wrap gap-2">
          <button className={`pill ${f.gender === 'MALE' ? 'pill-active' : ''} flex items-center gap-2`} onClick={() => pickIdentity('MALE')}><User size={16} /> Male</button>
          <button className={`pill ${f.gender === 'FEMALE' ? 'pill-active' : ''} flex items-center gap-2`} onClick={() => pickIdentity('FEMALE')}><UserRound size={16} /> Female</button>
          <button className={`pill ${f.gender === 'FAMILY' ? 'pill-active' : ''} flex items-center gap-2`} onClick={() => pickIdentity('FAMILY')}><Users size={16} /> Any Family member</button>
        </div>
      </fieldset>

      {/* Step 2 — Occupation (only for Male/Female) */}
      <AnimatePresence>
        {f.gender && !isFamily && (
          <motion.fieldset initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <legend className="label">Step 2 · Your occupation</legend>
            <div className="flex flex-wrap gap-2">
              <button className={`pill ${f.occupation === 'STUDENT' ? 'pill-active' : ''} flex items-center gap-2`} onClick={() => set({ occupation: 'STUDENT' })}><GraduationCap size={16} /> Student</button>
              <button className={`pill ${f.occupation === 'WORKING_PROFESSIONAL' ? 'pill-active' : ''} flex items-center gap-2`} onClick={() => set({ occupation: 'WORKING_PROFESSIONAL' })}><Briefcase size={16} /> Working Professional</button>
            </div>
          </motion.fieldset>
        )}
      </AnimatePresence>

      {/* Step 3 — Category */}
      <AnimatePresence>
        {categoryEnabled && (
          <motion.fieldset initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <legend className="label">Step 3 · What are you looking for?</legend>
            <div className="flex flex-wrap gap-2">
              <CategoryBtn id="ROOM" label="Rooms" icon={BedDouble} />
              {!isFamily && <CategoryBtn id="PG" label="PG" icon={Building} />}
              <CategoryBtn id="FLAT" label="Flat" icon={Home} />
            </div>
          </motion.fieldset>
        )}
      </AnimatePresence>

      {/* Step 4 — Granular sub-filters */}
      <AnimatePresence>
        {f.category === 'ROOM' && (
          <motion.fieldset key="room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <legend className="label">Room details</legend>
            <div className="flex flex-wrap gap-2">
              <button className={`pill ${f.sub_type === 'PERSONAL_ROOM' ? 'pill-active' : ''}`} onClick={() => set({ sub_type: 'PERSONAL_ROOM' })}>Personal Room</button>
              <button className={`pill ${f.sub_type === 'SHARED_ROOM' ? 'pill-active' : ''}`} onClick={() => set({ sub_type: 'SHARED_ROOM' })}>Shared Room</button>
            </div>
            {f.sub_type === 'PERSONAL_ROOM' && (
              <div className="flex flex-wrap gap-2">
                <button className={`pill ${Number(f.sharing_capacity) === 1 ? 'pill-active' : ''}`} onClick={() => set({ sharing_capacity: '1' })}>Single</button>
                <button className={`pill ${Number(f.sharing_capacity) === 2 ? 'pill-active' : ''}`} onClick={() => set({ sharing_capacity: '2' })}>Double</button>
                <button className={`pill ${f.bathroom_type === 'COMMON' ? 'pill-active' : ''} flex items-center gap-2`} onClick={() => set({ bathroom_type: 'COMMON' })}><Bath size={14} /> Common Bath</button>
                <button className={`pill ${f.bathroom_type === 'PRIVATE' ? 'pill-active' : ''} flex items-center gap-2`} onClick={() => set({ bathroom_type: 'PRIVATE' })}><Bath size={14} /> Private Bath</button>
              </div>
            )}
            {f.sub_type === 'SHARED_ROOM' && (
              <div className="flex flex-wrap gap-2">
                <button className={`pill ${Number(f.sharing_capacity) === 2 ? 'pill-active' : ''}`} onClick={() => set({ sharing_capacity: '2' })}>1 Roommate</button>
                <button className={`pill ${Number(f.sharing_capacity) === 3 ? 'pill-active' : ''}`} onClick={() => set({ sharing_capacity: '3' })}>2 Roommates</button>
                <span className="pill cursor-default opacity-70">Common Bath &amp; Kitchen</span>
              </div>
            )}
          </motion.fieldset>
        )}

        {f.category === 'PG' && (
          <motion.fieldset key="pg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <legend className="label">PG details</legend>
            <div className="flex flex-wrap gap-2">
              <button className={`pill ${f.sub_type === 'PERSONAL_ROOM' ? 'pill-active' : ''}`} onClick={() => set({ sub_type: 'PERSONAL_ROOM' })}>Personal Room</button>
              <button className={`pill ${f.sub_type === 'SHARED_ROOM' ? 'pill-active' : ''}`} onClick={() => set({ sub_type: 'SHARED_ROOM' })}>Shared Room</button>
              <button className={`pill ${f.bathroom_type === 'PRIVATE' ? 'pill-active' : ''}`} onClick={() => set({ bathroom_type: 'PRIVATE' })}>Private Bath</button>
              <button className={`pill ${f.bathroom_type === 'COMMON' ? 'pill-active' : ''}`} onClick={() => set({ bathroom_type: 'COMMON' })}>Common Bath</button>
              <button className={`pill ${f.food_included === 'true' ? 'pill-active' : ''} flex items-center gap-2`} onClick={() => set({ food_included: f.food_included === 'true' ? undefined : 'true' })}><Utensils size={14} /> Food Included</button>
            </div>
          </motion.fieldset>
        )}

        {f.category === 'FLAT' && (
          <motion.fieldset key="flat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <legend className="label">Flat details</legend>
            <div className="flex flex-wrap gap-2">
              {['1BHK', '2BHK', '3BHK'].map((b) => (
                <button key={b} className={`pill ${f.bhk === b ? 'pill-active' : ''}`} onClick={() => set({ bhk: b })}>{b.replace('BHK', ' BHK')}</button>
              ))}
            </div>
          </motion.fieldset>
        )}
      </AnimatePresence>
    </div>
  );
}
