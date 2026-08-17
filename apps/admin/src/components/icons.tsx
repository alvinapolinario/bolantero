export type IconName =
  | "overview"
  | "verify"
  | "store"
  | "delivery"
  | "trip"
  | "fees"
  | "reports"
  | "account"
  | "menu"
  | "close";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "verify":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 8.5 4.2-1.1 7-4.3 7-8.5V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "store":
      return (
        <svg {...common}>
          <path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />
          <path d="M4 7h16l-1.2-3.2A1 1 0 0 0 17.9 3H6.1a1 1 0 0 0-.9.8L4 7Z" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "delivery":
      return (
        <svg {...common}>
          <path d="M3 7h11v10H3z" />
          <path d="M14 10h4l3 3v4h-7" />
          <circle cx="7.5" cy="18.5" r="1.5" />
          <circle cx="17.5" cy="18.5" r="1.5" />
        </svg>
      );
    case "trip":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 5v2M12 17v2M5 12H3M21 12h-2M7 7l1.4 1.4M15.6 15.6 17 17M17 7l-1.4 1.4M8.4 15.6 7 17" />
        </svg>
      );
    case "fees":
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M16.5 7.5c0-1.9-2-3.5-4.5-3.5S7.5 5.6 7.5 7.5 9.5 11 12 11s4.5 1.6 4.5 3.5S14.5 18 12 18s-4.5-1.6-4.5-3.5" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15v-4" />
          <path d="M12 15V8" />
          <path d="M16 15v-7" />
        </svg>
      );
    case "account":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
  }
}
