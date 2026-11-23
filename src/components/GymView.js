import React, { useState } from "react";
import { DAYS } from "../config/routineData";
import { GYM_ROUTINE, GYM_DAYS, GYM_EXERCISES_NEEDED, nextGymDate } from "../config/gymData";

function dayName(ds) {
  const [y, m, d] = ds.split("-").map(Number);
  return DAYS[new Date(y, m - 1, d).getDay()];
}

/** Gym page: Sun / Tue / Thu routine with demo GIFs and its own streak. */
export default function GymView({ gymLog = {}, gymStreak, onSetSets, sfx }) {
  const [openGif, setOpenGif] = useState(null);
  const { current = 0, longest = 0, total = 0, today, recent = [] } = gymStreak || {};
  const isGymDay = !!today?.isGymDay;
  const met = !!today?.isMet;
  const todayLog = (today && gymLog[today.date]) || {};
  const next = today ? nextGymDate(today.date) : null;

  let status;
  if (!isGymDay) status = `Rest day. Next session: ${next ? dayName(next) : GYM_DAYS[0]}.`;
  else if (met) status = "Session counted. Streak is safe.";
  else {
    const left = Math.max(0, GYM_EXERCISES_NEEDED - (today?.done || 0));
    status =
      current > 0
        ? `${left} more exercise${left === 1 ? "" : "s"} to keep your ${current}-session streak.`
        : `Finish ${left} exercise${left === 1 ? "" : "s"} today to start a streak.`;
  }

  function tapSet(ex, n) {
    if (!isGymDay) return;
    const doneSets = todayLog[ex.id] || 0;
    const nextSets = doneSets === n ? n - 1 : n;
    if (nextSets >= ex.sets) sfx?.done?.();
    else if (nextSets > doneSets) sfx?.add?.();
    else sfx?.undo?.();
    onSetSets?.(ex.id, nextSets);
  }

  return (
    <div className="gy-wrap fade-in">
      <header className="gy-head">
        <div className="gy-eyebrow">GYM · SUN / TUE / THU</div>
        <div className="gy-streak-row">
          <div className={`gy-number ${current === 0 ? "zero" : ""}`}>{current}</div>
          <div className="gy-streak-text">
            <strong>{current === 1 ? "session in a row" : "sessions in a row"}</strong>
            <span className={`gy-status ${met ? "done" : isGymDay ? "due" : ""}`}>{status}</span>
          </div>
        </div>
        <div className="gy-recent" aria-label="Last six gym days">
          {recent.map((d) => (
            <div key={d.dateStr} className={`gy-dot ${d.status}`} title={d.dateStr}>
              <span className="gy-dot-mark">{d.status === "done" ? "✓" : ""}</span>
              <span className="gy-dot-name">{d.dayShort}</span>
            </div>
          ))}
          <div className="gy-meta">
            <span>
              Longest <strong>{longest}</strong>
            </span>
            <span>
              Total <strong>{total}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="gy-sub">
        {isGymDay
          ? `${today?.done || 0}/${GYM_ROUTINE.length} done · ${GYM_EXERCISES_NEEDED} to count the session. Tap a set when you finish it.`
          : "Today's a rest day. The routine is here so you can check form before the next session."}
      </div>

      <ol className="gy-list">
        {GYM_ROUTINE.map((ex) => {
          const doneSets = todayLog[ex.id] || 0;
          const full = doneSets >= ex.sets;
          const big = openGif === ex.id;
          return (
            <li key={ex.id} className={`gy-item ${full ? "full" : ""} ${big ? "big" : ""}`}>
              <button
                className="gy-gif"
                onClick={() => setOpenGif(big ? null : ex.id)}
                title={big ? "Shrink" : "Enlarge"}
                aria-label={`How to do ${ex.name}`}
              >
                <img src={ex.gif} alt={`${ex.name} demo`} loading="lazy" width="300" height="200" />
              </button>
              <div className="gy-body">
                <div className="gy-title">
                  <span className="gy-name">{ex.name}</span>
                  <span className="gy-dose">
                    {ex.sets > 1 ? `${ex.sets} × ${ex.reps}` : ex.reps}
                  </span>
                </div>
                <p className="gy-cue">{ex.cue}</p>
                <div className="gy-sets">
                  {Array.from({ length: ex.sets }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      className={`gy-set ${n <= doneSets ? "on" : ""}`}
                      disabled={!isGymDay}
                      onClick={() => tapSet(ex, n)}
                      aria-label={`${ex.name} set ${n}`}
                    >
                      {ex.sets > 1 ? `Set ${n}` : "Done"}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="gy-credit">Demo images: free-exercise-db (public domain).</div>
    </div>
  );
}
