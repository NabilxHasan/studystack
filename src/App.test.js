import React from 'react';
import { render, screen } from '@testing-library/react';
import { DAYS, DEFAULT_ROUTINE_SCHEDULE, ROADMAP_SUBJECT, UNI_CLASSES, COURSES, isLegacySchedule, needsMigration, migrateSchedule, tasksForDate } from './config/routineData';
import { ROADMAP, ROADMAP_ITEMS, roadmapStats } from './config/roadmapData';
import {
  saveRoutineSchedule,
  loadRoutineSchedule,
  saveDailyTaskStates,
  loadDailyTaskStates,
  saveActiveTimerSession,
  loadActiveTimerSession,
  clearActiveTimerSession,
  saveRoadmapProgress,
  loadRoadmapProgress,
  saveDayOverrides,
  loadDayOverrides,
  dateStr
} from './utils/storage';
import { isDayGoalMet, computeStreakMetrics } from './utils/streakEngine';
import App from './App';
import { GYM_ROUTINE, GYM_DAYS, isGymDay, gymDayStatus, computeGymStreak, nextGymDate } from './config/gymData';

describe('StudyStack Routine Configuration', () => {
  test('every day has study blocks and the roadmap lives on Friday only', () => {
    expect(DAYS).toHaveLength(7);
    DAYS.forEach((day) => {
      const dayTasks = DEFAULT_ROUTINE_SCHEDULE.filter(t => t.day === day);
      expect(dayTasks.length).toBeGreaterThanOrEqual(2);
    });
    const roadmapDays = DEFAULT_ROUTINE_SCHEDULE.filter(t => t.subject === ROADMAP_SUBJECT).map(t => t.day);
    expect(roadmapDays).toEqual(["Friday"]);
    const ids = DEFAULT_ROUTINE_SCHEDULE.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('covers all current courses and both backlogs, with no dropped skills', () => {
    const subjects = new Set(DEFAULT_ROUTINE_SCHEDULE.map(t => t.subject));
    ["OOP", "Data Communication", "Microprocessor", "DSA", "Calculus", "Physics", "EEE", "DLD"].forEach((s) => {
      expect(DEFAULT_ROUTINE_SCHEDULE.filter(t => t.subject === s).length).toBeGreaterThanOrEqual(2);
    });
    ["Boot.dev", "Skill Gain", "Academic Revision"].forEach((s) => expect(subjects.has(s)).toBe(false));
    expect(isLegacySchedule(DEFAULT_ROUTINE_SCHEDULE)).toBe(false);
    expect(isLegacySchedule([{ id: "mon-block-3", day: "Monday", subject: "Boot.dev" }])).toBe(true);
    // DLD is a backlog, same as Physics and EEE
    DEFAULT_ROUTINE_SCHEDULE.filter(t => ["Physics", "EEE", "DLD"].includes(t.subject))
      .forEach(t => expect(t.kind).toBe("backlog"));
  });

  test('old routines migrate to the current default and keep custom blocks', () => {
    const custom = { id: "custom-1", day: "Monday", subject: "Gym", kind: "custom" };
    const v5 = [{ id: "sun-roadmap", day: "Sunday", subject: ROADMAP_SUBJECT }, custom];
    expect(needsMigration(v5)).toBe(true);
    expect(needsMigration(DEFAULT_ROUTINE_SCHEDULE)).toBe(false);
    expect(needsMigration([...DEFAULT_ROUTINE_SCHEDULE, custom])).toBe(false);
    const migrated = migrateSchedule(v5);
    expect(migrated).toHaveLength(DEFAULT_ROUTINE_SCHEDULE.length + 1);
    expect(migrated.find(t => t.id === "custom-1")).toEqual(custom);
  });

  test('university timetable matches the class routine', () => {
    expect(UNI_CLASSES.Friday).toHaveLength(0);
    expect(UNI_CLASSES.Saturday).toHaveLength(0);
    expect(UNI_CLASSES.Monday.map(c => c.code)).toEqual(["CSE-2109", "CSE-2105", "MATH-2107"]);
    expect(UNI_CLASSES.Thursday.map(c => c.code)).toEqual(["CSE-2101", "MATH-2107", "CSE-2103", "CSE-2102"]);
    Object.values(UNI_CLASSES).flat().forEach((c) => expect(COURSES[c.code]).toBe(c.subject));
  });
});

describe('Cyber Security Roadmap', () => {
  test('has unique topic ids and the six core phases', () => {
    const ids = ROADMAP_ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ROADMAP.filter(p => !p.optional).map(p => p.title)).toEqual([
      "Fundamental IT Skills",
      "Operating Systems",
      "Networking Knowledge",
      "Security Skills and Knowledge",
      "Cloud Skills and Knowledge",
      "Programming Skills"
    ]);
    expect(ids.length).toBeGreaterThan(250);
  });

  test('progress stats count completed core topics and point at the next one', () => {
    const empty = roadmapStats({});
    expect(empty.done).toBe(0);
    expect(empty.next.id).toBe(ROADMAP_ITEMS[0].id);
    const one = roadmapStats({ [ROADMAP_ITEMS[0].id]: true });
    expect(one.done).toBe(1);
    expect(one.next.id).toBe(ROADMAP_ITEMS[1].id);
  });

  test('roadmap progress persists', () => {
    localStorage.clear();
    saveRoadmapProgress({ "it.core.x": true });
    expect(loadRoadmapProgress()).toEqual({ "it.core.x": true });
  });
});

describe('StudyStack Storage Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('loads default schedule if localStorage empty', () => {
    const routine = loadRoutineSchedule();
    expect(routine).toHaveLength(DEFAULT_ROUTINE_SCHEDULE.length);
  });

  test('persists and retrieves daily task states', () => {
    const today = dateStr();
    const states = { "sun_1": { status: "completed" }, "sun_2": { status: "in-progress" } };
    saveDailyTaskStates(today, states);
    const retrieved = loadDailyTaskStates(today);
    expect(retrieved).toEqual(states);
  });

  test('saves, restores, and clears active timer session', () => {
    const session = {
      taskId: "sun_1",
      subject: "Data Structures & Algorithms (Core)",
      targetSeconds: 7200,
      elapsedSeconds: 600,
      remainingSeconds: 6600,
      isPaused: true
    };
    saveActiveTimerSession(session);
    const restored = loadActiveTimerSession();
    expect(restored.taskId).toBe("sun_1");
    expect(restored.elapsedSeconds).toBe(600);

    clearActiveTimerSession();
    expect(loadActiveTimerSession()).toBeNull();
  });
});

