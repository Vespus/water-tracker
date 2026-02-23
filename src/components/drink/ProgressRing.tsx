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

/** Returns a hex color based on progress percentage */
export function getProgressColor(pct: number): string {
  if (pct < 30) return '#ef4444'; // red
  if (pct < 50) return '#f97316'; // orange
  if (pct < 70) return '#eab308'; // yellow
  if (pct < 90) return '#22c55e'; // green
  return '#06b6d4';               // cyan/blue
}

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
        {/* Glass body */}
        <path
          d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z"
          fill="currentColor"
          className="text-gray-100 dark:text-gray-700"
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
          fill="none" stroke="currentColor" strokeWidth="4"
          className="text-gray-200 dark:text-gray-600"
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
  const color = getProgressColor(pct);

  // SVG ring parameters
  const size = 220;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Ring SVG */}
        <svg
          width={size}
          height={size}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100 dark:text-gray-800"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: 'stroke-dashoffset 0.7s ease-out, stroke 0.5s ease',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          {/* Mini glass icon */}
          <MiniGlass color={color} pct={pct} />

          {/* Total ml — big number */}
          <p className="text-2xl font-bold tabular-nums mt-1" style={{ color }}>
            {totalMl}
            <span className="text-sm font-normal text-gray-400 ml-0.5">ml</span>
          </p>

          {/* "Total" label */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            {t('dashboard.totalLabel')}
          </p>

          {/* Hydration line */}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            {t('dashboard.hydrationLabel', { amount: waterEquivalentMl })}
          </p>
        </div>
      </div>
    </div>
  );
}
