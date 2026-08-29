/** Wavy perforation divider between a card's gradient banner and its meta bar.
 *  Path traced from the reference guestbook card (viewBox 0 0 400 20). */
export function ScallopDivider() {
  return (
    <svg
      aria-hidden="true"
      className="absolute right-0 bottom-0 left-0 w-full"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 400 20"
    >
      <path
        className="fill-white dark:fill-neutral-900"
        d="M0 20V12C10 12 10 4 20 4C30 4 30 12 40 12C50 12 50 4 60 4C70 4 70 12 80 12C90 12 90 4 100 4C110 4 110 12 120 12C130 12 130 4 140 4C150 4 150 12 160 12C170 12 170 4 180 4C190 4 190 12 200 12C210 12 210 4 220 4C230 4 230 12 240 12C250 12 250 4 260 4C270 4 270 12 280 12C290 12 290 4 300 4C310 4 310 12 320 12C330 12 330 4 340 4C350 4 350 12 360 12C370 12 370 4 380 4C390 4 390 12 400 12V20H0Z"
      />
      <path
        stroke="rgba(255,255,255,0.1)"
        d="M0 12C10 12 10 4 20 4C30 4 30 12 40 12C50 12 50 4 60 4C70 4 70 12 80 12C90 12 90 4 100 4C110 4 110 12 120 12C130 12 130 4 140 4C150 4 150 12 160 12C170 12 170 4 180 4C190 4 190 12 200 12C210 12 210 4 220 4C230 4 230 12 240 12C250 12 250 4 260 4C270 4 270 12 280 12C290 12 290 4 300 4C310 4 310 12 320 12C330 12 330 4 340 4C350 4 350 12 360 12C370 12 370 4 380 4C390 4 390 12 400 12"
      />
    </svg>
  );
}
