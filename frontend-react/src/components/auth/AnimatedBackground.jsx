import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, Home, KeyRound, Landmark, Warehouse, ShieldCheck, TrendingUp } from 'lucide-react';

const ICONS = [Building2, Home, KeyRound, Landmark, Warehouse, ShieldCheck, TrendingUp];

/**
 * Decorative, non-interactive backdrop: slow-drifting colour blobs + real-estate
 * icons floating upward. Parent must be `relative ... overflow-hidden`.
 */
export default function AnimatedBackground() {
  const floaters = useMemo(() => {
    // Deterministic pseudo-random layout so every render looks the same
    let seed = 42;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      Icon: ICONS[i % ICONS.length],
      left: rand() * 100,
      size: 22 + rand() * 30,
      delay: rand() * 12,
      duration: 17 + rand() * 13,
      opacity: 0.1 + rand() * 0.16,
      drift: (rand() - 0.5) * 140,
    }));
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-beige-light to-cream" />

      {/* Drifting colour blobs */}
      <motion.div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-forest/15 blur-3xl"
        animate={{ x: [0, 70, 0], y: [0, 45, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-beige-border/40 blur-3xl"
        animate={{ x: [0, -80, 0], y: [0, 65, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-orange/10 blur-3xl"
        animate={{ x: [0, 55, 0], y: [0, -55, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Floating icons rising from below */}
      {floaters.map(({ id, Icon, left, size, delay, duration, opacity, drift }) => (
        <motion.div
          key={id}
          className="absolute bottom-0"
          style={{ left: `${left}%`, opacity }}
          initial={{ y: '115vh', x: 0, rotate: -8 }}
          animate={{ y: '-18vh', x: drift, rotate: 10 }}
          transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
        >
          <Icon size={size} className="text-forest/35" strokeWidth={1.4} />
        </motion.div>
      ))}
    </div>
  );
}
