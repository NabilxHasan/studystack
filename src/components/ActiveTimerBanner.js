import React from "react";
import { formatClock } from "../utils/storage";

export default function ActiveTimerBanner({ session, onOpenTimer, onTogglePause }) {
  if (!session) return null;

  const isPaused = session.isPaused;
  const isCountdown = session.targetSeconds > 0;
  const displayTime = isCountdown ? session.remainingSeconds : session.elapsedSeconds;

  return (
    <div className={`active-timer-banner ${isPaused ? "banner-paused" : "banner-running"}`}>
      <div className="banner-left" onClick={onOpenTimer}>
        <span style={{ fontSize: "16px" }}>
          {isPaused ? "⏸" : "⏱️"}
        </span>
        <div className="banner-info">
          <span className="banner-subject">{session.subject}</span>
          <span className="banner-time">{formatClock(displayTime)}</span>
        </div>
      </div>

      <div className="banner-right">
        <button
          className="banner-btn"
          onClick={onTogglePause}
          title={isPaused ? "Resume study session" : "Pause study session"}
        >
          {isPaused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button
          className="banner-btn banner-open-btn"
          onClick={onOpenTimer}
          title="Open Focus Timer"
        >
          Focus ⛶
        </button>
      </div>
    </div>
  );
}
