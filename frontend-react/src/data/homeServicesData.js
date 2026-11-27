export const SERVICE_CATEGORIES = [
  {
    key: 'essentials',
    num: 1,
    name: 'Daily Essentials & Delivery',
    short: 'Daily Essentials',
    tag: 'Delivered to your door, daily or on demand',
    icon: 'fa-truck-fast',
    badge: 'Daily Essentials',
    badgeCls: 'bg-[#FFE8D6] text-[#E85D04]',
    accent: '#E85D04',
    panel: 'linear-gradient(135deg,#FFE8D6,#F8D5C2 60%,#F3C3C9)',
    visual: 'linear-gradient(135deg,#F48C06,#E85D04 55%,#9D0208)',
    highlight: 'Pause or stop any time',
    hlIcon: 'fa-clock-rotate-left'
  },
  {
    key: 'homecare',
    num: 2,
    name: 'Home Care & Maintenance',
    short: 'Home Care',
    tag: 'Cleaning, cooking, repairs and upkeep',
    icon: 'fa-house-chimney',
    badge: 'Home Care',
    badgeCls: 'bg-[#D8F3DC] text-[#2D6A4F]',
    accent: '#2D6A4F',
    panel: 'linear-gradient(135deg,#D8F3DC,#BFE8D0 60%,#B7E4F0)',
    visual: 'linear-gradient(135deg,#2D6A4F,#1B4332 60%,#0B2545)',
    highlight: 'Trained & verified professionals',
    hlIcon: 'fa-shield-halved'
  },
  {
    key: 'lifestyle',
    num: 3,
    name: 'Living & Lifestyle',
    short: 'Lifestyle',
    tag: 'Find the right people to share your home',
    icon: 'fa-user-group',
    badge: 'Lifestyle',
    badgeCls: 'bg-[#E0F2FE] text-[#4F46E5]',
    accent: '#4F46E5',
    panel: 'linear-gradient(135deg,#E0F2FE,#DDE7FF 60%,#EBDDFB)',
    visual: 'linear-gradient(135deg,#38BDF8,#6366F1 60%,#7C3AED)',
    highlight: 'ID-verified flatmates only',
    hlIcon: 'fa-id-card'
  },
  {
    key: 'shifting',
    num: 4,
    name: 'Shifting & Setup',
    short: 'Shifting & Setup',
    tag: 'Move in smoothly and set up your space',
    icon: 'fa-truck-moving',
    badge: 'Shifting & Setup',
    badgeCls: 'bg-[#FEF3C7] text-[#C2410C]',
    accent: '#C2410C',
    panel: 'linear-gradient(135deg,#FEF3C7,#FDE2B8 60%,#FBD0C0)',
    visual: 'linear-gradient(135deg,#FBBF24,#F97316 60%,#C2410C)',
    highlight: 'Move in without the stress',
    hlIcon: 'fa-box-open'
  },
  {
    key: 'emergency',
    num: 5,
    name: 'Emergency',
    short: 'Emergency',
    tag: 'Free to call, any time. Do not wait for a booking',
    icon: 'fa-triangle-exclamation',
    badge: 'Emergency',
    badgeCls: 'bg-[#FFE4E6] text-[#BE123C]',
    accent: '#BE123C',
    panel: 'linear-gradient(135deg,#FFE4E6,#FECDD3 60%,#FBCFE8)',
    visual: 'linear-gradient(135deg,#F43F5E,#BE123C 60%,#4C0519)',
    highlight: 'Free calls, 24 x 7',
    hlIcon: 'fa-phone-volume'
  }
];

