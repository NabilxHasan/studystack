/**
 * Academic-Focused Weekly Routine Configuration
 * Priority on core academic courses, DSA, OOP, and weekend Skill Gain
 */

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAYS_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const DAY_METADATA = {
  Sunday:    { tag: "REGULAR",    bgClass: "bg-sun", color: "#e11d48" },
  Monday:    { tag: "REGULAR",    bgClass: "bg-mon", color: "#2563eb" },
  Tuesday:   { tag: "REGULAR",    bgClass: "bg-tue", color: "#059669" },
  Wednesday: { tag: "REGULAR",    bgClass: "bg-wed", color: "#7c3aed" },
  Thursday:  { tag: "REGULAR",    bgClass: "bg-thu", color: "#d97706" },
  Friday:    { tag: "HOLIDAY",    bgClass: "bg-fri", color: "#0891b2" },
  Saturday:  { tag: "WEEKLY OFF", bgClass: "bg-sat", color: "#db2777" },
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
  "Skill Gain": {
    category: "skills",
    color: "#6366f1",
    borderClass: "c-skill",
    icon: "🛠️",
    defaultType: "lab"
  }
};

/**
 * Academic-priority routine:
 * - Sunday to Thursday: 100% Core Academics, DSA, OOP, and Revision
 * - Friday & Saturday: Academics + Weekend Skill Gain (CTF / Hackathon / Game Dev / GIMP / DaVinci)
 * - Flexible study blocks without arbitrary time limits
 */
export const DEFAULT_ROUTINE_SCHEDULE = [
  // SUNDAY (Academics Priority)
  {
    id: "sun-block-1",
    day: "Sunday",
    subject: "DSA",
    notes: "Academic / LeetCode / Codeforces",
    defaultTaskType: "self-study"
  },
  {
    id: "sun-block-2",
    day: "Sunday",
    subject: "OOP (Java)",
    notes: "Core Concepts & Practice",
    defaultTaskType: "lecture"
  },
  {
    id: "sun-block-3",
    day: "Sunday",
    subject: "Academic Revision",
    notes: "Weekly Concept Review",
    defaultTaskType: "revision"
  },

  // MONDAY (Academics Priority)
  {
    id: "mon-block-1",
    day: "Monday",
    subject: "Comp Architecture & Microprocessor",
    notes: "Architecture & Instruction Sets",
    defaultTaskType: "lecture"
  },
  {
    id: "mon-block-2",
    day: "Monday",
    subject: "Data Communication",
    notes: "Protocols & Signals",
    defaultTaskType: "lecture"
  },
  {
    id: "mon-block-3",
    day: "Monday",
    subject: "Academic Revision",
    notes: "Architecture & Data Comm Review",
    defaultTaskType: "revision"
  },

  // TUESDAY (Academics Priority)
  {
    id: "tue-block-1",
    day: "Tuesday",
    subject: "DSA",
    notes: "Academic / LeetCode / Codeforces",
    defaultTaskType: "self-study"
  },
  {
    id: "tue-block-2",
    day: "Tuesday",
    subject: "Physics",
    notes: "Core Theory & Problems",
    defaultTaskType: "lecture"
  },
  {
    id: "tue-block-3",
    day: "Tuesday",
    subject: "Academic Revision",
    notes: "Physics & DSA Problem Sets",
    defaultTaskType: "revision"
  },

  // WEDNESDAY (Academics Priority)
  {
    id: "wed-block-1",
    day: "Wednesday",
    subject: "EEE",
    notes: "Circuits & Electrical Analysis",
    defaultTaskType: "lecture"
  },
  {
    id: "wed-block-2",
    day: "Wednesday",
    subject: "Calculus",
    notes: "Differentiation & Integrals",
    defaultTaskType: "lecture"
  },
  {
    id: "wed-block-3",
    day: "Wednesday",
    subject: "Academic Revision",
    notes: "Math & Electrical Formulas",
    defaultTaskType: "revision"
  },

  // THURSDAY (Academics Priority)
  {
    id: "thu-block-1",
    day: "Thursday",
    subject: "DSA",
    notes: "Academic / LeetCode / Codeforces",
    defaultTaskType: "self-study"
  },
  {
    id: "thu-block-2",
    day: "Thursday",
    subject: "OOP (Java)",
    notes: "Object-Oriented Design & Lab",
    defaultTaskType: "lecture"
  },
  {
    id: "thu-block-3",
    day: "Thursday",
    subject: "Academic Revision",
    notes: "OOP & DSA Problem Sets",
    defaultTaskType: "revision"
  },

  // FRIDAY (Holiday - Academics + Weekend Skill Gain)
  {
    id: "fri-block-1",
    day: "Friday",
    subject: "Comp Architecture & Microprocessor",
    notes: "Microprocessor Lab & Assembly",
    defaultTaskType: "lecture"
  },
  {
    id: "fri-block-2",
    day: "Friday",
    subject: "Data Communication",
    notes: "Network Layers & Transmission",
    defaultTaskType: "lecture"
  },
  {
    id: "fri-block-3",
    day: "Friday",
    subject: "Physics",
    notes: "Theory & Problem Sets",
    defaultTaskType: "lecture"
  },
  {
    id: "fri-block-4",
    day: "Friday",
    subject: "Skill Gain",
    notes: "CTF / Hackathon / Game Dev / GIMP / DaVinci",
    defaultTaskType: "lab"
  },

  // SATURDAY (Weekly Off - Academics + Weekend Skill Gain)
  {
    id: "sat-block-1",
    day: "Saturday",
    subject: "DSA",
    notes: "Academic / LeetCode / Codeforces",
    defaultTaskType: "self-study"
  },
  {
    id: "sat-block-2",
    day: "Saturday",
    subject: "EEE",
    notes: "Circuit Analysis & AC/DC",
    defaultTaskType: "lecture"
  },
  {
    id: "sat-block-3",
    day: "Saturday",
    subject: "Calculus",
    notes: "Problem Sets & Series",
    defaultTaskType: "lecture"
  },
  {
    id: "sat-block-4",
    day: "Saturday",
    subject: "Skill Gain",
    notes: "CTF / Hackathon / Game Dev / GIMP / DaVinci",
    defaultTaskType: "lab"
  }
];

