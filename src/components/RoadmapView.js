import React, { useState } from "react";
import { ROADMAP, ROADMAP_SOURCE_URL, roadmapStats, phaseStats } from "../config/roadmapData";

export default function RoadmapView({ progress = {}, onToggleItem, onStartFocus, sfx }) {
  const stats = roadmapStats(progress);
  const currentPhaseKey = stats.next?.phaseKey || ROADMAP[0].key;
  const [openKey, setOpenKey] = useState(currentPhaseKey);

  return (
    <div className="rm-wrap fade-in">
      <section className="rm-hero">
        <div className="td-eyebrow">ROADMAP · CYBER SECURITY</div>
        <div className="rm-hero-row">
          <div className="rm-percent">
            {stats.percent}
            <span>%</span>
          </div>
          <div className="rm-hero-text">
            <div className="rm-count">
              {stats.done} of {stats.total} topics
            </div>
            {stats.next ? (
              <div className="rm-next">
                Next up: <strong>{stats.next.label}</strong>
                <span> · {stats.next.phase}</span>
              </div>
            ) : (
              <div className="rm-next">Core roadmap complete.</div>
            )}
          </div>
        </div>
        <div className="rm-bar">
          <div className="rm-bar-fill" style={{ width: `${stats.percent}%` }} />
        </div>
        <div className="rm-hero-actions">
          <button
            className="td-cta small"
            onClick={() => {
              sfx?.start?.();
              onStartFocus?.();
            }}
          >
            ▶ Start roadmap session
          </button>
          <a className="td-ghost" href={ROADMAP_SOURCE_URL} target="_blank" rel="noreferrer">
            Open on roadmap.sh ↗
          </a>
        </div>
      </section>

      <div className="rm-phases">
        {ROADMAP.map((phase) => {
          const ps = phaseStats(phase, progress);
          const open = openKey === phase.key;
          return (
            <section key={phase.key} className={`rm-phase ${open ? "open" : ""} ${ps.done === ps.total ? "complete" : ""}`}>
              <button
                className="rm-phase-head"
                aria-expanded={open}
                onClick={() => {
                  sfx?.tap?.();
                  setOpenKey(open ? null : phase.key);
                }}
              >
                <span className="rm-phase-num">{String(phase.number).padStart(2, "0")}</span>
                <span className="rm-phase-title">
                  {phase.title}
                  {phase.optional && <em>optional</em>}
                </span>
                <span className="rm-phase-count">
                  {ps.done}/{ps.total}
                </span>
                <span className="rm-phase-bar">
                  <span style={{ width: `${ps.percent}%` }} />
                </span>
              </button>

              {open && (
                <div className="rm-groups">
                  {phase.groups.map((group) => (
                    <div className="rm-group" key={group.title}>
                      <div className="rm-group-title">{group.title}</div>
                      <div className="rm-items">
                        {group.items.map((item) => {
                          const done = !!progress[item.id];
                          return (
                            <button
                              key={item.id}
                              className={`rm-item ${done ? "done" : ""}`}
                              aria-pressed={done}
                              onClick={() => {
                                if (done) sfx?.undo?.();
                                else sfx?.done?.();
                                onToggleItem?.(item.id);
                              }}
                            >
                              <span className="rm-item-box">{done ? "✓" : ""}</span>
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
