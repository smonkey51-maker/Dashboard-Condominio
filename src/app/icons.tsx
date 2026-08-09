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
