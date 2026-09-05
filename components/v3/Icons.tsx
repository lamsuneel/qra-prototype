import type { Domain } from "@/types";

/**
 * The line icons the v3 screens use.
 *
 * Every one draws with `currentColor` so the colour is set by the element
 * around it — the design gives each icon a different tone depending on what
 * it sits beside, and passing that through the text colour keeps the icon and
 * its label from ever disagreeing.
 */

type IconProps = { size?: number };

const svg = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function SearchIcon({ size = 14 }: IconProps) {
  return (
    <svg {...svg(size)} strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function LayersIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <rect x="2" y="15" width="20" height="5" rx="1" />
      <rect x="2" y="9" width="20" height="5" rx="1" />
      <rect x="2" y="3" width="20" height="5" rx="1" />
    </svg>
  );
}

export function AlertCircleIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function ClockIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function TargetIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function CapsuleIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <rect x="6" y="2" width="12" height="20" rx="6" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );
}

function MaterialIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
    </svg>
  );
}

function BoxIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ActivityIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function MicroscopeIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <circle cx="12" cy="15" r="5" />
      <line x1="12" y1="10" x2="12" y2="4" />
      <line x1="10" y1="4" x2="14" y2="4" />
      <line x1="10" y1="7" x2="14" y2="7" />
    </svg>
  );
}

export function DocumentIcon({ size = 18 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export function LockIcon({ size = 12 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function SendIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function RefreshIcon({ size = 12 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" />
    </svg>
  );
}

/**
 * AIRA's own mark. Drawn filled rather than stroked so it reads at 18px
 * inside the avatar disc, where a 1.8px outline disappears.
 */
export function AiraGlyph({
  size = 24,
  colour = "currentColor",
}: IconProps & { colour?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" fill={colour} />
      <path
        d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"
        stroke={colour}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** One icon per review domain, in the order the dashboard lists them. */
export const DOMAIN_ICON: Record<
  Domain,
  (props: IconProps) => React.ReactElement
> = {
  FINISHED_PRODUCT: CapsuleIcon,
  RAW_MATERIAL: MaterialIcon,
  PACKING_MATERIAL: BoxIcon,
  IPFP: ActivityIcon,
  STABILITY: ClockIcon,
  MICROBIOLOGY: MicroscopeIcon,
};
