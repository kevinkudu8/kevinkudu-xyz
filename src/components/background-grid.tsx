// Row height for the horizontal rules; crosshairs sit where they meet the columns
const ROW = 360;

const crosshair = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="${ROW}"><path d="M5.5 0v11M0 5.5h11" stroke="#000" stroke-opacity=".3"/></svg>`,
)}")`;

/**
 * Drafting-paper backdrop: horizontal rules and column lines at the page
 * gutters and thirds, with a + at each intersection.
 */
export function BackgroundGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${ROW - 1}px, var(--grid-line) ${ROW - 1}px ${ROW}px)`,
        }}
      />
      <div className="left-gutter right-gutter absolute inset-y-0 flex justify-between">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`bg-grid-line relative w-px ${i === 1 || i === 2 ? "hidden sm:block" : ""}`}
          >
            <span
              className="absolute inset-y-0 left-1/2 w-[11px] -translate-x-1/2"
              style={{ backgroundImage: crosshair, backgroundPosition: "0 -5.5px" }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
