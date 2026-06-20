"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function GsapReveal({
  children,
  className = "",
  stagger = 0.1,
  direction = "up",
  delay = 0,
}) {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const yOffset = direction === "up" ? 50 : direction === "down" ? -50 : 0;
      const xOffset = direction === "left" ? 50 : direction === "right" ? -50 : 0;

      gsap.fromTo(
        ".reveal-target",
        {
          opacity: 0,
          y: yOffset,
          x: xOffset,
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.8,
          stagger: stagger,
          delay: delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%", // Trigger when top of container is 85% down the viewport
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
