import { useTranslation } from 'react-i18next';

interface Props {
  currentMl: number;
  goalMl: number;
}

function getColor(pct: number): string {
  if (pct < 30) return '#ef4444';    // red
  if (pct < 60) return '#f97316';    // orange
  if (pct < 90) return '#eab308';    // yellow
  return '#22c55e';                   // green
}

export default function WaterGlass({ currentMl, goalMl }: Props) {
  const { t } = useTranslation();
  const pct = Math.min(100, Math.max(0, (currentMl / goalMl) * 100));
  const color = getColor(pct);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Glass SVG */}
      <div className="relative w-32 h-48">
        <svg viewBox="0 0 100 150" className="w-full h-full">
          {/* Glass outline */}
          <path
            d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-gray-300 dark:text-gray-600"
          />
          {/* Glass clip */}
          <defs>
            <clipPath id="glassClip">
              <path d="M15,10 L10,140 Q10,148 18,148 L82,148 Q90,148 90,140 L85,10 Z" />
            </clipPath>
          </defs>
          {/* Water fill */}
          <rect
            x="0"
            y={148 - (pct / 100) * 138}
            width="100"
            height={(pct / 100) * 138}
            fill={color}
            opacity="0.6"
            clipPath="url(#glassClip)"
            className="transition-all duration-700 ease-out"
          />
          {/* Wave animation */}
          {pct > 0 && (
            <g clipPath="url(#glassClip)">
              <path
                d={`M0,${148 - (pct / 100) * 138} Q25,${148 - (pct / 100) * 138 - 4} 50,${148 - (pct / 100) * 138} T100,${148 - (pct / 100) * 138} V150 H0 Z`}
                fill={color}
                opacity="0.4"
                className="transition-all duration-700 ease-out"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0;4,0;0,0;-4,0;0,0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          )}
        </svg>
        {/* Percentage label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold drop-shadow-sm" style={{ color: pct > 45 ? '#fff' : color }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      {/* Numeric display */}
      <div className="text-center">
        <p className="text-lg font-semibold">{currentMl} / {goalMl} {t('common.ml')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.waterEquivalent')}</p>
      </div>
    </div>
  );
}
