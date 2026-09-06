import React from 'react'

export type LogoSize = 16 | 24 | 32 | 48 | 64

interface LogoProps {
  size?: number
  className?: string
  color?: string
  accentColor?: string
  dark?: boolean
}

interface LockupProps extends LogoProps {
  wordmarkColor?: string
  accentTextColor?: string
  fontSize?: number
  showBadge?: boolean
}

// ─────────────────────────────────────────────────────────────
// BRAND LOGO SYSTEM — DealFlow360
// Chosen Brand Mark: Concept 1 ("The Quadrant Möbius")
// ─────────────────────────────────────────────────────────────

export { Concept1Icon as LogoIcon, Concept1Lockup as Logo }


export const Concept1Icon: React.FC<LogoProps> = ({
  size = 32,
  color,
  accentColor,
  dark = false,
  className,
}) => {
  const primary = color || (dark ? '#F8FAFC' : '#0F172A')
  const accent = accentColor || '#C08552'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DealFlow360 Quadrant Loop"
    >
      {/* Stage 1: Quotation (Top Horizon) */}
      <path
        d="M10 10H34L30 18H10V10Z"
        fill={primary}
      />
      {/* Stage 2: Approval (Right Vertical Descent) */}
      <path
        d="M38 14V38L30 34V18L38 14Z"
        fill={primary}
        opacity={0.88}
      />
      {/* Stage 3: Fulfillment (Bottom Horizon) */}
      <path
        d="M38 38H14L18 30H38V38Z"
        fill={primary}
        opacity={0.76}
      />
      {/* Stage 4: Billing & Reconciliation (Left Ascent - Closes Loop into Center) */}
      <path
        d="M10 34V10L18 14V30L10 34Z"
        fill={accent}
      />
      {/* Center Precision Aperture Accent Dot (16px scale anchor) */}
      <rect
        x="21"
        y="21"
        width="6"
        height="6"
        transform="rotate(45 24 24)"
        fill={accent}
      />
    </svg>
  )
}

export const Concept1Lockup: React.FC<LockupProps> = ({
  size = 32,
  dark = false,
  wordmarkColor,
  accentTextColor,
  className,
}) => {
  const textColor = wordmarkColor || (dark ? '#F8FAFC' : '#10192B')
  const numColor = accentTextColor || '#C08552'

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.35 }}
      className={className}
    >
      <Concept1Icon size={size} dark={dark} />
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          fontSize: `${size * 0.65}px`,
          fontWeight: 700,
          letterSpacing: '-0.035em',
          color: textColor,
          display: 'inline-flex',
          alignItems: 'baseline',
          lineHeight: 1,
        }}
      >
        DealFlow
        <span
          style={{
            fontWeight: 500,
            color: numColor,
            marginLeft: '2px',
            letterSpacing: '-0.02em',
          }}
        >
          360
        </span>
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CONCEPT 2: "The Aperture 'D'" (Negative-Space Lettermark)
// Bold, architectural capital 'D' composed of 4 progressive
// pipeline sectors with an optical conduit inside.
// ─────────────────────────────────────────────────────────────

export const Concept2Icon: React.FC<LogoProps> = ({
  size = 32,
  color,
  accentColor,
  dark = false,
  className,
}) => {
  const primary = color || (dark ? '#F8FAFC' : '#0F172A')
  const accent = accentColor || '#4F46E5'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DealFlow360 Quadrant Shutter"
    >
      {/* Blade 1: Quotation (Top-Left Blade) */}
      <path
        d="M8 8H32L24 16H8V8Z"
        fill={primary}
      />
      <rect x="8" y="16" width="8" height="12" fill={primary} />

      {/* Blade 2: Approval (Top-Right Blade) */}
      <path
        d="M40 8V32L32 24V8H40Z"
        fill={primary}
        opacity={0.88}
      />
      <rect x="24" y="8" width="12" height="8" fill={primary} opacity={0.88} />

      {/* Blade 3: Fulfillment (Bottom-Right Blade) */}
      <path
        d="M40 40H16L24 32H40V40Z"
        fill={primary}
        opacity={0.76}
      />
      <rect x="32" y="20" width="8" height="12" fill={primary} opacity={0.76} />

      {/* Blade 4: Billing (Bottom-Left Blade - Active Accent) */}
      <path
        d="M8 40V16L16 24V40H8Z"
        fill={accent}
      />
      <rect x="12" y="32" width="12" height="8" fill={accent} />

      {/* Focal Aperture Core (Negative Space Core Indicator) */}
      <rect x="22" y="22" width="4" height="4" fill={accent} />
    </svg>
  )
}

