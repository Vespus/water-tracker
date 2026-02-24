import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTodayDrinks } from '../../hooks/useDrinks';

/** First and last tracked hour of the day */
const HOUR_START = 8;
const HOUR_END = 22;

/** Hours with no drink that trigger the gap-warning colour */
const GAP_HOURS = 3;

/** Minimum distinct hours with drinks before showing "Gut verteilt" badge */
const MIN_SPREAD_HOURS = 3;

interface HourSlot {
  h: number;
  hasDrink: boolean;
  ml: number;
  isFuture: boolean;
  isGap: boolean;
  barPct: number; // 0–1, proportion of the day's max hourly intake
}

export default function DailyTimeline() {
  const { t } = useTranslation();
  const entries = useTodayDrinks();
  const now = new Date();
  const currentHour = now.getHours();

  const { hourSlots, currentGapH } = useMemo(() => {
    // Aggregate ml per hour
    const mlByHour: Record<number, number> = {};
    for (const e of entries) {
      const h = new Date(e.timestamp).getHours();
      mlByHour[h] = (mlByHour[h] ?? 0) + e.amountMl;
    }

    // Sorted drink timestamps (ms) for gap calculation
    const drinkTimes = entries
      .map(e => new Date(e.timestamp).getTime())
      .sort((a, b) => a - b);

    const y = now.getFullYear();
    const mo = now.getMonth();
    const d = now.getDate();
    const nowMs = now.getTime();

    // Helper: ms for start of given hour on today
    const hourStartMs = (h: number) => new Date(y, mo, d, h, 0, 0).getTime();

    const maxMl = Math.max(...Object.values(mlByHour), 1);

    const hourSlots: HourSlot[] = [];

    for (let h = HOUR_START; h <= HOUR_END; h++) {
      const ml = mlByHour[h] ?? 0;
      const hasDrink = ml > 0;
      const isFuture = h > currentHour;
      let isGap = false;

      if (!isFuture && !hasDrink) {
        // Reference point: end of this hour (or now if it's the current hour)
        const refMs = h === currentHour ? nowMs : hourStartMs(h + 1);
        // Last drink before this reference point
        const lastDrink = [...drinkTimes].reverse().find(ts => ts < refMs);

        if (lastDrink === undefined) {
          // No drink at all before refMs — flag as gap if we're ≥ GAP_HOURS past HOUR_START
          const dayAnchor = hourStartMs(HOUR_START);
          if (refMs - dayAnchor >= GAP_HOURS * 3_600_000) {
            isGap = true;
          }
        } else {
          if (refMs - lastDrink >= GAP_HOURS * 3_600_000) {
            isGap = true;
          }
        }
      }

      hourSlots.push({
        h,
        hasDrink,
        ml,
        isFuture,
        isGap,
        barPct: hasDrink ? ml / maxMl : 0,
      });
    }

    // How many hours ago was the last drink?
    const lastTs = drinkTimes.length > 0 ? drinkTimes[drinkTimes.length - 1] : null;
    const currentGapH = lastTs ? (nowMs - lastTs) / 3_600_000 : null;

    return { hourSlots, currentGapH };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, currentHour]);

  const showWarning = currentGapH !== null && currentGapH >= GAP_HOURS;
  const drinkHoursCount = hourSlots.filter(s => s.hasDrink).length;
  const showOnTrack = !showWarning && drinkHoursCount >= MIN_SPREAD_HOURS;

  // Max bar height in px
  const BAR_MAX_H = 32;
  const BAR_MIN_H = 3;

  return (
    <div className="px-4 mt-2">
      <div className="bg-white/[0.07] backdrop-blur-sm rounded-2xl px-3 pt-3 pb-2 border border-white/10">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] text-blue-200/60 uppercase font-semibold tracking-wider">
            {t('timeline.title')}
          </span>
          {showWarning ? (
            <span className="text-[10px] text-orange-300/90 font-medium animate-pulse">
              ⚠&nbsp;{t('timeline.gapWarning', { hours: Math.floor(currentGapH!) })}
            </span>
          ) : showOnTrack ? (
            <span className="text-[10px] text-cyan-300/60">
              ✓ {t('timeline.onTrack')}
            </span>
          ) : null}
        </div>

        {/* ── Bar chart ── */}
        <div
          className="flex items-end gap-[2px]"
          style={{ height: `${BAR_MAX_H}px` }}
          aria-label={t('timeline.ariaLabel')}
        >
          {hourSlots.map(({ h, hasDrink, isFuture, isGap, barPct }) => {
            const isCurrentHour = h === currentHour;

            // Bar height
            const height = hasDrink
              ? Math.max(BAR_MIN_H, Math.round(barPct * BAR_MAX_H))
              : BAR_MIN_H;

            // Bar colour
            let barClass: string;
            if (hasDrink) {
              barClass = 'bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.35)]';
            } else if (isFuture) {
              barClass = 'bg-white/[0.06]';
            } else if (isGap) {
              barClass = 'bg-red-400/50';
            } else {
              barClass = 'bg-white/[0.12]';
            }

            return (
              <div
                key={h}
                className="flex-1 flex flex-col items-center justify-end h-full"
                title={hasDrink ? `${h}:00 — ${Math.round(ml_for(hourSlots, h))} ml` : undefined}
              >
                <div
                  className={[
                    'w-full rounded-[3px] transition-all duration-500',
                    barClass,
                    isCurrentHour && !isFuture
                      ? 'ring-1 ring-white/30 ring-offset-0'
                      : '',
                  ].join(' ')}
                  style={{ height: `${height}px` }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Hour labels ── */}
        <div className="flex mt-1.5">
          {hourSlots.map(({ h }) => {
            // Show label every 4 hours + endpoints
            const show = h === HOUR_START || h === HOUR_END || (h % 4 === 0);
            return (
              <div key={h} className="flex-1 text-center">
                {show && (
                  <span className="text-[8px] text-white/80 leading-none">{h}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Helper to retrieve ml for a given hour from the slot array */
function ml_for(slots: HourSlot[], h: number): number {
  return slots.find(s => s.h === h)?.ml ?? 0;
}
