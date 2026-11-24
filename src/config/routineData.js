/**
 * Weekly study routine built around the university class timetable (2nd year, 1st semester).
 *
 * - UNI_CLASSES: fixed class slots (information only, shown on the Today screen).
 * - DEFAULT_ROUTINE_SCHEDULE: flexible self-study blocks for after class. No durations.
 *   The Cyber Security Roadmap gets one long block, on Friday.
 * - Exam prep: a per-date override that replaces that day's blocks with one subject.
 */

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAYS_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const ROADMAP_SUBJECT = "Cyber Security Roadmap";

export const DAY_METADATA = {
  Sunday:    { tag: "CLASS DAY" },
  Monday:    { tag: "CLASS DAY" },
  Tuesday:   { tag: "LAB DAY" },
  Wednesday: { tag: "CLASS DAY" },
  Thursday:  { tag: "LONG DAY" },
  Friday:    { tag: "DEEP WORK" },
  Saturday:  { tag: "DEEP WORK" }
};

/** Course code → subject, from the university routine. */
export const COURSES = {
  "CSE-2101": "DSA",
  "CSE-2102": "DSA Lab",
  "CSE-2103": "OOP",
  "CSE-2104": "OOP Lab",
  "CSE-2105": "Microprocessor",
  "CSE-2106": "Microprocessor Lab",
  "CSE-2109": "Data Communication",
  "MATH-2107": "Calculus"
};

export const SUBJECT_THEMES = {
  "DSA":                { color: "#ff5d73", short: "DSA" },
  "OOP":                { color: "#34d399", short: "OOP" },
  "Microprocessor":     { color: "#38bdf8", short: "MPU" },
  "Data Communication": { color: "#22d3ee", short: "DCOM" },
  "Calculus":           { color: "#fbbf24", short: "CALC" },
  "Physics":            { color: "#a78bfa", short: "PHY" },
  "EEE":                { color: "#f472b6", short: "EEE" },
  "DLD":                { color: "#fb923c", short: "DLD" },
  "Physio practice":    { color: "#2dd4bf", short: "PHYSIO" },
  "Gym":                { color: "#e5e7eb", short: "GYM" },
  [ROADMAP_SUBJECT]:    { color: "#c6f432", short: "SEC" }
};

/** Fixed university classes. Friday and Saturday are off. */
export const UNI_CLASSES = {
  Sunday: [
    { time: "9:00–10:15", code: "CSE-2103", subject: "OOP" },
    { time: "10:15–12:45", code: "CSE-2104", subject: "OOP Lab", room: "706" }
  ],
  Monday: [
    { time: "9:00–10:15", code: "CSE-2109", subject: "Data Communication" },
    { time: "10:15–11:30", code: "CSE-2105", subject: "Microprocessor" },
    { time: "11:35–12:45", code: "MATH-2107", subject: "Calculus" }
  ],
  Tuesday: [
    // Group B slot (Group A has the 1:20–4:00 lab in #709)
    { time: "10:15–12:45", code: "CSE-2106", subject: "Microprocessor Lab", room: "706", group: "GB" }
  ],
  Wednesday: [
    { time: "9:00–10:15", code: "CSE-2109", subject: "Data Communication" },
    { time: "10:15–11:30", code: "CSE-2105", subject: "Microprocessor" },
    { time: "11:35–12:45", code: "CSE-2101", subject: "DSA" }
  ],
  Thursday: [
    { time: "9:00–10:15", code: "CSE-2101", subject: "DSA" },
    { time: "10:15–11:30", code: "MATH-2107", subject: "Calculus" },
    { time: "11:35–12:45", code: "CSE-2103", subject: "OOP" },
    { time: "1:20–4:00", code: "CSE-2102", subject: "DSA Lab", room: "707" }
  ],
  Friday: [],
  Saturday: []
};

function block(day, n, subject, notes, kind) {
  return { id: `${day.slice(0, 3).toLowerCase()}-s${n}`, day, subject, notes, kind };
}
function gymBlock(day) {
  return {
    id: `${day.slice(0, 3).toLowerCase()}-gym`,
    day,
    subject: "Gym",
    notes: "Push-ups, pulldown, arms, squats, cardio. Log your sets on the Gym page.",
    kind: "gym"
  };
}
function physioBlock(day) {
  return {
    id: `${day.slice(0, 3).toLowerCase()}-physio`,
    day,
    subject: "Physio practice",
    notes: "Your physio exercises. Non-gym day, so don't skip it.",
    kind: "physio"
  };
}
function roadmapBlock(day, notes) {
  return {
    id: `${day.slice(0, 3).toLowerCase()}-roadmap`,
    day,
    subject: ROADMAP_SUBJECT,
    notes,
    kind: "roadmap"
  };
}

/**
 * kind: "review"  → revise what was taught in class
 *       "practice"→ problem solving
 *       "backlog" → backlog course (Physics, EEE)
 *       "roadmap" → cyber security roadmap slot
 *       "physio"  → physio practice, on non-gym days (counts like a study block)
 *       "gym"     → reminder on gym days (Sun/Tue/Thu); ticks itself from the Gym page,
 *                   does not count toward the study streak (gym has its own streak)
 */