describe('StudyStack Streak Engine', () => {
  test('qualifies goal met via >= 70% task completion', () => {
    const today = dateStr();
    const dayName = DAYS[new Date().getDay()];
    const dayTasks = DEFAULT_ROUTINE_SCHEDULE.filter(t => t.day === dayName);

    // Mark all tasks for today completed
    const dailyStates = {
      [today]: dayTasks.reduce((acc, t) => {
        acc[t.id] = { status: 'completed' };
        return acc;
      }, {})
    };

    const result = isDayGoalMet(today, DEFAULT_ROUTINE_SCHEDULE, dailyStates, {});
    expect(result.isMet).toBe(true);
    expect(result.taskCompletionRate).toBe(1);
  });

  test('qualifies goal met via >= 3 hours (10800s) study time even if 0 tasks completed', () => {
    const today = dateStr();
    const dailyStates = { [today]: {} };
    const studyLog = { [today]: 10800 };

    const result = isDayGoalMet(today, DEFAULT_ROUTINE_SCHEDULE, dailyStates, studyLog);
    expect(result.isMet).toBe(true);
    expect(result.secondsStudied).toBe(10800);
  });

  test('streak increments on consecutive successful days', () => {
    const today = new Date();
    const todayStr = dateStr(today);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = dateStr(yesterday);

    // Study log with 3.5 hours for both days
    const studyLog = {
      [todayStr]: 12600,
      [yesterdayStr]: 12600
    };

    const metrics = computeStreakMetrics({
      routineSchedule: DEFAULT_ROUTINE_SCHEDULE,
      allDailyStates: {},
      studyLog
    });

    expect(metrics.currentStreak).toBe(2);
    expect(metrics.totalDays).toBe(2);
    expect(metrics.week).toHaveLength(7);
  });
});

