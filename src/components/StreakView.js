import React from "react";

/** Bare-bones streak: how many days in a row you have been committed. Nothing else. */
export default function StreakView({ streakMetrics, gymStreak }) {
  const { currentStreak = 0, longestStreak = 0, totalDays = 0, todayProgress, week = [] } = streakMetrics || {};
  const todayDone = !!todayProgress?.isMet;

  return (
    <div className="sk-wrap fade-in">
      <div className={`sk-number ${currentStreak === 0 ? "zero" : ""}`}>{currentStreak}</div>
      <div className="sk-label">{currentStreak === 1 ? "day committed" : "days committed"}</div>

      <div className={`sk-today ${todayDone ? "done" : ""}`}>
        {todayDone ? "Today is counted." : "Today is not counted yet."}
      </div>

      <div className="sk-week" aria-label="Last 7 days">
        {week.map((day) => (
          <div key={day.dateStr} className={`sk-day ${day.status}`}>
            <span className="sk-day-mark">{day.status === "done" ? "✓" : ""}</span>
            <span className="sk-day-name">{day.dayShort}</span>
          </div>
        ))}
      </div>

      <div className="sk-meta">
        <span>
          Longest <strong>{longestStreak}</strong>
        </span>
        <span>
          Total days <strong>{totalDays}</strong>
        </span>
      </div>

      {gymStreak && (
        <div className="sk-gym" title="Separate streak: Sunday, Tuesday, Thursday">
          Gym <strong>{gymStreak.current}</strong>{" "}
          {gymStreak.current === 1 ? "session" : "sessions"} in a row
        </div>
      )}
    </div>
  );
}
