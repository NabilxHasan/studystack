/**
 * 52-Hour Weekly Routine Configuration
 * Scraped and standardized from https://routine-5c70ac.tiiny.site/
 */

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAYS_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const DAY_METADATA = {
  Sunday:    { tag: "REGULAR",    totalHours: 8, bgClass: "bg-sun", color: "#e11d48" },
  Monday:    { tag: "REGULAR",    totalHours: 7, bgClass: "bg-mon", color: "#2563eb" },
  Tuesday:   { tag: "REGULAR",    totalHours: 7, bgClass: "bg-tue", color: "#059669" },
  Wednesday: { tag: "REGULAR",    totalHours: 7, bgClass: "bg-wed", color: "#7c3aed" },
  Thursday:  { tag: "REGULAR",    totalHours: 7, bgClass: "bg-thu", color: "#d97706" },
  Friday:    { tag: "HOLIDAY",    totalHours: 8, bgClass: "bg-fri", color: "#0891b2" },
  Saturday:  { tag: "WEEKLY OFF", totalHours: 8, bgClass: "bg-sat", color: "#db2777" },
};

export const SUBJECT_THEMES = {
  "DSA": {
    category: "dsa",
    color: "#f43f5e",
    borderClass: "c-dsa",
    icon: "⚡",
    defaultType: "self-study"
  },
  "OOP (Java)": {
    category: "academics",
    color: "#10b981",
    borderClass: "c-oop",
    icon: "☕",
    defaultType: "lecture"
  },
  "Comp Architecture & Microprocessor": {
    category: "academics",
    color: "#38bdf8",
    borderClass: "c-arch",
    icon: "💻",
    defaultType: "lecture"
  },
  "Data Communication": {
    category: "academics",
    color: "#06b6d4",
    borderClass: "c-datacom",
    icon: "📡",
    defaultType: "lecture"
  },
  "Physics": {
    category: "academics",
    color: "#38bdf8",
    borderClass: "c-phy",
    icon: "⚛️",
    defaultType: "lecture"
  },
  "EEE": {
    category: "academics",
    color: "#a855f7",
    borderClass: "c-eee",
    icon: "🔌",
    defaultType: "lecture"
  },
  "Calculus": {
    category: "academics",
    color: "#38bdf8",
    borderClass: "c-calc",
    icon: "📐",
    defaultType: "lecture"
  },
  "Academic Revision": {
    category: "revision",
    color: "#8b5cf6",
    borderClass: "c-rev",
    icon: "🔄",
    defaultType: "revision"
  },
  "Boot.dev": {
    category: "backend",
    color: "#f97316",
    borderClass: "c-boot",
    icon: "🚀",
    defaultType: "self-study"
  },
  "CTF": {
    category: "security",
    color: "#6366f1",
    borderClass: "c-ctf",
    icon: "🚩",
    defaultType: "lab"
  },
  "AI Hackathon": {
    category: "ai",
    color: "#ec4899",
    borderClass: "c-hack",
    icon: "🤖",
    defaultType: "lab"
  },
  "GameDev": {
    category: "gamedev",
    color: "#10b981",
    borderClass: "c-game",
    icon: "🎮",
    defaultType: "lab"
  },
  "GIMP / DaVinci": {
    category: "creative",
    color: "#f59e0b",
    borderClass: "c-gimp",
    icon: "🎨",
    defaultType: "lab"
  }
};

/**
 * Baseline 52-hour weekly routine parsed from https://routine-5c70ac.tiiny.site/
 */