describe('Exam prep override', () => {
  test('replaces the day with one subject and one session counts the day', () => {
    const today = dateStr();
    const overrides = { [today]: { subject: "DSA" } };
    const tasks = tasksForDate(today, DEFAULT_ROUTINE_SCHEDULE, overrides);
    expect(tasks).toHaveLength(3);
    tasks.forEach(t => expect(t.subject).toBe("DSA"));

    const notYet = isDayGoalMet(today, DEFAULT_ROUTINE_SCHEDULE, {}, {}, overrides);
    expect(notYet.isExam).toBe(true);
    expect(notYet.isMet).toBe(false);

    const states = { [today]: { [tasks[0].id]: { status: "completed" } } };
    const done = isDayGoalMet(today, DEFAULT_ROUTINE_SCHEDULE, states, {}, overrides);
    expect(done.isMet).toBe(true);
    expect(computeStreakMetrics({ routineSchedule: DEFAULT_ROUTINE_SCHEDULE, allDailyStates: states, studyLog: {}, overrides }).currentStreak).toBeGreaterThanOrEqual(1);
  });

  test('normal blocks done on an exam day do not count for it', () => {
    const today = dateStr();
    const dayName = DAYS[new Date().getDay()];
    const normal = DEFAULT_ROUTINE_SCHEDULE.filter(t => t.day === dayName);
    const states = { [today]: Object.fromEntries(normal.map(t => [t.id, { status: "completed" }])) };
    const r = isDayGoalMet(today, DEFAULT_ROUTINE_SCHEDULE, states, {}, { [today]: { subject: "Calculus" } });
    expect(r.isMet).toBe(false);
  });

  test('overrides persist', () => {
    localStorage.clear();
    saveDayOverrides({ "2026-11-25": { subject: "EEE" } });
    expect(loadDayOverrides()).toEqual({ "2026-11-25": { subject: "EEE" } });
  });
});

describe('Gym and physio blocks', () => {
  test('gym reminder on Sun/Tue/Thu, physio on every other day', () => {
    DAYS.forEach((day) => {
      const kinds = DEFAULT_ROUTINE_SCHEDULE.filter(t => t.day === day).map(t => t.kind);
      const gymDay = ["Sunday", "Tuesday", "Thursday"].includes(day);
      expect(kinds.includes("gym")).toBe(gymDay);
      expect(kinds.includes("physio")).toBe(!gymDay);
    });
  });

  test('gym reminder does not count toward the study streak', () => {
    const tue = "2026-11-24";
    const study = DEFAULT_ROUTINE_SCHEDULE.filter(t => t.day === "Tuesday" && t.kind !== "gym");
    const r = isDayGoalMet(tue, DEFAULT_ROUTINE_SCHEDULE, {}, {});
    expect(r.totalTasks).toBe(study.length);
    const onlyGym = isDayGoalMet(tue, DEFAULT_ROUTINE_SCHEDULE, { [tue]: { "tue-gym": { status: "completed" } } }, {});
    expect(onlyGym.completedTasks).toBe(0);
  });

  test('routines saved before gym/physio existed migrate', () => {
    const old = DEFAULT_ROUTINE_SCHEDULE.filter(t => !["gym", "physio"].includes(t.kind));
    expect(needsMigration(old)).toBe(true);
    expect(migrateSchedule(old)).toHaveLength(DEFAULT_ROUTINE_SCHEDULE.length);
  });
});

