/** Petits dessins à la main, en SVG inline (zéro requête réseau). */

export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 18" fill="none" aria-hidden className={className} preserveAspectRatio="none">
      <path
        d="M3 12c18-8 30-8 44-2s26 6 40-1 28-8 42-1 26 7 40 0 20-6 28-3"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Burst({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <span className={`relative inline-grid place-items-center ${className}`}>
      <svg viewBox="0 0 120 120" aria-hidden className="absolute inset-0 h-full w-full">
        <path
          d="M60 4l9 17 18-9 2 20 20-1-6 19 18 8-14 14 13 15-19 6 4 20-20-3-5 19-17-11-15 13-6-19-19 5 3-20-19-6 13-15-14-14 18-8-6-19 20 1 2-20 18 9z"
          fill="currentColor"
          stroke="#1b1a17"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <span className="relative text-encre">{children}</span>
    </span>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" fill="none" aria-hidden className={className}>
      <path d="M4 8c14 22 30 26 48 22" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M42 22l10 8-12 5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