export const DEFAULT_ROUTINE_SCHEDULE = [
  // SUNDAY — OOP theory + lab in class
  block("Sunday", 1, "OOP", "Rewrite today's lecture + finish the lab task", "review"),
  block("Sunday", 2, "Calculus", "Get ahead before Monday's class", "review"),
  block("Sunday", 3, "DLD", "Backlog: one topic + its problems", "backlog"),
  gymBlock("Sunday"),

  // MONDAY — DataCom, Microprocessor, Calculus in class
  block("Monday", 1, "Data Communication", "Revise today's lecture", "review"),
  block("Monday", 2, "Microprocessor", "Revise today's lecture, prep for Tuesday's lab", "review"),
  physioBlock("Monday"),

  // TUESDAY — only the Microprocessor lab, lightest uni day
  block("Tuesday", 1, "Microprocessor", "Write up the lab while it is fresh", "review"),
  block("Tuesday", 2, "DSA", "Problem solving before Wednesday's class", "practice"),
  block("Tuesday", 3, "Physics", "Backlog: clear one chapter section", "backlog"),
  gymBlock("Tuesday"),

  // WEDNESDAY — DataCom, Microprocessor, DSA in class
  block("Wednesday", 1, "Data Communication", "Revise today's lecture", "review"),
  block("Wednesday", 2, "DSA", "Revise today's lecture, prep for Thursday's lab", "review"),
  physioBlock("Wednesday"),

  // THURSDAY — 9:00 to 4:00 in class, keep the evening short
  block("Thursday", 1, "OOP", "Revise today's lecture", "review"),
  block("Thursday", 2, "Calculus", "Revise today's lecture, solve the exercise set", "review"),
  gymBlock("Thursday"),

  // FRIDAY — no classes
  block("Friday", 1, "Physics", "Backlog: theory + problem set", "backlog"),
  block("Friday", 2, "EEE", "Backlog: circuits + problem set", "backlog"),
  block("Friday", 3, "DSA", "Problem solving", "practice"),
  roadmapBlock("Friday", "Your one roadmap day: long slot, go deep"),
  physioBlock("Friday"),

  // SATURDAY — no classes
  block("Saturday", 1, "EEE", "Backlog: theory + problem set", "backlog"),
  block("Saturday", 2, "Calculus", "Problem sets, close the week's gaps", "practice"),
  block("Saturday", 3, "DLD", "Backlog: theory + problem set", "backlog"),
  physioBlock("Saturday")
];

/** Blocks that count toward the study streak (the gym reminder does not). */
export function isStudyBlock(t) {
  return !!t && t.kind !== "gym";
}

/** Ids/subjects that only existed in older default schedules. Used to migrate saved data. */
export function isLegacySchedule(schedule) {
  if (!Array.isArray(schedule)) return true;
  return schedule.some(
    (t) =>
      !t ||
      /-block-\d+$/.test(t.id || "") ||
      ["Boot.dev", "Skill Gain", "CTF", "AI Hackathon", "Academic Revision"].includes(t.subject) ||
      t.allocatedDurationMinutes
  );
}

/** Older default routine shapes that should be replaced by the current default. */
export function needsMigration(schedule) {
  if (isLegacySchedule(schedule)) return true;
  // v5 default had a roadmap block every day; it now lives on Friday only
  if (schedule.some((t) => /^(sun|mon|tue|wed|thu|sat)-roadmap$/.test(t.id || ""))) return true;
  // gym reminders and physio practice were added later
  return !schedule.some((t) => /-(gym|physio)$/.test(t.id || ""));
}

/** Current default routine plus any blocks the user added themselves. */
export function migrateSchedule(schedule) {
  const custom = Array.isArray(schedule)
    ? schedule.filter((t) => t && String(t.id || "").startsWith("custom-"))
    : [];
  return [...DEFAULT_ROUTINE_SCHEDULE, ...custom];
}

/** Subjects offered in exam prep mode. */
export const EXAM_SUBJECTS = [
  "DSA",
  "OOP",
  "Microprocessor",
  "Data Communication",
  "Calculus",
  "Physics",
  "EEE",
  "DLD"
];

/** One completed exam-prep session counts the day. */
export const EXAM_SESSIONS_NEEDED = 1;

export function examTasksForDate(date, subject) {
  return [
    { n: 1, notes: "Concepts and notes: go through the whole syllabus once" },
    { n: 2, notes: "Practice problems: work every type that can come" },
    { n: 3, notes: "Past questions, then final revision of weak spots" }
  ].map(({ n, notes }) => ({
    id: `exam-${date}-${n}`,
    day: null,
    subject,
    notes,
    kind: "exam"
  }));
}

/** Blocks for a calendar date: the exam override if one is set, otherwise the weekday routine. */
export function tasksForDate(date, schedule = [], overrides = {}) {
  const ov = overrides && overrides[date];
  if (ov && ov.subject) return examTasksForDate(date, ov.subject);
  const [y, m, d] = date.split("-").map(Number);
  const dayName = DAYS[new Date(y, m - 1, d).getDay()];
  return schedule.filter((t) => t.day === dayName);
}
