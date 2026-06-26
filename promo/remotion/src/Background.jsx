import React, { useEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { THEMES, blendThemes } from "./themes";

// Deterministic PRNG so the star field + city skyline are identical every render.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Resolve the blended palette for a given second, from a [{at, key}] timeline.
function paletteAt(timeline, sec) {
  let i = 0;
  while (i < timeline.length - 1 && sec >= timeline[i + 1].at) i++;
  const cur = THEMES[timeline[i].key];
  const next = THEMES[timeline[Math.min(i + 1, timeline.length - 1)].key];
  const start = timeline[i].at;
  const end = i < timeline.length - 1 ? timeline[i + 1].at : start + 1;
  const BLEND = 0.9; // seconds of crossfade right before the next theme
  const tRaw = (sec - (end - BLEND)) / BLEND;
  const t = Math.max(0, Math.min(1, tRaw));
  return blendThemes(cur, next, t);
}

export const Background = ({ themeTimeline }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const ref = useRef(null);

  // Static, seeded layout — built once, animated by time only.
  const layout = useMemo(() => {
    const rnd = mulberry32(1337);
    const horizon = H * 0.62;
    const stars = Array.from({ length: 220 }, () => ({
      x: rnd() * W, y: rnd() * horizon * 0.95, r: rnd() * 2.2 + 0.5, ph: rnd() * 6.28, sp: 0.4 + rnd() * 0.8,
    }));
    const makeCity = (maxH, baseY) => {
      const arr = []; let x = 0;
      while (x < W + 120) {
        const w = 26 + rnd() * 70, h = 40 + rnd() * maxH, wins = [];
        for (let wy = baseY - h + 8; wy < baseY - 8; wy += 13)
          for (let wx = x + 6; wx < x + w - 6; wx += 11)
            if (rnd() > 0.5) wins.push({ x: wx, y: wy, ph: rnd() * 6.28, sp: 0.3 + rnd() });
        arr.push({ x, w, h, wins }); x += w + 3 + rnd() * 8;
      }
      return arr;
    };
    return { horizon, stars, cityFar: makeCity(150, horizon + 1), cityNear: makeCity(250, horizon + 1) };
  }, [W, H]);

  // Shooting stars: deterministic schedule keyed off frame.
  const shooters = useMemo(() => {
    const rnd = mulberry32(99);
    return Array.from({ length: 14 }, (_, i) => ({
      t0: i * 2.7 + rnd() * 1.5, x: rnd() * W * 0.7, y: rnd() * H * 0.28,
      len: 120 + rnd() * 160, sp: 360 + rnd() * 300,
    }));
  }, [W, H]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const tt = frame / fps;
    const t = paletteAt(themeTimeline, tt);
    const { horizon, stars, cityFar, cityNear } = layout;

    ctx.clearRect(0, 0, W, H);

    // sky
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    t.sky.forEach((c, i) => g.addColorStop(i / (t.sky.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 2);
    const hz = ctx.createLinearGradient(0, horizon - 200, 0, horizon);
    hz.addColorStop(0, "transparent"); hz.addColorStop(1, t.haze);
    ctx.fillStyle = hz; ctx.fillRect(0, horizon - 200, W, 200);

    // stars
    stars.forEach((s) => {
      const a = 0.3 + 0.6 * Math.abs(Math.sin(s.ph + tt * s.sp));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28);
      ctx.fillStyle = `rgba(${t.star},${a})`; ctx.fill();
    });

    // shooting stars
    shooters.forEach((sh) => {
      const life = (tt - sh.t0) / 1.1;
      if (life < 0 || life > 1) return;
      const x = sh.x + sh.sp * life, y = sh.y + sh.sp * life * 0.4;
      const grad = ctx.createLinearGradient(x, y, x - sh.len, y - sh.len * 0.4);
      grad.addColorStop(0, `rgba(${t.star},${1 - life})`); grad.addColorStop(1, "transparent");
      ctx.strokeStyle = grad; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - sh.len, y - sh.len * 0.4); ctx.stroke();
    });

    // sun / moon
    const cx = W / 2;
    if (t.moon) {
      const cy = horizon * 0.42, R = 110;
      const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.6);
      gl.addColorStop(0, t.sun[0]); gl.addColorStop(0.4, t.sun[1]);
      gl.addColorStop(0.75, "rgba(255,215,106,0.15)"); gl.addColorStop(1, "transparent");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, R * 2.6, 0, 6.28); ctx.fill();
      ctx.fillStyle = t.sun[1]; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.fill();
    } else {
      const cy = horizon * 0.74, R = 200 + Math.sin(tt * 1.2) * 8;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2);
      glow.addColorStop(0, t.sun[0]); glow.addColorStop(0.35, t.sun[1]);
      glow.addColorStop(0.6, t.sun[2]); glow.addColorStop(0.85, t.sun[3] + "00"); glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 2.2, 0, 6.28); ctx.fill();
      const disc = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
      disc.addColorStop(0, t.sun[0]); disc.addColorStop(0.5, t.sun[1]); disc.addColorStop(1, t.sun[2]);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.clip();
      ctx.fillStyle = disc; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      if (t.sunStripe) {
        ctx.fillStyle = t.sunStripe; let sy = cy + R * 0.15, gap = 12;
        while (sy < cy + R) { ctx.fillRect(cx - R, sy, R * 2, gap * 0.6); sy += gap; gap += 4; }
      }
      ctx.restore();
    }

    // cities
    const drawCity = (layerArr, color, pa) => {
      layerArr.forEach((b) => {
        ctx.fillStyle = color; ctx.fillRect(b.x, horizon - b.h, b.w, b.h);
        b.wins.forEach((w) => {
          const a = (0.5 + 0.5 * Math.abs(Math.sin(w.ph + tt * w.sp))) * pa;
          ctx.fillStyle = `rgba(255,210,120,${a * 0.8})`; ctx.fillRect(w.x, w.y, 4, 5);
        });
      });
    };
    drawCity(cityFar, "rgba(0,0,0,0.55)", 0.6);
    drawCity(cityNear, "rgba(0,0,0,0.85)", 1);

    // neon perspective grid
    const hy = horizon, vx = W / 2, gridOff = (tt * 0.75) % 1;
    ctx.strokeStyle = t.grid; ctx.lineWidth = 1.6;
    const lines = 24;
    for (let i = 0; i < lines; i++) {
      const p = (i + gridOff) / lines, y = hy + Math.pow(p, 2) * (H - hy);
      ctx.globalAlpha = 0.5 * (1 - p * 0.3);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 0.4;
    const vts = 26;
    for (let i = -vts; i <= vts; i++) {
      const fx = vx + (i / vts) * W * 1.4;
      ctx.beginPath(); ctx.moveTo(vx, hy); ctx.lineTo(fx, H); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (!t.moon) {
      const refl = ctx.createLinearGradient(0, hy, 0, H);
      refl.addColorStop(0, t.sun[2] + "55"); refl.addColorStop(0.4, t.sun[3] + "22"); refl.addColorStop(1, "transparent");
      ctx.fillStyle = refl; ctx.fillRect(W / 2 - 140, hy, 280, H - hy);
    }
  }, [frame, fps, W, H, layout, shooters, themeTimeline]);

  // gentle cinematic push-in on the whole scene
  const scale = interpolate(frame, [0, 1300], [1.06, 1.16], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      {/* scanlines + vignette to match the in-app retro CRT look */}
      <AbsoluteFill style={{
        pointerEvents: "none",
        background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.10) 3px,rgba(0,0,0,0.10) 6px)",
      }} />
      <AbsoluteFill style={{
        pointerEvents: "none",
        background: "radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,0.78) 100%)",
      }} />
    </AbsoluteFill>
  );
};
