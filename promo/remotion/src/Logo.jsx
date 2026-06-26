import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { FONT } from "./fonts";

// The cyberpunk two-line STUDY / STACK wordmark — fixed neon palette (theme-independent),
// matching the in-app CyberLogo. Adds a subtle glitch flicker via frame timing.
export const CyberLogo = ({ size = 150, delay = 0 }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const reveal = interpolate(f, [0, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spread = interpolate(f, [0, 32], [38, 12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blur = interpolate(f, [0, 28], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(f, [0, 32], [0.82, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // periodic glitch: clones jump for ~2 frames every ~52 frames once revealed
  const g = f % 52;
  const glitch = reveal > 0.9 && g < 3 ? 1 : 0;
  const gx = glitch ? (g === 1 ? -5 : 4) : 0;

  const lineStyle = {
    display: "block",
    position: "relative",
    fontFamily: FONT.orbitron,
    fontWeight: 900,
    fontSize: size,
    lineHeight: 0.9,
    letterSpacing: spread,
    paddingLeft: spread,
  };
  const mainStyle = {
    backgroundImage: "linear-gradient(180deg,#9affff 0%,#22e0ff 32%,#c45bff 68%,#ff2d9b 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
    filter: `drop-shadow(0 0 22px rgba(34,224,255,0.55)) drop-shadow(0 0 42px rgba(255,45,155,0.4)) blur(${blur}px)`,
  };

  return (
    <div style={{ opacity: reveal, transform: `scale(${scale})`, textAlign: "center" }}>
      {["STUDY", "STACK"].map((w) => (
        <span key={w} style={lineStyle}>
          {glitch ? (
            <>
              <span style={{ position: "absolute", left: spread, top: 0, color: "#ff2d9b", opacity: 0.7, transform: `translate(${gx}px,1px)` }}>{w}</span>
              <span style={{ position: "absolute", left: spread, top: 0, color: "#22e0ff", opacity: 0.6, transform: `translate(${-gx}px,-1px)` }}>{w}</span>
            </>
          ) : null}
          <span style={mainStyle}>{w}</span>
        </span>
      ))}
    </div>
  );
};
