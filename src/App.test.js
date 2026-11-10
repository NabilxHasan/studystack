import React from 'react';
import { render, screen } from '@testing-library/react';
import { DAYS, DEFAULT_ROUTINE_SCHEDULE, ROADMAP_SUBJECT, UNI_CLASSES, COURSES, isLegacySchedule } from './config/routineData';
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
  dateStr
} from './utils/storage';
import { isDayGoalMet, computeStreakMetrics } from './utils/streakEngine';
import App from './App';

describe('StudyStack Routine Configuration', () => {
  test('every day has study blocks and ends with exactly one roadmap block', () => {
    expect(DAYS).toHaveLength(7);
    DAYS.forEach((day) => {
      const dayTasks = DEFAULT_ROUTINE_SCHEDULE.filter(t => t.day === day);
      expect(dayTasks.length).toBeGreaterThanOrEqual(3);
      expect(dayTasks.filter(t => t.subject === ROADMAP_SUBJECT)).toHaveLength(1);
      expect(dayTasks[dayTasks.length - 1].subject).toBe(ROADMAP_SUBJECT);
    });
    const ids = DEFAULT_ROUTINE_SCHEDULE.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('covers all current courses and both backlogs, with no dropped skills', () => {
    const subjects = new Set(DEFAULT_ROUTINE_SCHEDULE.map(t => t.subject));
    ["OOP", "Data Communication", "Microprocessor", "DSA", "Calculus", "Physics", "EEE"].forEach((s) => {
      expect(DEFAULT_ROUTINE_SCHEDULE.filter(t => t.subject === s).length).toBeGreaterThanOrEqual(2);
    });
    ["Boot.dev", "Skill Gain", "Academic Revision"].forEach((s) => expect(subjects.has(s)).toBe(false));
    expect(isLegacySchedule(DEFAULT_ROUTINE_SCHEDULE)).toBe(false);
    expect(isLegacySchedule([{ id: "mon-block-3", day: "Monday", subject: "Boot.dev" }])).toBe(true);
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

