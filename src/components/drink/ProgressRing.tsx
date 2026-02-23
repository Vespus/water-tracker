import { useTranslation } from 'react-i18next';

interface Props {
  /** Water equivalent consumed (used for progress calculation) */
  currentMl: number;
  /** Daily goal in ml */
  goalMl: number;
  /** Raw total volume consumed (displayed in center) */
  totalMl: number;
  /** Water equivalent consumed (displayed as "Hydration") */
  waterEquivalentMl: number;
}

/**
 * Returns a hex color for the GLASS FILL based on progress percentage.
 * 0–30%: red | 30–60%: orange | 60–85%: yellow | 85–100%: blue
 * (No green stage.)
 */
export function getGlassColor(pct: number): string {
  if (pct < 30) return '#ef4444'; // red
  if (pct < 60) return '#f97316'; // orange
  if (pct < 85) return '#eab308'; // yellow
  return '#3b82f6';               // blue
}

/**
 * @deprecated Use getGlassColor instead.
 * Kept for backwards-compatibility with any existing imports.
 */
export const getProgressColor = getGlassColor;

/** Mini glass SVG used in the ring center */
function MiniGlass({ color, pct }: { color: string; pct: number }) {
  const waterY = 148 - (pct / 100) * 138;
  const clipId = 'miniGlassClip';
  const gradId = 'miniWaterGrad';

  return (
    <div className="relative w-[32px] h-[48px]">
      <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-sm">
        <defs>
          <clipPath id={clipId}>
            <path d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z" />
          </clipPath>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.65" />
          </linearGradient>
        </defs>
        {/* Glass body — semi-transparent */}
        <path
          d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z"
          fill="rgba(255,255,255,0.2)"
        />
        {/* Water fill */}
        <rect
          x="0" y={waterY}
          width="100" height={(pct / 100) * 138 + 10}
          fill={`url(#${gradId})`}
          clipPath={`url(#${clipId})`}
        />
        {/* Glass outline */}
        <path
          d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z"
          fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="4"
        />
        {/* Glass shine */}
        <path d="M22,18 L18,75" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.45" />
      </svg>
    </div>
  );
}

export default function ProgressRing({ currentMl, goalMl, totalMl, waterEquivalentMl }: Props) {
  const { t } = useTranslation();

  const pct = Math.min(100, Math.max(0, (currentMl / goalMl) * 100));

  // Glass fill color (changes with progress)
  const glassColor = getGlassColor(pct);

  // SVG ring parameters
  const size = 220;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  // Unique gradient IDs (stable per component)
  const ringGradId = 'progressRingBlueGrad';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Ring SVG */}
        <svg
          width={size}
          height={size}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            {/*
              Blue water-theme gradient for the ring stroke.
              Always cyan → sky → blue — never changes with progress level.
              Direction: top-left to bottom-right for a natural water feel.
            */}
            <linearGradient
              id={ringGradId}
              x1="0%" y1="0%"
              x2="100%" y2="100%"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%"   stopColor="#a5f3fc" /> {/* cyan-200 — bright on dark bg */}
              <stop offset="50%"  stopColor="#38bdf8" /> {/* sky-400    */}
              <stop offset="100%" stopColor="#60a5fa" /> {/* blue-400   */}
            </linearGradient>
          </defs>

          {/* Track circle — semi-transparent white (works on both light & dark gradient) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc — always blue gradient */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${ringGradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: 'stroke-dashoffset 0.7s ease-out',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          {/* Mini glass icon — color follows progress stage */}
          <MiniGlass color={glassColor} pct={pct} />

          {/* Total ml — big number, white with drop shadow */}
          <p className="text-2xl font-bold tabular-nums mt-1 text-white drop-shadow-md">
            {totalMl}
            <span className="text-sm font-normal text-white/70 ml-0.5">ml</span>
          </p>

          {/* "Total" label */}
          <p className="text-[11px] text-white/70 font-medium drop-shadow-sm">
            {t('dashboard.totalLabel')}
          </p>

          {/* Hydration line */}
          <p className="text-[10px] text-white/50 mt-0.5">
            {t('dashboard.hydrationLabel', { amount: waterEquivalentMl })}
          </p>
        </div>
      </div>
    </div>
  );
}
