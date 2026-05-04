"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Exact mouse position
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Spring physics for Ring 1 (fast, tight)
  const spring1 = { damping: 25, stiffness: 400, mass: 0.2 };
  const cursorX1 = useSpring(mouseX, spring1);
  const cursorY1 = useSpring(mouseY, spring1);

  // Spring physics for Ring 2 (slower, trailing)
  const spring2 = { damping: 20, stiffness: 150, mass: 0.6 };
  const cursorX2 = useSpring(mouseX, spring2);
  const cursorY2 = useSpring(mouseY, spring2);

  useEffect(() => {
    // Only show on devices with a fine pointer (mouse)
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    // Detect if hovering over clickable elements to grow the cursor
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Ring 1 (Inner/Fast) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:flex items-center justify-center"
        style={{
          x: cursorX1,
          y: cursorY1,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? 48 : 24,
          height: isHovering ? 48 : 24,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div 
          className="w-full h-full rounded-full border-[1.5px]" 
          style={{ borderColor: "var(--color-signal)" }} 
        />
      </motion.div>

      {/* Ring 2 (Outer/Slow Trailing) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] hidden md:flex items-center justify-center opacity-60"
        style={{
          x: cursorX2,
          y: cursorY2,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? 64 : 40,
          height: isHovering ? 64 : 40,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div 
          className="w-full h-full rounded-full border-[1.5px]" 
          style={{ borderColor: "var(--color-signal)" }} 
        />
      </motion.div>
    </>
  );
}