export const HOME_SERVICES_DATA = [
  // 1. Daily Essentials & Delivery
  {
    id: 'srv-water',
    category: 'essentials',
    title: 'WaterJar',
    subtitle: '20L Water Jar Subscription',
    desc: 'Safe packaged drinking water jars delivered to your flat or PG floor, daily or weekly.',
    price: 35,
    unit: '/ jar',
    icon: 'fa-bottle-water',
    emoji: '💧'
  },
  {
    id: 'srv-tiffin',
    category: 'essentials',
    title: 'TiffinBox',
    subtitle: 'Homemade Tiffin & Meals',
    desc: 'Fresh homestyle lunch or dinner from local kitchens for students and professionals.',
    price: 70,
    unit: '/ meal',
    icon: 'fa-bowl-rice',
    emoji: '🍱'
  },
  {
    id: 'srv-laundry',
    category: 'essentials',
    title: 'WashDrop',
    subtitle: 'Laundry & Ironing Pickup',
    desc: 'Doorstep pickup, hygienic wash, ironing and neatly folded delivery within 24 hours.',
    price: 160,
    unit: '/ 3kg bag',
    icon: 'fa-shirt',
    emoji: '👕'
  },
  {
    id: 'srv-milk',
    category: 'essentials',
    title: 'MilkMate',
    subtitle: 'Daily Milk Delivery',
    desc: 'Fresh packaged milk at your door every morning. Pause or stop any time.',
    price: 33,
    unit: '/ 500ml',
    icon: 'fa-glass-water',
    emoji: '🥛'
  },
  {
    id: 'srv-paper',
    category: 'essentials',
    title: 'PaperBoy',
    subtitle: 'Newspapers & Magazines',
    desc: 'Your favourite newspaper or magazine delivered before breakfast.',
    price: 180,
    unit: '/ month',
    icon: 'fa-newspaper',
    emoji: '📰'
  },
  {
    id: 'srv-needs',
    category: 'essentials',
    title: 'QuickNeeds',
    subtitle: 'Groceries & Other Daily Items',
    desc: 'Eggs, bread, vegetables and other small daily needs from nearby shops.',
    price: 30,
    unit: '/ delivery',
    icon: 'fa-basket-shopping',
    emoji: '🛒'
  },
  {
    id: 'srv-gas',
    category: 'essentials',
    title: 'GasGo',
    subtitle: 'Gas Cylinder Booking & Delivery',
    desc: 'Book a refill and get the cylinder delivered and fitted at your home.',
    price: 900,
    unit: '/ cylinder',
    icon: 'fa-fire-flame-simple',
    emoji: '🔥'
  },

  // 2. Home Care & Maintenance
  {
    id: 'srv-cleaning',
    category: 'homecare',
    title: 'RoomClean',
    subtitle: 'Weekend Room & Bath Cleaning',
    desc: 'Floor mopping, dusting and full bathroom sanitization for flats, rooms and PGs.',
    price: 299,
    unit: '/ visit',
    icon: 'fa-broom',
    emoji: '🧹'
  },
  {
    id: 'srv-cook',
    category: 'homecare',
    title: 'CookEase',
    subtitle: 'Cook on Demand',
    desc: 'A trained cook visits your home to prepare fresh meals for you or your family.',
    price: 249,
    unit: '/ session',
    icon: 'fa-utensils',
    emoji: '👨‍🍳'
  },
  {
    id: 'srv-fix',
    category: 'homecare',
    title: 'FixCare',
    subtitle: 'Electrician, Plumber & Appliance Care',
    desc: 'Quick repair for switches, taps, leaks, geysers, plus servicing for AC, fridge and chimney.',
    price: 149,
    unit: '/ visit',
    icon: 'fa-screwdriver-wrench',
    emoji: '🔧'
  },
  {
    id: 'srv-pest',
    category: 'homecare',
    title: 'PestGuard',
    subtitle: 'Pest & Water Tank Cleaning',
    desc: 'Safe pest control and deep cleaning of overhead and underground water tanks.',
    price: 499,
    unit: '/ visit',
    icon: 'fa-bug',
    emoji: '🛡️'
  },
  {
    id: 'srv-paint',
    category: 'homecare',
    title: 'PaintFix',
    subtitle: 'Home Painting & Touch-Up',
    desc: 'Full-room painting or small wall touch-ups with a free site visit.',
    price: 999,
    unit: '/ room (from)',
    icon: 'fa-paint-roller',
    emoji: '🎨'
  },

  // 3. Living & Lifestyle
  {
    id: 'srv-flatmate',
    category: 'lifestyle',
    title: 'FlatMate',
    subtitle: 'Verified Flatmate Finder',
    desc: 'Get matched with ID-verified flatmates who fit your budget, habits and locality.',
    price: 299,
    unit: '/ request',
    icon: 'fa-user-group',
    emoji: '🤝'
  },

  // 4. Shifting & Setup
  {
    id: 'srv-move',
    category: 'shifting',
    title: 'MiniMove',
    subtitle: 'Mini Shifting & Porter Van',
    desc: 'Small-load shifting with a porter van and helpers for rooms, PGs and 1 BHK flats.',
    price: 799,
    unit: '/ trip',
    icon: 'fa-truck-moving',
    emoji: '🚚'
  },
  {
    id: 'srv-wifi',
    category: 'shifting',
    title: 'NetSetup',
    subtitle: 'Wi-Fi Setup',
    desc: 'Broadband and router installation support for work-from-home and study.',
    price: 249,
    unit: '/ setup',
    icon: 'fa-wifi',
    emoji: '📶'
  },
  {
    id: 'srv-fitting',
    category: 'shifting',
    title: 'SetupPro',
    subtitle: 'Light / Fan / Furniture Setup',
    desc: 'Fitting of lights, fans, curtain rods and assembly of beds, wardrobes and tables.',
    price: 199,
    unit: '/ visit',
    icon: 'fa-lightbulb',
    emoji: '💡'
  },
  {
    id: 'srv-furniture',
    category: 'shifting',
    title: 'FurniFix',
    subtitle: 'Broken Furniture Replacement',
    desc: 'Repair or replace broken chairs, beds, shelves and doors. Parts charged extra.',
    price: 399,
    unit: '/ visit',
    icon: 'fa-couch',
    emoji: '🛋️'
  },

  // 5. Emergency (call only)
  {
    id: 'emg-ambulance',
    category: 'emergency',
    title: 'Ambulance',
    subtitle: 'Emergency Medical & Accident Care',
    desc: 'Medical emergency, accident or serious illness.',
    call: '108',
    callLabel: '108 / 102',
    icon: 'fa-truck-medical',
    emoji: '🚑'
  },
  {
    id: 'emg-police',
    category: 'emergency',
    title: 'Police',
    subtitle: 'Immediate Police Assistance',
    desc: 'Theft, threat, harassment or any safety concern.',
    call: '112',
    callLabel: '112 / 100',
    icon: 'fa-shield-halved',
    emoji: '🚓'
  },
  {
    id: 'emg-fire',
    category: 'emergency',
    title: 'Fire Brigade',
    subtitle: 'Fire & Rescue Service',
    desc: 'Fire, gas leak or building collapse.',
    call: '101',
    callLabel: '101',
    icon: 'fa-fire-extinguisher',
    emoji: '🚒'
  }
];

export const SRV_CHIP_POS = [
  [4, 8],
  [26, 21],
  [4, 34],
  [26, 47],
  [4, 60],
  [26, 73],
  [4, 86]
];
