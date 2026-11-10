/**
 * Streak Engine
 * A day counts as "committed" when at least 70% of that day's blocks are done
 * OR at least 3 hours were logged on the timer.
 */

import { DAYS } from "../config/routineData";
import { dateStr } from "./storage";

export const GOAL_RATE = 0.7;
export const GOAL_SECONDS = 10800;

/** How many blocks must be completed for a day with `total` blocks. */
export function blocksNeeded(total) {
  return Math.ceil(total * GOAL_RATE - 1e-9);
}

export function isDayGoalMet(targetDateStr, routineSchedule, allDailyStates, studyLog) {
  const [y, m, d] = targetDateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = DAYS[dateObj.getDay()];

  const dayTasks = routineSchedule.filter((t) => t.day === dayName);
  const taskStates = allDailyStates[targetDateStr] || {};
  const totalTasks = dayTasks.length;

  // Count every completed entry saved for that date (capped at the day's block count),
  // so history survives when the routine itself is changed later.
  const completedEntries = Object.values(taskStates).filter(
    (s) => s && (s.status === "completed" || s === "completed")
  ).length;
  const completedTasks = Math.min(totalTasks, completedEntries);

  const secondsStudied = studyLog[targetDateStr] || 0;
  const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 1;

  const isMet =
    (totalTasks > 0 && completedTasks >= blocksNeeded(totalTasks)) || secondsStudied >= GOAL_SECONDS;

  return {
    date: targetDateStr,
    dayName,
    totalTasks,
    completedTasks,
    taskCompletionRate,
    secondsStudied,
    isMet,
    isRestDay: totalTasks === 0
  };
}

export function computeStreakMetrics({ routineSchedule = [], allDailyStates = {}, studyLog = {} }) {
  const today = dateStr();
  const now = new Date();
  const todayMetrics = isDayGoalMet(today, routineSchedule, allDailyStates, studyLog);

  // Current streak: today (if done) + consecutive committed days before it.
  // Today not being done yet does not break the streak; yesterday missing does.
  let currentStreak = todayMetrics.isMet ? 1 : 0;
  for (let i = 1; i <= 730; i++) {
    const past = new Date(now);
    past.setDate(now.getDate() - i);
    const metrics = isDayGoalMet(dateStr(past), routineSchedule, allDailyStates, studyLog);
    if (metrics.isMet) currentStreak += 1;
    else if (metrics.isRestDay) continue;
    else break;
  }

  // Every committed day on record
  const recordedDates = new Set([...Object.keys(allDailyStates), ...Object.keys(studyLog)]);
  const committedDates = [...recordedDates]
    .filter((ds) => /^\d{4}-\d{2}-\d{2}$/.test(ds))
    .filter((ds) => isDayGoalMet(ds, routineSchedule, allDailyStates, studyLog).isMet)
    .sort();
  const totalDays = committedDates.length;

  // Longest run of consecutive calendar days
  let longestStreak = currentStreak;
  let run = 0;
  let prev = null;
  committedDates.forEach((ds) => {
    const [y, m, d] = ds.split("-").map(Number);
    const cur = new Date(y, m - 1, d);
    run = prev && Math.round((cur - prev) / 86400000) === 1 ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
    prev = cur;
  });

  // Last 7 days, oldest first
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const ds = dateStr(d);
    const m = isDayGoalMet(ds, routineSchedule, allDailyStates, studyLog);
    week.push({
      dateStr: ds,
      dayShort: DAYS[d.getDay()].slice(0, 3),
      isToday: ds === today,
      status: m.isMet ? "done" : ds === today ? "today" : "missed"
    });
  }

  return {
    currentStreak,
    longestStreak,
    totalDays,
    todayProgress: todayMetrics,
    week
  };
}
