/** Compact release-state mark. Text beside it carries the accessible status. */
export function SketchCheckbox({ checked }: { checked: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-0.5 size-5 shrink-0"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="18"
        height="18"
        rx="5"
        strokeWidth="1.25"
        className={
          checked
            ? "fill-text-primary stroke-text-primary"
            : "fill-transparent stroke-text-secondary"
        }
      />
      {checked && (
        <path
          d="m5.25 10.2 3.05 3.05 6.45-6.5"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-bg-primary"
        />
      )}
    </svg>
  );
}