export const DSA_BREAKDOWN = {
  sessions: 4,
  days: ["Sunday", "Tuesday", "Thursday", "Saturday"],
  distribution: [
    { title: "Academic DSA", percent: 50, color: "#f43f5e" },
    { title: "LeetCode Practice", percent: 30, color: "#10b981" },
    { title: "Codeforces Practice", percent: 20, color: "#38bdf8" }
  ]
};

export const EXECUTION_GUIDELINES = [
  { id: 1, header: "Academics Priority:", desc: "Weekdays (Sun–Thu) are 100% focused on core academic courses, DSA, and OOP." },
  { id: 2, header: "DSA Consistency:", desc: "Consistent sessions across Sun, Tue, Thu, Sat (Academic + LeetCode + Codeforces)." },
  { id: 3, header: "OOP (Java):", desc: "Solidify Java, OOP fundamentals, design patterns, and lab tasks." },
  { id: 4, header: "Academic Revision:", desc: "Dedicated daily revision blocks for deep conceptual retention and exam readiness." },
  { id: 5, header: "Weekend Skill Gain:", desc: "Fridays & Saturdays dedicated to applied skills: CTF / Hackathon / Game Dev / GIMP / DaVinci." }
];

export const MOTTO = {
  growth: "BALANCED ROUTINE & STEADY ACADEMIC GROWTH",
  phil: "Plan > Execute > Review > Improve",
  motto: "Stay Consistent, Stay Ahead!",
  dedication: "You've got this, Nabil! ★"
};