export const DEFAULT_ROUTINE_SCHEDULE = [
  // SUNDAY (8 Hours)
  {
    id: "sun-block-1",
    day: "Sunday",
    subject: "DSA",
    allocatedDurationMinutes: 120,
    notes: "2 hours (Academic + LC + CF)",
    defaultTaskType: "self-study"
  },
  {
    id: "sun-block-2",
    day: "Sunday",
    subject: "OOP (Java)",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "sun-block-3",
    day: "Sunday",
    subject: "Academic Revision",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "revision"
  },
  {
    id: "sun-block-4",
    day: "Sunday",
    subject: "CTF",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "lab"
  },
  {
    id: "sun-block-5",
    day: "Sunday",
    subject: "Boot.dev",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "self-study"
  },

  // MONDAY (7 Hours)
  {
    id: "mon-block-1",
    day: "Monday",
    subject: "Comp Architecture & Microprocessor",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "mon-block-2",
    day: "Monday",
    subject: "Data Communication",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "mon-block-3",
    day: "Monday",
    subject: "AI Hackathon",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "lab"
  },
  {
    id: "mon-block-4",
    day: "Monday",
    subject: "GameDev",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "lab"
  },
  {
    id: "mon-block-5",
    day: "Monday",
    subject: "Boot.dev",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "self-study"
  },

  // TUESDAY (7 Hours)
  {
    id: "tue-block-1",
    day: "Tuesday",
    subject: "DSA",
    allocatedDurationMinutes: 120,
    notes: "2 hours (Academic + LC + CF)",
    defaultTaskType: "self-study"
  },
  {
    id: "tue-block-2",
    day: "Tuesday",
    subject: "Physics",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "tue-block-3",
    day: "Tuesday",
    subject: "GameDev",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "lab"
  },
  {
    id: "tue-block-4",
    day: "Tuesday",
    subject: "GIMP / DaVinci",
    allocatedDurationMinutes: 60,
    notes: "1 hour (Either One)",
    defaultTaskType: "lab"
  },
  {
    id: "tue-block-5",
    day: "Tuesday",
    subject: "Boot.dev",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "self-study"
  },

  // WEDNESDAY (7 Hours)
  {
    id: "wed-block-1",
    day: "Wednesday",
    subject: "EEE",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "wed-block-2",
    day: "Wednesday",
    subject: "Calculus",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "wed-block-3",
    day: "Wednesday",
    subject: "Academic Revision",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "revision"
  },
  {
    id: "wed-block-4",
    day: "Wednesday",
    subject: "CTF",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "lab"
  },

  // THURSDAY (7 Hours)
  {
    id: "thu-block-1",
    day: "Thursday",
    subject: "DSA",
    allocatedDurationMinutes: 120,
    notes: "2 hours (Academic + LC + CF)",
    defaultTaskType: "self-study"
  },
  {
    id: "thu-block-2",
    day: "Thursday",
    subject: "OOP (Java)",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "thu-block-3",
    day: "Thursday",
    subject: "AI Hackathon",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "lab"
  },
  {
    id: "thu-block-4",
    day: "Thursday",
    subject: "GIMP / DaVinci",
    allocatedDurationMinutes: 60,
    notes: "1 hour (Either One)",
    defaultTaskType: "lab"
  },
  {
    id: "thu-block-5",
    day: "Thursday",
    subject: "Boot.dev",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "self-study"
  },

  // FRIDAY (8 Hours - Public Holiday)
  {
    id: "fri-block-1",
    day: "Friday",
    subject: "Comp Architecture & Microprocessor",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "fri-block-2",
    day: "Friday",
    subject: "Data Communication",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "fri-block-3",
    day: "Friday",
    subject: "Physics",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "fri-block-4",
    day: "Friday",
    subject: "AI Hackathon",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "lab"
  },
  {
    id: "fri-block-5",
    day: "Friday",
    subject: "CTF",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "lab"
  },

  // SATURDAY (8 Hours - Weekly Off)
  {
    id: "sat-block-1",
    day: "Saturday",
    subject: "DSA",
    allocatedDurationMinutes: 120,
    notes: "2 hours (Academic + LC + CF)",
    defaultTaskType: "self-study"
  },
  {
    id: "sat-block-2",
    day: "Saturday",
    subject: "EEE",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "sat-block-3",
    day: "Saturday",
    subject: "Calculus",
    allocatedDurationMinutes: 120,
    notes: "2 hours",
    defaultTaskType: "lecture"
  },
  {
    id: "sat-block-4",
    day: "Saturday",
    subject: "GameDev",
    allocatedDurationMinutes: 60,
    notes: "1 hour",
    defaultTaskType: "lab"
  },
  {
    id: "sat-block-5",
    day: "Saturday",
    subject: "GIMP / DaVinci",
    allocatedDurationMinutes: 60,
    notes: "1 hour (Either One)",
    defaultTaskType: "lab"
  }
];

export const DSA_BREAKDOWN = {
  totalHours: 8,
  sessions: 4,
  days: ["Sunday", "Tuesday", "Thursday", "Saturday"],
  distribution: [
    { title: "Academic DSA", percent: 50, hoursTotal: 4, perSession: "60m", color: "#f43f5e" },
    { title: "LeetCode Practice", percent: 30, hoursTotal: 2.4, perSession: "36m", color: "#10b981" },
    { title: "Codeforces Practice", percent: 20, hoursTotal: 1.6, perSession: "24m", color: "#38bdf8" }
  ]
};

export const EXECUTION_GUIDELINES = [
  { id: 1, header: "Academics First:", desc: "Understand concepts thoroughly and complete assignments promptly." },
  { id: 2, header: "DSA (Double):", desc: "8 hours weekly across 4 consistent sessions (Sun / Tue / Thu / Sat)." },
  { id: 3, header: "Boot.dev Track:", desc: "4 hours weekly (Sun, Mon, Tue, Thu) for backend & CS mastery." },
  { id: 4, header: "Applied Skills:", desc: "CTF, AI Hackathon & GameDev (3h each) for active project builds." },
  { id: 5, header: "Creative Track:", desc: "GIMP / DaVinci (3h total). Pick design or video editing." },
  { id: 6, header: "Revision:", desc: "4 mandatory hours weekly. Active retrieval locks memory long term." }
];

export const MOTTO = {
  growth: "52 HOURS/WEEK = BALANCED GROWTH",
  phil: "Plan > Execute > Review > Improve",
  motto: "Stay Consistent, Stay Ahead!",
  dedication: "You've got this, Nabil! ★"
};