export const Concept2Lockup: React.FC<LockupProps> = ({
  size = 32,
  dark = false,
  wordmarkColor,
  accentTextColor,
  className,
}) => {
  const textColor = wordmarkColor || (dark ? '#F8FAFC' : '#0F172A')
  const numColor = accentTextColor || '#4F46E5'

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.35 }}
      className={className}
    >
      <Concept2Icon size={size} dark={dark} />
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          fontSize: `${size * 0.65}px`,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: textColor,
          display: 'inline-flex',
          alignItems: 'baseline',
          lineHeight: 1,
        }}
      >
        DEALFLOW
        <span
          style={{
            fontWeight: 400,
            fontSize: `${size * 0.55}px`,
            color: numColor,
            marginLeft: '3px',
            padding: '1px 4px',
            borderRadius: '3px',
            backgroundColor: dark ? '#312E81' : '#EEF2FF',
          }}
        >
          360
        </span>
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CONCEPT 3: "The Vector Orbit 360" (Precision Schematic Track)
// High-density Swiss technical conduit with 4 coordinate nodes
// and an unbroken 360-degree re-entrant trajectory.
// ─────────────────────────────────────────────────────────────

export const Concept3Icon: React.FC<LogoProps> = ({
  size = 32,
  color,
  accentColor,
  dark = false,
  className,
}) => {
  const strokeColor = color || (dark ? '#F1F5F9' : '#0F172A')
  const accent = accentColor || '#4F46E5'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DealFlow360 Vector Orbit"
    >
      {/* Outer 360 Orbit Perimeter Path */}
      <path
        d="M24 8C32.8366 8 40 15.1634 40 24C40 32.8366 32.8366 40 24 40C15.1634 40 8 32.8366 8 24C8 16.5 13.5 10.2 20.5 8.5"
        stroke={strokeColor}
        strokeWidth="3.75"
        strokeLinecap="round"
      />
      {/* Inward Re-entrant Flow Conduit (Fulfillment to Cash) */}
      <path
        d="M20.5 8.5C22.5 14 26 18 31 20"
        stroke={accent}
        strokeWidth="3.75"
        strokeLinecap="round"
      />
      {/* Milestone Nodes at 4 cardinal axes */}
      {/* Quote: Top */}
      <circle cx="24" cy="8" r="2.5" fill={strokeColor} />
      {/* Approve: Right */}
      <circle cx="40" cy="24" r="2.5" fill={strokeColor} />
      {/* Fulfill: Bottom */}
      <circle cx="24" cy="40" r="2.5" fill={strokeColor} />
      {/* Bill: Inner target convergence */}
      <circle cx="31" cy="20" r="3" fill={accent} />
    </svg>
  )
}

export const Concept3Lockup: React.FC<LockupProps> = ({
  size = 32,
  dark = false,
  wordmarkColor,
  accentTextColor,
  className,
}) => {
  const textColor = wordmarkColor || (dark ? '#F8FAFC' : '#0F172A')
  const accent = accentTextColor || '#4F46E5'

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.35 }}
      className={className}
    >
      <Concept3Icon size={size} dark={dark} />
      <span
        style={{
          fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
          fontSize: `${size * 0.6}px`,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: textColor,
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 1,
        }}
      >
        DealFlow<span style={{ color: accent, fontWeight: 700 }}>.360</span>
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CONCEPT 4: "The Interlocking Facets" (Hexagonal 4-Pillar Prism)
// 4 interlocking quadrilateral planes that form a geometric 360 loop
// with an inner negative-space diamond aperture.
// ─────────────────────────────────────────────────────────────

export const Concept4Icon: React.FC<LogoProps> = ({
  size = 32,
  color,
  accentColor,
  dark = false,
  className,
}) => {
  const primary = color || (dark ? '#FFFFFF' : '#09090B')
  const secondary = dark ? '#94A3B8' : '#334155'
  const accent = accentColor || '#4F46E5'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DealFlow360 Interlocking Prism"
    >
      {/* Quadrant 1 (North - Quotation) */}
      <path
        d="M24 6L38 16L31 20L24 15L17 20L10 16L24 6Z"
        fill={primary}
      />
      {/* Quadrant 2 (East - Approval) */}
      <path
        d="M38 16V32L31 28V20L38 16Z"
        fill={secondary}
      />
      {/* Quadrant 3 (South - Fulfillment) */}
      <path
        d="M38 32L24 42L10 32L17 28L24 33L31 28L38 32Z"
        fill={secondary}
        opacity={0.8}
      />
      {/* Quadrant 4 (West - Billing Reconciliation - Accent Milestone) */}
      <path
        d="M10 32V16L17 20V28L10 32Z"
        fill={accent}
      />
      {/* Center Negative-Space Core is implicitly created by the polygon offsets */}
    </svg>
  )
}

export const Concept4Lockup: React.FC<LockupProps> = ({
  size = 32,
  dark = false,
  wordmarkColor,
  accentTextColor,
  className,
}) => {
  const textColor = wordmarkColor || (dark ? '#F8FAFC' : '#0F172A')
  const numColor = accentTextColor || '#4F46E5'

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.35 }}
      className={className}
    >
      <Concept4Icon size={size} dark={dark} />
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          fontSize: `${size * 0.65}px`,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: textColor,
          display: 'inline-flex',
          alignItems: 'baseline',
          lineHeight: 1,
        }}
      >
        DealFlow
        <span
          style={{
            fontWeight: 800,
            color: numColor,
            marginLeft: '2px',
          }}
        >
          360°
        </span>
      </span>
    </div>
  )
}
