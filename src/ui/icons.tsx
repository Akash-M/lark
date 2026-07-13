import type { ReactNode } from 'react';

/** Minimal outline icon set (stroke-based, no fills, no emojis). */
function Svg({ size = 22, children, className }: { size?: number; children: ReactNode; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type P = { size?: number; className?: string };

export const IconHeart = (p: P) => (
  <Svg {...p}><path d="M12 21C12 21 4 13.9 4 8.8C4 6.1 6.1 4 8.8 4C10.4 4 11.6 5 12 5.9C12.4 5 13.6 4 15.2 4C17.9 4 20 6.1 20 8.8C20 13.9 12 21 12 21Z" /></Svg>
);
export const IconFlag = (p: P) => (
  <Svg {...p}><path d="M6 21V4M6 4h9l-2 3.5L15 11H6" /></Svg>
);
export const IconCompass = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M15.3 8.7l-1.8 4.8-4.8 1.8 1.8-4.8z" /></Svg>
);
export const IconMap = (p: P) => (
  <Svg {...p}><path d="M9 4 3 7v13l6-3 6 3 6-3V4l-6 3-6-3z" /><path d="M9 4v13M15 7v13" /></Svg>
);
export const IconNav = (p: P) => (
  <Svg {...p}><path d="M12 4 19 20 12 16 5 20z" /></Svg>
);
export const IconPlus = (p: P) => (
  <Svg {...p}><path d="M12 6v12M6 12h12" /></Svg>
);
export const IconMinus = (p: P) => (
  <Svg {...p}><path d="M6 12h12" /></Svg>
);
export const IconCopy = (p: P) => (
  <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5.8A1.8 1.8 0 0 1 6.8 4H15" /></Svg>
);
export const IconLogout = (p: P) => (
  <Svg {...p}><path d="M14 4h4.2A1.8 1.8 0 0 1 20 5.8v12.4A1.8 1.8 0 0 1 18.2 20H14" /><path d="M10 16l4-4-4-4" /><path d="M14 12H4" /></Svg>
);
export const IconTrophy = (p: P) => (
  <Svg {...p}><path d="M8 21h8M12 17v4" /><path d="M7 4h10v4a5 5 0 0 1-10 0V4z" /><path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11" /></Svg>
);
export const IconClock = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
);
export const IconCheck = (p: P) => (
  <Svg {...p}><path d="M5 12l4.5 4.5L19 7" /></Svg>
);
