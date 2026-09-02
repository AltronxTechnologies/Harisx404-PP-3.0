/**
 * Double-arrow hover swap (guide spec §5): two stacked arrows in an
 * overflow-hidden box; on group hover the first slides out right while
 * the second slides in from the left. Use inside a `group` element.
 */
export function DoubleArrow({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex size-4 items-center justify-center overflow-hidden ${className}`}
    >
      <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-full motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
        →
      </span>
      <span className="absolute inset-0 flex -translate-x-full items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-0 motion-reduce:transition-none motion-reduce:group-hover:-translate-x-full">
        →
      </span>
    </span>
  );
}
