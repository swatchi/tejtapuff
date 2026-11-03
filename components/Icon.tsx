/**
 * Icônes dessinées (traits arrondis, couleur du texte). Remplacent les émojis sur tout le site.
 * Usage : <Icon name="lock" className="h-5 w-5" />
 */

const P: Record<string, React.ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  circle: <circle cx="12" cy="12" r="8" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  exit: (
    <>
      <path d="M10 4.5H6.5A2 2 0 0 0 4.5 6.5v11a2 2 0 0 0 2 2H10" />
      <path d="M14.5 8l4 4-4 4" />
      <path d="M18.5 12H9" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7l1 12a2 2 0 0 0 2 1.8h5a2 2 0 0 0 2-1.8l1-12" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />,
  building: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M5.5 20.5V4.5h9v16" />
      <path d="M14.5 9.5h4v11" />
      <path d="M8.5 8h3M8.5 11.5h3M8.5 15h3" />
    </>
  ),
  phone: (
    <path d="M6.6 3.5h2.9l1.5 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.5v2.9a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" />
  ),
  chat: <path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9.5A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 5 4.5z" />,
  camera: (
    <>
      <rect x="3.5" y="7" width="17" height="12.5" rx="2.5" />
      <path d="M8.5 7l1.5-2.5h4L15.5 7" />
      <circle cx="12" cy="13.2" r="3.3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sunrise: (
    <>
      <path d="M3.5 18.5h17" />
      <path d="M7 18.5a5 5 0 0 1 10 0" />
      <path d="M12 4.5v3M5.4 9.4l1.9 1.9M18.6 9.4l-1.9 1.9" />
    </>
  ),
  flame: (
    <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.5 2.6-5.4 3.7-8.9 2 1.3 3 3 3.3 4.8.8-.6 1.4-1.6 1.6-2.8 2.4 1.9 4.4 4.4 4.4 6.9C18.5 18.4 15.9 21 12 21z" />
  ),
  star: <path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />,
  rocket: (
    <>
      <path d="M14.2 4.6c2.6-.9 4.7-.9 5.2-.1.8.6.8 2.6-.1 5.2L13 16.1 7.9 11z" />
      <path d="M7.9 11l-3.2 1-1.3 3 3.9-.9M13 16.1l-1 3.2-3 1.3.9-3.9" />
      <circle cx="15.6" cy="8.4" r="1.4" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5.2a3 3 0 0 0 3 4M16 6h2.8a3 3 0 0 1-3 4" />
      <path d="M12 13v3.5M8.5 20.5h7M10 16.5h4v4h-4z" />
    </>
  ),
  crown: (
    <>
      <path d="M4 8l4.2 4.2L12 5l3.8 7.2L20 8l-1.6 10H5.6z" />
      <path d="M5.6 20.5h12.8" />
    </>
  ),
  zap: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
  shield: (
    <>
      <path d="M12 3.5l7 2.5v5.6c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.6L7.6 21l4.4-2.4 4.4 2.4L15 13.6" />
    </>
  ),
  euro: (
    <>
      <path d="M17.5 6.6a6.5 6.5 0 1 0 0 10.8" />
      <path d="M4.5 10.5h8.5M4.5 13.5h8.5" />
    </>
  ),
  smartphone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17.3v.2" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V4M8 7.5L12 4l4 3.5" />
      <path d="M6 11v8.5h12V11" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M5 20.5a7 7 0 0 1 14 0" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-6.5 8 6.5" />
      <path d="M6.5 9.5v10.5h11V9.5" />
    </>
  ),
};

export type IconName = keyof typeof P;

export function Icon({ name, className = "h-5 w-5", strokeWidth = 2.4 }: { name: IconName | string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {P[name] ?? P.circle}
    </svg>
  );
}