describe('Gym streak', () => {
  const full = Object.fromEntries(GYM_ROUTINE.map(ex => [ex.id, ex.sets]));
  // 2026-11-22 Sun, 11-24 Tue, 11-26 Thu
  test('routine matches the plan and runs Sun/Tue/Thu', () => {
    expect(GYM_DAYS).toEqual(["Sunday", "Tuesday", "Thursday"]);
    expect(GYM_ROUTINE.map(e => `${e.id}:${e.sets}x${e.reps}`)).toEqual([
      "pushup:3x10", "lat-pulldown:3x10", "overhead-extension:3x15", "ez-bar-curl:3x15",
      "bodyweight-squat:3x12", "wrist-curl:2x15", "cardio:1x10–15 min"
    ]);
    GYM_ROUTINE.forEach(e => expect(e.gif).toMatch(/\/gym\/[a-z-]+\.gif$/));
    expect(isGymDay("2026-11-24")).toBe(true);
    expect(isGymDay("2026-11-25")).toBe(false);
    expect(nextGymDate("2026-11-24")).toBe("2026-11-26");
    expect(nextGymDate("2026-11-26")).toBe("2026-11-29");
  });

  test('a session counts at 70% of exercises fully done', () => {
    const partial = { pushup: 3, "lat-pulldown": 3, "overhead-extension": 3, "ez-bar-curl": 3 };
    expect(gymDayStatus("2026-11-24", { "2026-11-24": partial }).isMet).toBe(false);
    expect(gymDayStatus("2026-11-24", { "2026-11-24": { ...partial, cardio: 1 } }).isMet).toBe(true);
    expect(gymDayStatus("2026-11-24", { "2026-11-24": { ...partial, cardio: 1, pushup: 2 } }).isMet).toBe(false);
  });

  test('skips non-gym days, breaks on a missed gym day', () => {
    const log = { "2026-11-17": full, "2026-11-19": full, "2026-11-22": full, "2026-11-24": full };
    expect(computeGymStreak(log, "2026-11-24").current).toBe(4);
    expect(computeGymStreak(log, "2026-11-25").current).toBe(4); // Wednesday rest day
    expect(computeGymStreak(log, "2026-11-26").current).toBe(4); // Thursday, not done yet
    expect(computeGymStreak(log, "2026-11-27").current).toBe(0); // Thursday missed
    const gap = { "2026-11-17": full, "2026-11-22": full, "2026-11-24": full };
    const r = computeGymStreak(gap, "2026-11-24");
    expect(r.current).toBe(2);
    expect(r.total).toBe(3);
    expect(r.recent).toHaveLength(6);
  });
});

describe('Streak history survives routine changes', () => {
  test('a past day completed under old block ids still counts', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = dateStr(yesterday);
    const states = { [yStr]: { "x-block-1": { status: "completed" }, "x-block-2": { status: "completed" }, "x-block-3": { status: "completed" } } };
    expect(isDayGoalMet(yStr, DEFAULT_ROUTINE_SCHEDULE, states, {}).isMet).toBe(true);
  });
});

describe('App Component', () => {
  test('renders auth screen with guest mode option when signed out', async () => {
    render(<App />);
    expect(await screen.findByText(/CONTINUE AS GUEST/i)).toBeInTheDocument();
  });
});

describe('Midnight 00:00 AM Cutoff Engine', () => {
  test('correctly detects past dates for read-only locking', () => {
    const today = new Date();
    const todayStr = dateStr(today);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = dateStr(yesterday);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = dateStr(tomorrow);

    expect(yesterdayStr < todayStr).toBe(true);
    expect(todayStr < todayStr).toBe(false);
    expect(tomorrowStr < todayStr).toBe(false);
  });
});

