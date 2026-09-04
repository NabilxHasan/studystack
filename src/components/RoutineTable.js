import React from "react";
import {
  DAYS,
  DAY_METADATA,
  DSA_BREAKDOWN,
  EXECUTION_GUIDELINES,
  SUBJECT_THEMES
} from "../config/routineData";

export default function RoutineTable({ routineSchedule = [], onStartTaskTimer }) {
  const blocks = [
    { num: 1, label: "BLOCK 1", dur: "2h" },
    { num: 2, label: "BLOCK 2", dur: "2h" },
    { num: 3, label: "BLOCK 3", dur: "1-2h" },
    { num: 4, label: "BLOCK 4", dur: "1h" },
    { num: 5, label: "BLOCK 5", dur: "1h" }
  ];

  return (
    <div className="routine-table-container fade-in">
      {/* ── SUMMARY STATS BAR ── */}
      <div className="table-stats-bar">
        <div className="table-stat-card">
          <div className="stat-num">52h</div>
          <div className="stat-lbl">Weekly Study Target</div>
        </div>
        <div className="table-stat-card">
          <div className="stat-num">8h</div>
          <div className="stat-lbl">DSA Focus (4 Sessions)</div>
        </div>
        <div className="table-stat-card">
          <div className="stat-num">7 Days</div>
          <div className="stat-lbl">Scheduled Routine</div>
        </div>
        <div className="table-stat-card">
          <div className="stat-num">5 Blocks</div>
          <div className="stat-lbl">Structured Daily Slots</div>
        </div>
      </div>

      {/* ── MASTER 52H ROUTINE TABLE ── */}
      <div className="rt-table-scroll">
        <table className="rt-table">
          <thead>
            <tr>
              <th className="rt-th" style={{ width: "13%" }}>DAY</th>
              {blocks.map((b) => (
                <th key={b.num} className="rt-th" style={{ width: "15%" }}>
                  {b.label} <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-subtle)" }}>({b.dur})</span>
                </th>
              ))}
              <th className="rt-th" style={{ width: "10%", textAlign: "center" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((dayName) => {
              const dayMeta = DAY_METADATA[dayName] || { tag: "REGULAR", totalHours: 7 };
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

                  {/* 5 Slots */}
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const task = dayTasks[slotIdx];
                    if (!task) {
                      return (
                        <td key={slotIdx} className="rt-td" style={{ color: "var(--text-subtle)", fontSize: "12px" }}>
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
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                            ⏱️ {task.allocatedDurationMinutes >= 60 ? `${task.allocatedDurationMinutes / 60}h` : `${task.allocatedDurationMinutes}m`} Target
                          </div>
                          {task.notes && (
                            <div style={{ fontSize: "10px", color: "var(--text-subtle)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {task.notes}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="rt-td" style={{ textAlign: "center", verticalAlign: "middle" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>
                      {dayMeta.totalHours}h
                    </span>
                  </td>
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
              8 hours weekly across 4 designated sessions (Sun / Tue / Thu / Sat)
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
                  {item.hoursTotal}h Total ({item.perSession}/sess)
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
