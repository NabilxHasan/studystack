import React from 'react';
import { render, screen } from '@testing-library/react';
import { DAYS, DEFAULT_ROUTINE_SCHEDULE, DSA_BREAKDOWN } from './config/routineData';
import {
  saveRoutineSchedule,
  loadRoutineSchedule,
  saveDailyTaskStates,
  loadDailyTaskStates,
  saveActiveTimerSession,
  loadActiveTimerSession,
  clearActiveTimerSession,
  dateStr
} from './utils/storage';
import { isDayGoalMet, computeStreakMetrics } from './utils/streakEngine';
import App from './App';

describe('StudyStack Routine & Timetable Configuration', () => {
  test('has 7 schedule days and 52 total weekly hours', () => {
    expect(DAYS).toHaveLength(7);
    expect(DEFAULT_ROUTINE_SCHEDULE.length).toBeGreaterThan(20);
    const totalWeeklyHours = DEFAULT_ROUTINE_SCHEDULE.reduce((sum, item) => sum + (item.allocatedDurationMinutes / 60), 0);
    expect(totalWeeklyHours).toBe(52);
  });

  test('DSA 50/30/20 ratio definition matches requirements', () => {
    expect(DSA_BREAKDOWN.totalHours).toBe(8);
    const dist = DSA_BREAKDOWN.distribution;
    const academic = dist.find(d => d.title.includes('Academic'));
    const leetcode = dist.find(d => d.title.includes('LeetCode'));
    const cf = dist.find(d => d.title.includes('Codeforces'));

    expect(academic.percent).toBe(50);
    expect(leetcode.percent).toBe(30);
    expect(cf.percent).toBe(20);
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
      studyLog,
      streakFreezeEnabled: false
    });

    expect(metrics.currentStreak).toBe(2);
  });
});

describe('App Component', () => {
  test('renders auth screen with guest mode option when signed out', async () => {
    render(<App />);
    expect(await screen.findByText(/CONTINUE AS GUEST/i)).toBeInTheDocument();
  });
});
