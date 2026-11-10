/**
 * Weekly study routine built around the university class timetable (2nd year, 1st semester).
 *
 * - UNI_CLASSES: fixed class slots (information only, shown on the Today screen).
 * - DEFAULT_ROUTINE_SCHEDULE: flexible self-study blocks for after class. No durations.
 *   Every day ends with one Cyber Security Roadmap block.
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
    { time: "10:15–12:45", code: "CSE-2106", subject: "Microprocessor Lab", room: "706", group: "GB" },
    { time: "1:20–4:00", code: "CSE-2106", subject: "Microprocessor Lab", room: "709", group: "GA" }
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
 */
export const DEFAULT_ROUTINE_SCHEDULE = [
  // SUNDAY — OOP theory + lab in class
  block("Sunday", 1, "OOP", "Rewrite today's lecture + finish the lab task", "review"),
  block("Sunday", 2, "Calculus", "Get ahead before Monday's class", "review"),
  roadmapBlock("Sunday", "Evening slot, after the academic blocks"),

  // MONDAY — DataCom, Microprocessor, Calculus in class
  block("Monday", 1, "Data Communication", "Revise today's lecture", "review"),
  block("Monday", 2, "Microprocessor", "Revise today's lecture, prep for Tuesday's lab", "review"),
  roadmapBlock("Monday", "Evening slot, after the academic blocks"),

  // TUESDAY — only the Microprocessor lab, lightest uni day
  block("Tuesday", 1, "Microprocessor", "Write up the lab while it is fresh", "review"),
  block("Tuesday", 2, "DSA", "Problem solving before Wednesday's class", "practice"),
  block("Tuesday", 3, "Physics", "Backlog: clear one chapter section", "backlog"),
  roadmapBlock("Tuesday", "Free afternoon or evening, longest weekday slot"),

  // WEDNESDAY — DataCom, Microprocessor, DSA in class
  block("Wednesday", 1, "Data Communication", "Revise today's lecture", "review"),
  block("Wednesday", 2, "DSA", "Revise today's lecture, prep for Thursday's lab", "review"),
  roadmapBlock("Wednesday", "Evening slot, after the academic blocks"),

  // THURSDAY — 9:00 to 4:00 in class, keep the evening short
  block("Thursday", 1, "OOP", "Revise today's lecture", "review"),
  block("Thursday", 2, "Calculus", "Revise today's lecture, solve the exercise set", "review"),
  roadmapBlock("Thursday", "Short night slot, one topic is enough"),

  // FRIDAY — no classes
  block("Friday", 1, "Physics", "Backlog: theory + problem set", "backlog"),
  block("Friday", 2, "EEE", "Backlog: circuits + problem set", "backlog"),
  block("Friday", 3, "DSA", "Problem solving", "practice"),
  roadmapBlock("Friday", "Long slot, go deep"),

  // SATURDAY — no classes
  block("Saturday", 1, "EEE", "Backlog: theory + problem set", "backlog"),
  block("Saturday", 2, "Calculus", "Problem sets, close the week's gaps", "practice"),
  roadmapBlock("Saturday", "Long slot, go deep")
];

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
