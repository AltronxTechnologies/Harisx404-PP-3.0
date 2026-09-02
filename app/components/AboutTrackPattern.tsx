"use client";

import { useReducedMotion, useScroll, useSpring } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

/** Build the two-panel zigzag route for a given container height so the
 *  ball starts exactly at the top border and stops exactly at the bottom.
 *  The left rail is vertically centered on panel 1 (top half) and the right
 *  rail on panel 2 (bottom half), with a short center jog between them so
 *  both loops bracket their panels identically. */
function buildTrackPath(h: number): string {
  const yA = Math.round(h / 2 - 59); // left rail -> center, above the midpoint
  const yB = Math.round(h / 2 + 59); // center -> right rail, below the midpoint
  const yC = Math.round(h - 103); // right rail -> center, mirroring the top turn
  return (
    `M145 0L145 87C145 95.84 137.84 103 129 103L20 103C11.16 103 4 110.16 4 119` +
    `L4 ${yA - 16}C4 ${yA - 7.16} 11.16 ${yA} 20 ${yA}L129 ${yA}` +
    `C137.84 ${yA} 145 ${yA + 7.16} 145 ${yA + 16}L145 ${yB - 16}` +
    `C145 ${yB - 7.16} 152.16 ${yB} 161 ${yB}L256 ${yB}` +
    `C264.84 ${yB} 272 ${yB + 7.16} 272 ${yB + 16}L272 ${yC - 16}` +
    `C272 ${yC - 7.16} 264.84 ${yC} 256 ${yC}L161 ${yC}` +
    `C152.16 ${yC} 145 ${yC + 7.16} 145 ${yC + 16}L145 ${h}`
  );
}

export function AboutTrackPattern() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const ballRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [trackHeight, setTrackHeight] = useState(1018);
  const trackHeightRef = useRef(1018);
  trackHeightRef.current = trackHeight;

  // Track the bordered container's real height so the route always spans
  // border to border, at every viewport width.
  useEffect(() => {
    const host = containerRef.current?.parentElement?.parentElement;
    if (!host) return;
    // clientHeight = padding box: the SVG lives inside the borders, so the
    // route must end at the inner edge of the bottom border, not past it.
    const measure = () => setTrackHeight(Math.max(300, host.clientHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const trackPath = buildTrackPath(trackHeight);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  // Same critically-damped spring as the Experience timeline avatar, so both
  // scroll companions share one motion personality. Positions are written
  // straight to the SVG attributes — zero React re-renders per frame.
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
    restDelta: 0.001,
  });

  useEffect(() => {
    const apply = (latest: number) => {
      if (window.innerWidth < 1024) return;
      const activePath = pathRef.current;
      if (!activePath) return;
      const length = activePath.getTotalLength();
      if (!length) return;
      const clamped = Math.max(0, Math.min(latest, 1));
      const point = activePath.getPointAtLength(length * clamped);
      const x = String(point.x);
      // Keep the ball fully visible inside the borders — never let it sit
      // half-clipped under the top or bottom border line.
      const y = String(Math.min(Math.max(point.y, 10), trackHeightRef.current - 10));
      ballRef.current?.setAttribute("cx", x);
      ballRef.current?.setAttribute("cy", y);
      glowRef.current?.setAttribute("cx", x);
      glowRef.current?.setAttribute("cy", y);
    };
    if (prefersReducedMotion) {
      apply(0);
      return;
    }
    apply(smooth.get());
    return smooth.on("change", apply);
  }, [smooth, prefersReducedMotion]);

  return (
    <div ref={containerRef} className="relative">
      <svg
        aria-hidden="true"
        focusable="false"
        className="user-select-none pointer-events-none hidden lg:block"
        width="390"
        height={trackHeight}
        viewBox={`-10 0 390 ${trackHeight}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id="purpleGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.423
                      0 0 0 0 0.278
                      0 0 0 0 1
                      0 0 0 0.6 0"
            />
          </filter>

          {/* Create a mask using the path */}
          <mask id="pathMask">
            <path
              d={trackPath}
              stroke="white"
              strokeWidth="8"
              strokeLinejoin="round"
              fill="none"
            />
          </mask>

          <filter
            id="filter0_i_395_898"
            x="0"
            y="0"
            width="380"
            height={trackHeight}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="2" />
            <feGaussianBlur stdDeviation="0.75" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.647059 0 0 0 0 0.682353 0 0 0 0 0.721569 0 0 0 0.32 0"
            />
            <feBlend
              mode="normal"
              in2="shape"
              result="effect1_innerShadow_395_898"
            />
          </filter>
        </defs>

        {/* Container for masked elements */}
        <g mask="url(#pathMask)">
          {/* Glowing halo riding the path */}
          <circle
            ref={glowRef}
            cx="145"
            cy="10"
            r="120"
            fill="#a78bfa"
            filter="url(#purpleGlow)"
            opacity="0.5"
          />
        </g>

        {/* Path on top */}
        <g filter="url(#filter0_i_395_898)">
          <path
            ref={pathRef}
            d={trackPath}
            stroke="#D6DADE"
            strokeOpacity="0.24"
            strokeWidth="8"
            strokeLinejoin="round"
          />
        </g>

        {/* Ball riding the path — brand gradient, same spring as the
            Experience avatar */}
        <defs>
          <linearGradient id="trackBall" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f472b6" />
            <stop offset="0.5" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <circle ref={ballRef} cx="145" cy="10" r="10" fill="url(#trackBall)" />
      </svg>
    </div>
  );
}
