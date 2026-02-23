import { useTranslation } from 'react-i18next';

interface Props {
  currentMl: number;
  goalMl: number;
  /** Compact mode: smaller glass, no text labels below */
  compact?: boolean;
}

function getColor(pct: number): { fill: string; light: string } {
  if (pct < 30) return { fill: '#ef4444', light: 'rgba(239,68,68,0.15)' };
  if (pct < 60) return { fill: '#f97316', light: 'rgba(249,115,22,0.15)' };
  if (pct < 90) return { fill: '#eab308', light: 'rgba(234,179,8,0.15)' };
  return { fill: '#22c55e', light: 'rgba(34,197,94,0.15)' };
}

export default function WaterGlass({ currentMl, goalMl, compact = false }: Props) {
  const { t } = useTranslation();
  const pct = Math.min(100, Math.max(0, (currentMl / goalMl) * 100));
  const { fill: color } = getColor(pct);
  const waterY = 148 - (pct / 100) * 138;

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        {/* Glass SVG — compact */}
        <div className="relative w-[72px] h-24">
          <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-sm">
            <defs>
              <clipPath id="glassClipC">
                <path d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z" />
              </clipPath>
              <linearGradient id="waterGradC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.85" />
                <stop offset="100%" stopColor={color} stopOpacity="0.65" />
              </linearGradient>
            </defs>
            <path
              d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z"
              fill="currentColor"
              className="text-gray-50 dark:text-gray-700"
            />
            <rect
              x="0" y={waterY}
              width="100" height={(pct / 100) * 138 + 10}
              fill="url(#waterGradC)"
              clipPath="url(#glassClipC)"
              className="transition-all duration-700 ease-out"
            />
            {pct > 0 && (
              <g clipPath="url(#glassClipC)">
                <path
                  d={`M-10,${waterY} Q15,${waterY - 4} 40,${waterY} T90,${waterY} T140,${waterY} V155 H-10 Z`}
                  fill={color} opacity="0.35"
                  className="transition-all duration-700 ease-out"
                >
                  <animateTransform attributeName="transform" type="translate"
                    values="-40,0;0,0;-40,0" dur="2.5s" repeatCount="indefinite" />
                </path>
              </g>
            )}
            <path
              d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z"
              fill="none" stroke="currentColor" strokeWidth="2"
              className="text-gray-200 dark:text-gray-600"
            />
            <path d="M20,20 L17,80" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
          </svg>
          {/* Percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold tabular-nums drop-shadow"
              style={{ color: pct > 50 ? '#fff' : color }}>
              {Math.round(pct)}%
            </span>
          </div>
        </div>
        {/* Current/Goal */}
        <p className="text-[11px] font-semibold tabular-nums text-center leading-tight">
          <span style={{ color }}>{currentMl}</span>
          <span className="text-gray-400 dark:text-gray-500 font-normal"> / {goalMl} {t('common.ml')}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Glass SVG */}
      <div className="relative w-36 h-52">
        <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-sm">
          <defs>
            <clipPath id="glassClip">
              <path d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z" />
            </clipPath>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={color} stopOpacity="0.65" />
            </linearGradient>
          </defs>
          <path
            d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z"
            fill="currentColor"
            className="text-gray-50 dark:text-gray-700"
          />
          <rect
            x="0" y={waterY}
            width="100" height={(pct / 100) * 138 + 10}
            fill="url(#waterGrad)"
            clipPath="url(#glassClip)"
            className="transition-all duration-700 ease-out"
          />
          {pct > 0 && (
            <g clipPath="url(#glassClip)">
              <path
                d={`M-10,${waterY} Q15,${waterY - 5} 40,${waterY} T90,${waterY} T140,${waterY} V155 H-10 Z`}
                fill={color} opacity="0.35"
                className="transition-all duration-700 ease-out"
              >
                <animateTransform attributeName="transform" type="translate"
                  values="-40,0;0,0;-40,0" dur="2.5s" repeatCount="indefinite" />
              </path>
            </g>
          )}
          <path
            d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z"
            fill="none" stroke="currentColor" strokeWidth="2"
            className="text-gray-200 dark:text-gray-600"
          />
          <path d="M20,20 L17,80" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold tabular-nums drop-shadow"
            style={{ color: pct > 50 ? '#fff' : color }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      {/* Numeric display */}
      <div className="text-center">
        <p className="text-lg font-bold tabular-nums">
          <span style={{ color }}>{currentMl}</span>
          <span className="text-gray-400 dark:text-gray-500 font-normal mx-1">/</span>
          <span className="text-gray-600 dark:text-gray-300">{goalMl}</span>
          <span className="text-sm font-normal text-gray-400 ml-1">{t('common.ml')}</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('dashboard.waterEquivalent')}</p>
      </div>
    </div>
  );
}
