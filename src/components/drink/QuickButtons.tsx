import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFrequentBeverages, useAddDrink } from '../../hooks/useDrinks';

interface Props {
  onAdded: () => void;
}

export default function QuickButtons({ onAdded }: Props) {
  const { t } = useTranslation();
  const beverages = useFrequentBeverages();
  const addDrink = useAddDrink();
  const [flash, setFlash] = useState<string | null>(null);

  // Scroll container ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse-drag state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const didDrag = useRef(false);

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
    if (didDrag.current) return; // swallowed by drag
    await addDrink(bevId, 250);
    setFlash(bevId);
    onAdded();
    setTimeout(() => setFlash(null), 700);
  };

  return (
    <div className="relative">
      {/* Left fade edge */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none
          bg-gradient-to-r from-gray-50 dark:from-gray-950 to-transparent rounded-l-2xl" />
      )}
      {/* Right fade edge */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none
          bg-gradient-to-l from-gray-50 dark:from-gray-950 to-transparent rounded-r-2xl" />
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1 scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {beverages.map(bev => {
          const isFlashing = flash === bev.id;
          return (
            <button
              key={bev.id}
              onClick={() => handleQuick(bev.id)}
              draggable={false}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3.5 rounded-2xl shadow-sm border transition-all duration-200 active:scale-95 select-none
                ${isFlashing
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 scale-105'
                  : 'bg-white dark:bg-gray-800/80 border-gray-100 dark:border-gray-700/60 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
            >
              <span className="text-2xl leading-none">{bev.icon}</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">{t(bev.nameKey)}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">250 {t('common.ml')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
