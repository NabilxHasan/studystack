import React from "react";
import {
  DAYS,
  DAY_METADATA,
  DSA_BREAKDOWN,
  EXECUTION_GUIDELINES,
  SUBJECT_THEMES
} from "../config/routineData";

export default function RoutineTable({ routineSchedule = [], onStartTaskTimer }) {
  const sessions = [
    { num: 1, label: "SESSION 1" },
    { num: 2, label: "SESSION 2" },
    { num: 3, label: "SESSION 3" }
  ];

  return (
    <div className="routine-table-container fade-in">
      {/* ── SUMMARY STATS BAR ── */}
      <div className="table-stats-bar">
        <div className="table-stat-card">
          <div className="stat-num">Academics</div>
          <div className="stat-lbl">Primary Core Focus</div>
        </div>
        <div className="table-stat-card">
          <div className="stat-num">4 Sessions</div>
          <div className="stat-lbl">Weekly DSA Engine</div>
        </div>
        <div className="table-stat-card">
          <div className="stat-num">7 Days</div>
          <div className="stat-lbl">Structured Routine</div>
        </div>
        <div className="table-stat-card">
          <div className="stat-num">Weekend</div>
          <div className="stat-lbl">Skill Gain Focus</div>
        </div>
      </div>

      {/* ── MASTER ROUTINE TABLE ── */}
      <div className="rt-table-scroll">
        <table className="rt-table">
          <thead>
            <tr>
              <th className="rt-th" style={{ width: "16%" }}>DAY</th>
              {sessions.map((s) => (
                <th key={s.num} className="rt-th" style={{ width: "28%" }}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((dayName) => {
              const dayMeta = DAY_METADATA[dayName] || { tag: "REGULAR" };
              const dayTasks = routineSchedule.filter((t) => t.day === dayName);

              return (
                <tr key={dayName}>
                  <td className="rt-td rt-day-cell">
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontWeight: 800 }}>{dayName}</span>
                      <span style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700 }}>
                        {dayMeta.tag}
                      </span>
                    </div>
                  </td>

                  {/* 3 Slots */}
                  {[0, 1, 2].map((slotIdx) => {
                    const task = dayTasks[slotIdx];
                    if (!task) {
                      return (
                        <td key={slotIdx} className="rt-td" style={{ color: "var(--text-subtle)", fontSize: "12px", textAlign: "center" }}>
                          —
                        </td>
                      );
                    }

                    const theme = SUBJECT_THEMES[task.subject] || { icon: "📚" };

                    return (
                      <td key={slotIdx} className="rt-td">
                        <div
                          className="rt-block-card"
                          onClick={() => onStartTaskTimer?.(task, true)}
                          style={{ cursor: "pointer" }}
                          title={`Click to focus on ${task.subject}`}
                        >
                          <div style={{ fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>{theme.icon}</span>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {task.subject}
                            </span>
                          </div>
                          {task.notes && (
                            <div style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {task.notes}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── DSA 50 / 30 / 20 BREAKDOWN ── */}
      <div className="dsa-breakdown-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>
              ⚡ DSA Strategy: 50 / 30 / 20 Rule
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              4 designated sessions weekly across Sun, Tue, Thu, Sat
            </div>
          </div>
          <span className="hero-day-tag">CORE ENGINE</span>
        </div>

        <div className="dsa-grid">
          {DSA_BREAKDOWN.distribution.map((item) => (
            <div key={item.title} className="dsa-part-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="dsa-pct-badge">{item.percent}%</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
                  Priority
                </span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginTop: "6px" }}>
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── EXECUTION GUIDELINES ── */}
      <div className="minimal-card" style={{ cursor: "default" }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
          📌 Execution Guidelines
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
          {EXECUTION_GUIDELINES.map((g) => (
            <div key={g.id} style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>
                {g.header}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4" }}>
                {g.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
