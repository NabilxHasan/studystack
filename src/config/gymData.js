/**
 * Gym routine: Sunday, Tuesday, Thursday. Tracked separately from the study streak.
 * Demo GIFs live in public/gym/, built from the public-domain free-exercise-db photos
 * (github.com/yuhonas/free-exercise-db).
 */

import { DAYS } from "./routineData";

export const GYM_DAYS = ["Sunday", "Tuesday", "Thursday"];

const gif = (name) => `${process.env.PUBLIC_URL || ""}/gym/${name}.gif`;

export const GYM_ROUTINE = [
  {
    id: "pushup",
    name: "Push-up",
    sets: 3,
    reps: "10",
    gif: gif("pushup"),
    cue: "Hands a bit wider than shoulders, body in one straight line. Chest almost to the floor, then press up."
  },
  {
    id: "lat-pulldown",
    name: "Lat pulldown",
    sets: 3,
    reps: "10",
    gif: gif("lat-pulldown"),
    cue: "Wide grip, lean back slightly, chest up. Pull the bar to your upper chest, elbows down and back. Slow on the way up."
  },
  {
    id: "overhead-extension",
    name: "Dumbbell overhead extension",
    sets: 3,
    reps: "15",
    gif: gif("overhead-extension"),
    cue: "One dumbbell in both hands overhead. Elbows stay close to your head; only the forearms move down behind it and back up."
  },
  {
    id: "ez-bar-curl",
    name: "EZ bar bicep curl",
    sets: 3,
    reps: "15",
    gif: gif("ez-bar-curl"),
    cue: "Elbows pinned to your sides. Curl to shoulder height, squeeze, lower under control. No swinging."
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight squat",
    sets: 3,
    reps: "12",
    gif: gif("bodyweight-squat"),
    cue: "Feet shoulder width. Sit the hips back, knees out, chest up. Go as deep as you can with heels down."
  },
  {
    id: "wrist-curl",
    name: "Wrist curl",
    sets: 2,
    reps: "15",
    gif: gif("wrist-curl"),
    cue: "Forearms on your thighs, palms up, wrists over the edge. Let the weight roll down, then curl it up with the wrist only."
  },
  {
    id: "cardio",
    name: "Cardio",
    sets: 1,
    reps: "10–15 min",
    gif: gif("cardio"),
    cue: "Running, cycling or cross trainer. Steady pace you can just about talk at."
  }
];

/** Same rule as study days: 70% of the exercises fully done counts the session. */
export const GYM_GOAL_RATE = 0.7;
export const GYM_EXERCISES_NEEDED = Math.ceil(GYM_ROUTINE.length * GYM_GOAL_RATE - 1e-9);

function parse(ds) {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isGymDay(ds) {
  return GYM_DAYS.includes(DAYS[parse(ds).getDay()]);
}

/** gymLog: { [date]: { [exerciseId]: setsDone } } */
export function gymDayStatus(ds, gymLog = {}) {
  const day = gymLog[ds] || {};
  const done = GYM_ROUTINE.filter((ex) => (day[ex.id] || 0) >= ex.sets).length;
  return {
    date: ds,
    isGymDay: isGymDay(ds),
    done,
    total: GYM_ROUTINE.length,
    needed: GYM_EXERCISES_NEEDED,
    isMet: done >= GYM_EXERCISES_NEEDED
  };
}

/** Next gym date strictly after `ds`. */
export function nextGymDate(ds) {
  const d = parse(ds);
  for (let i = 1; i <= 7; i++) {
    d.setDate(d.getDate() + 1);
    if (GYM_DAYS.includes(DAYS[d.getDay()])) return fmt(d);
  }
  return null;
}

/**
 * Gym streak counts gym sessions (Sun / Tue / Thu) in a row.
 * Other days are skipped. Today not done yet does not break it; a missed past gym day does.
 */
export function computeGymStreak(gymLog = {}, today) {
  const t = parse(today);
  const todayStatus = gymDayStatus(today, gymLog);
  let current = todayStatus.isGymDay && todayStatus.isMet ? 1 : 0;
  const d = new Date(t);
  for (let i = 0; i < 400; i++) {
    d.setDate(d.getDate() - 1);
    const ds = fmt(d);
    if (!isGymDay(ds)) continue;
    if (gymDayStatus(ds, gymLog).isMet) current += 1;
    else break;
  }

  const sessions = Object.keys(gymLog)
    .filter((ds) => /^\d{4}-\d{2}-\d{2}$/.test(ds) && isGymDay(ds) && gymDayStatus(ds, gymLog).isMet)
    .sort();
  let longest = current;
  let run = 0;
  let prev = null;
  sessions.forEach((ds) => {
    run = prev && nextGymDate(prev) === ds ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = ds;
  });

  // Last 6 gym days up to today, oldest first
  const recent = [];
  const c = new Date(t);
  while (recent.length < 6) {
    const ds = fmt(c);
    if (isGymDay(ds)) {
      const s = gymDayStatus(ds, gymLog);
      recent.unshift({
        dateStr: ds,
        dayShort: DAYS[c.getDay()].slice(0, 3),
        status: s.isMet ? "done" : ds === today ? "today" : "missed"
      });
    }
    c.setDate(c.getDate() - 1);
  }

  return { current, longest, total: sessions.length, today: todayStatus, recent };
}
