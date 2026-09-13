import React, { useEffect, useState, useRef } from "react";

export default function CustomCursor() {
  const [isPointerDevice, setIsPointerDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const ringPosRef = useRef({ x: -100, y: -100 });
  const targetPosRef = useRef({ x: -100, y: -100 });
  const ringElRef = useRef(null);
  const dotElRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    // Check if the device has a fine pointer (mouse / trackpad)
    // Never activate on touch devices (phones, tablets, iOS Chrome)
    const mediaQuery = window.matchMedia("(pointer: fine)");
    setIsPointerDevice(mediaQuery.matches);

    const handleMediaChange = (e) => {
      setIsPointerDevice(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPointerDevice) return;

    const onMouseMove = (e) => {
      const { clientX: x, clientY: y } = e;
      targetPosRef.current = { x, y };
      if (!isVisible) setIsVisible(true);

      // Check if hovering over interactive elements
      const target = e.target;
      const interactive = target && target.closest(
        'button, a, select, input, [role="button"], .day-pill-btn, .clickable, .task-card, .preset-btn, .mobile-nav-item, .brand-section'
      );
      setIsHovered(Boolean(interactive));
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Smooth lerp animation loop for the trailing outer ring (60fps hardware accelerated)
    const animate = () => {
      const target = targetPosRef.current;
      const current = ringPosRef.current;

      const ease = 0.22;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;

      if (ringElRef.current) {
        ringElRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      }
      if (dotElRef.current) {
        dotElRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPointerDevice, isVisible]);

  if (!isPointerDevice || !isVisible) return null;

  return (
    <div className="custom-cursor-container" aria-hidden="true">
      {/* Smooth Trailing Outer Cyber Ring */}
      <div
        ref={ringElRef}
        className={`custom-cursor-ring ${isHovered ? "hovered" : ""} ${isClicking ? "clicking" : ""}`}
      >
        <div className="cursor-crosshair ch-top" />
        <div className="cursor-crosshair ch-bottom" />
        <div className="cursor-crosshair ch-left" />
        <div className="cursor-crosshair ch-right" />
      </div>

      {/* Instant Center Focus Dot */}
      <div
        ref={dotElRef}
        className={`custom-cursor-dot ${isHovered ? "hovered" : ""} ${isClicking ? "clicking" : ""}`}
      />
    </div>
  );
}
