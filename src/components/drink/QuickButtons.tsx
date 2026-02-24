import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFrequentBeverages, useAddDrink } from '../../hooks/useDrinks';
import { useSettings } from '../../hooks/useSettings';

interface Props {
  onAdded: () => void;
  /** Render as a 4-column grid instead of horizontal scroll */
  grid?: boolean;
  /** Limit the number of buttons shown (used with grid) */
  maxItems?: number;
  /** Called on long-press to open the full drink selection modal */
  onOpenFull?: (beverageId: string) => void;
}

interface AmountPopoverProps {
  beverageId: string;
  currentAmount: number;
  onSave: (ml: number) => void;
  onClose: () => void;
}

function AmountPopover({ beverageId: _beverageId, currentAmount, onSave, onClose }: AmountPopoverProps) {
  const { t } = useTranslation();
  const [val, setVal] = useState(String(currentAmount));

  const handleSave = () => {
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed > 0) {
      onSave(Math.max(50, Math.min(2000, parsed)));
    }
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Popover card */}
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-5 w-64 border border-gray-100 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          {t('quickAdd.setAmount')}
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min={50}
            max={2000}
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
          />
          <span className="self-center text-sm text-gray-400 dark:text-gray-500 font-medium pr-1">
            {t('common.ml')}
          </span>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/25"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuickButtons({ onAdded, grid = false, maxItems, onOpenFull }: Props) {
  const { t } = useTranslation();
  const beverages = useFrequentBeverages();
  const addDrink = useAddDrink();
  const { settings, setFavoriteAmount } = useSettings();
  const [flash, setFlash] = useState<string | null>(null);
  const [popoverBevId, setPopoverBevId] = useState<string | null>(null);

  // Scroll container ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse-drag state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const didDrag = useRef(false);

  // Long-press state per button
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [beverages, updateScrollState]);

  // Mouse drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    didDrag.current = false;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 4) didDrag.current = true;
    el.scrollLeft = scrollLeft.current - walk;
  };

  const onMouseUp = () => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = false;
    el.style.cursor = '';
    el.style.userSelect = '';
  };

  const handleQuick = async (bevId: string) => {
    if (didDrag.current || longPressTriggered.current) return;
    const amount = settings.favoriteAmounts?.[bevId] ?? 250;
    await addDrink(bevId, amount);
    setFlash(bevId);
    onAdded();
    setTimeout(() => setFlash(null), 700);
  };

  // Long-press handlers
  const startLongPress = (bevId: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      if ('vibrate' in navigator) navigator.vibrate([20, 10, 20]);
      if (onOpenFull) {
        onOpenFull(bevId);
      } else {
        // Fallback: show amount popover if no full-modal handler provided
        setPopoverBevId(bevId);
      }
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSaveAmount = async (ml: number) => {
    if (popoverBevId) {
      await setFavoriteAmount(popoverBevId, ml);
    }
    setPopoverBevId(null);
  };

  const displayBeverages = maxItems ? beverages.slice(0, maxItems) : beverages;

  /** Shared button renderer */
  const renderButton = (bev: (typeof beverages)[number], extraClass = '') => {
    const isFlashing = flash === bev.id;
    const amount = settings.favoriteAmounts?.[bev.id] ?? 250;
    return (
      <button
        key={bev.id}
        onClick={() => handleQuick(bev.id)}
        onMouseDown={() => startLongPress(bev.id)}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={() => startLongPress(bev.id)}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        draggable={false}
        title={t('quickAdd.longPressHint')}
        className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl shadow-sm border transition-all duration-200 active:scale-95 select-none backdrop-blur-sm
          ${isFlashing
            ? 'bg-white/25 border-white/40 scale-105'
            : 'bg-white/10 border-white/15 hover:bg-white/20 hover:border-white/25'
          } ${extraClass}`}
      >
        {bev.iconUrl ? (
          <img src={bev.iconUrl} alt={t(bev.nameKey)} className="w-8 h-8 object-contain" />
        ) : (
          <span className="text-2xl leading-none">{bev.icon}</span>
        )}
        <span className="text-xs font-semibold text-white whitespace-nowrap truncate w-full text-center px-1">{t(bev.nameKey)}</span>
        <span className="text-[10px] text-white/60 font-medium">{amount} {t('common.ml')}</span>
      </button>
    );
  };

  return (
    <>
      {/* Amount popover (UX-05) */}
      {popoverBevId && (
        <AmountPopover
          beverageId={popoverBevId}
          currentAmount={settings.favoriteAmounts?.[popoverBevId] ?? 250}
          onSave={handleSaveAmount}
          onClose={() => setPopoverBevId(null)}
        />
      )}

      {grid ? (
        /* ── Grid layout (4 columns, no scroll) ── */
        <div className="grid grid-cols-4 gap-2">
          {displayBeverages.map(bev => renderButton(bev))}
        </div>
      ) : (
        /* ── Scroll layout (original) ── */
        <div className="relative">
          {/* Left fade edge */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none
              bg-gradient-to-r from-black/10 to-transparent rounded-l-2xl" />
          )}
          {/* Right fade edge */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none
              bg-gradient-to-l from-black/10 to-transparent rounded-r-2xl" />
          )}

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-1 scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-x' } as React.CSSProperties}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {displayBeverages.map(bev => renderButton(bev, 'flex-shrink-0 px-4'))}
          </div>
        </div>
      )}
    </>
  );
}
