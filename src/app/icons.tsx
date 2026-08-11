type IconProps = { className?: string };

const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function IconHome({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

export function IconCoin({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9a3 3 0 0 0-2.5-1.3c-1.9 0-3.4 1.5-3.4 3.4v1.8c0 1.9 1.5 3.4 3.4 3.4A3 3 0 0 0 14.5 15" />
      <path d="M7.5 10.5h4.5M7.5 13.5h4.5" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="9" cy="8.3" r="3" />
      <path d="M3.5 20c0-3.3 2.5-5.8 5.5-5.8s5.5 2.5 5.5 5.8" />
      <circle cx="17" cy="9.3" r="2.3" />
      <path d="M15.3 14.5c2.4.5 4.2 2.7 4.4 5.5" />
    </svg>
  );
}

export function IconFile({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M7 3.5h6.5L18 8v12.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M13.5 3.5V8H18" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  );
}

export function IconLink({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 7.5 12.7 5.8a3.3 3.3 0 0 1 4.7 4.7L15.7 12" />
      <path d="M13 16.5 11.3 18.2a3.3 3.3 0 0 1-4.7-4.7L8.3 12" />
    </svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6.5 10a5.5 5.5 0 1 1 11 0c0 4 1.5 5.3 1.5 5.3H5S6.5 14 6.5 10Z" />
      <path d="M10.2 18.5a1.9 1.9 0 0 0 3.6 0" />
    </svg>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 21s7-7.3 7-12.2A7 7 0 1 0 5 8.8C5 13.7 12 21 12 21Z" />
      <circle cx="12" cy="8.8" r="2.4" />
    </svg>
  );
}

export function IconMore({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.7v2.4M12 17.9v2.4M4.6 6.7l1.7 1.7M17.7 15.6l1.7 1.7M3.7 12h2.4M17.9 12h2.4M4.6 17.3l1.7-1.7M17.7 8.4l1.7-1.7" />
    </svg>
  );
}

export function IconRefresh({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 0 1 12.7-5.4M19.5 12a7.5 7.5 0 0 1-12.7 5.4" />
      <path d="M17.6 4.3v3.3h-3.3M6.4 19.7v-3.3h3.3" />
    </svg>
  );
}
