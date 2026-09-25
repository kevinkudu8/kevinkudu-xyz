export function SiteFooter() {
  return (
    <footer className="px-gutter pb-10 sm:pb-16">
      <a
        href="https://x.com/kevkudu"
        target="_blank"
        rel="me noreferrer"
        aria-label="X"
        className="inline-block transition-opacity hover:opacity-55"
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.53 3H20.5l-6.49 7.41L21.75 21h-5.98l-4.68-6.12L5.7 21H2.73l6.94-7.93L2.25 3h6.13l4.23 5.59L17.53 3Zm-1.04 16.2h1.65L7.6 4.71H5.83L16.49 19.2Z" />
        </svg>
      </a>
    </footer>
  );
}
