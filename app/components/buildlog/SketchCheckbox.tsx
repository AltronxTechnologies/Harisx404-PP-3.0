/** Hand-drawn sketch checkbox — reference component: SVG turbulence filter
 *  gives the box a wobbly, pencil-drawn look. */
export function SketchCheckbox({ checked }: { checked: boolean }) {
  const filterId = checked ? "sketch-wobble-checked" : "sketch-wobble";
  return (
    <svg viewBox="0 0 24 24" className="mt-[1px] size-[22px] shrink-0" aria-hidden="true">
      <defs>
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" result="noise" seed="2" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="3"
          fill="none"
          strokeWidth={checked ? 1.4 : 1.2}
          className={checked ? "stroke-neutral-800 dark:stroke-neutral-200" : "stroke-neutral-300 dark:stroke-neutral-700"}
        />
        {checked && (
          <path
            d="M7 13l4 4.5L22 5"
            fill="none"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-neutral-800 dark:stroke-neutral-200"
          />
        )}
      </g>
    </svg>
  );
}
