"use client";

import { useId } from "react";
import Link from "next/link";

/**
 * The NeuraTrace mark and wordmark.
 *
 * Both are the locked brand asset, rendered from the source SVG rather than
 * redrawn: the waveform's geometry and the wordmark's two-tone split are the
 * identity, and an approximation of either would be a different logo. Size is
 * the caller's business; colour and proportion are not.
 *
 * The gradients and filters are referenced by id, and an id is document-wide.
 * Two lockups on one page would otherwise share whichever set the browser
 * parsed first, so each instance mints its own.
 */

/** React's generated ids carry colons, which a url(#…) reference cannot use. */
const useSvgId = () => useId().replace(/:/g, "");

/* -------------------------------------------------------------------------- */
/* The mark — the N as a signal traced from a dim source to a bright one       */
/* -------------------------------------------------------------------------- */

export function NeuraTraceMark({
  size = 72,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const id = useSvgId();
  const teal = `nt-teal-${id}`;
  const glow = `nt-glow-${id}`;
  const shadow = `nt-shadow-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="270 90 490 490"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={teal} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9af7e8" />
          <stop offset="38%" stopColor="#19d9d0" />
          <stop offset="100%" stopColor="#00a9c7" />
        </linearGradient>
        <filter id={glow} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="12" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={shadow} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="10"
            floodColor="#00d9d4"
            floodOpacity=".22"
          />
        </filter>
      </defs>

      <g filter={`url(#${shadow})`}>
        <path
          d="M350 366 H414 C452 366 466 345 466 310 V273 C466 239 492 226 516 252 L617 363 C643 392 672 380 672 344 V271 C672 246 688 230 713 230 H718"
          fill="none"
          stroke={`url(#${teal})`}
          strokeWidth="29"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M474 267 L617 420"
          fill="none"
          stroke="#70fff0"
          strokeOpacity=".36"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M713 230 V274"
          fill="none"
          stroke={`url(#${teal})`}
          strokeWidth="18"
          strokeLinecap="round"
        />
      </g>

      {/* Where the trace starts, and where it arrives. */}
      <circle
        cx="350"
        cy="366"
        r="18"
        fill="#3d7e9d"
        opacity=".85"
        filter={`url(#${glow})`}
      />
      <circle
        cx="718"
        cy="230"
        r="22"
        fill="#b4fff1"
        filter={`url(#${glow})`}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* The mark in its container                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The mark on its own ground: a dark rounded square with the teal held just
 * outside it. The glow is what keeps an 82px logo from reading as an icon.
 */
export function NeuraTraceGlyph({
  box = 82,
  mark = 72,
}: {
  box?: number;
  mark?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden bg-[#050C14]"
      style={{
        width: box,
        height: box,
        border: "1.5px solid rgba(0, 212, 164, 0.45)",
        borderRadius: Math.round(box * 0.22),
        boxShadow:
          "0 0 24px rgba(0, 212, 164, 0.22), 0 0 8px rgba(0, 212, 164, 0.12)",
      }}
    >
      <NeuraTraceMark size={mark} />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* The wordmark                                                               */
/* -------------------------------------------------------------------------- */

/**
 * "Neura" in the text colour, "Trace" in the brand gradient.
 *
 * Set in the brand face rather than the interface one, which is why it is an
 * SVG and not a span: the wordmark should not shift when the UI font does.
 */
export function NeuraTraceWordmark({
  width = 440,
  className = "",
}: {
  width?: number;
  className?: string;
}) {
  const id = useSvgId();
  const trace = `nt-trace-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      /* The source viewBox' own ratio — the lockup must not stretch. */
      height={Math.round((width * 72) / 440)}
      viewBox="782 243 1185 165"
      role="img"
      aria-label="NeuraTrace"
      className={className}
    >
      <defs>
        <linearGradient id={trace} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#36f5d1" />
          <stop offset="100%" stopColor="#19e9d1" />
        </linearGradient>
      </defs>
      <text
        x="794"
        y="373"
        fontFamily="Helvetica Neue, Arial, sans-serif"
        fontSize="166"
        fontWeight="300"
        letterSpacing="-5"
      >
        <tspan fill="#f4f4f4">Neura</tspan>
        <tspan fill={`url(#${trace})`}>Trace</tspan>
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* The lockup                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Mark and wordmark side by side.
 *
 * Everywhere but the sign-in screen this is a link back to it: the logo is
 * the one thing on every screen, so it is where a reviewer will click to get
 * out of wherever they are, and switching desks is what "out" means here.
 */
export function NeuraTraceLockup({
  box = 82,
  mark = 72,
  wordmark = 440,
  gap = 22,
  href,
}: {
  box?: number;
  mark?: number;
  wordmark?: number;
  gap?: number;
  /** Omitted on the sign-in screen, which is where this would lead. */
  href?: string;
}) {
  const lockup = (
    <>
      <NeuraTraceGlyph box={box} mark={mark} />
      <NeuraTraceWordmark width={wordmark} />
    </>
  );

  if (!href) {
    return (
      <span className="flex items-center" style={{ gap }}>
        {lockup}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label="NeuraTrace — back to profile selection"
      className="flex items-center rounded-[8px] transition-opacity duration-[120ms] hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--v3-accent)]"
      style={{ gap }}
    >
      {lockup}
    </Link>
  );
}
