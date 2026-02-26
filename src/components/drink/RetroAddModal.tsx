import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, Check, Star, Pin } from 'lucide-react';
import { defaultBeverages } from '../../data/beverages';
import { useAddDrinkToDate } from '../../hooks/useDrinks';
import { useCustomBeverages } from '../../hooks/useCustomBeverages';
import { useSettings } from '../../hooks/useSettings';
import { todayString } from '../../utils/date';
import type { BeverageType } from '../../types';

const AMOUNT_PRESETS = [150, 250, 300, 500];
const CATEGORIES = ['water', 'hot', 'cold', 'alcohol', 'other'] as const;

function getBevName(bev: BeverageType, t: (key: string) => string): string {
  return bev.customName ?? t(bev.nameKey);
}

interface Props {
  open: boolean;
  date: string; // YYYY-MM-DD
  onClose: () => void;
  onAdded: () => void;
}

// ─── Simple BevCard (no long-press / context menu needed) ───────────────────

function BevCard({
  bev,
  isFav,
  onSelect,
  onToggleFav,
  t,
}: {
  bev: BeverageType;
  isFav: boolean;
  onSelect: (bev: BeverageType) => void;
  onToggleFav: (e: React.MouseEvent, id: string) => void;
  t: (key: string) => string;
}) {
  const isPinned = bev.id === 'water';

  return (
    <div className="relative">
      <button
        onClick={() => onSelect(bev)}
        className={[
          'w-full flex flex-col items-center gap-1.5 p-2.5 pt-4 rounded-2xl',
          'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105 active:scale-95',
          'transition-all duration-150',
          isFav || isPinned
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600/60'
            : 'bg-gray-50 dark:bg-gray-800/60 border border-transparent hover:border-blue-200 dark:hover:border-blue-700',
        ].join(' ')}
      >
        {bev.iconUrl ? (
          <img src={bev.iconUrl} alt={getBevName(bev, t)} className="w-8 h-8 object-contain" draggable={false} />
        ) : (
          <span className="text-2xl leading-none">{bev.icon}</span>
        )}
        <span className="text-[10px] text-center leading-tight font-medium text-gray-600 dark:text-gray-300">
          {getBevName(bev, t)}
        </span>
      </button>

      {isPinned ? (
        <div className="absolute top-1 right-1 p-0.5 z-10" title={t('drink.pinnedFavorite')}>
          <Pin size={11} className="fill-blue-400 text-blue-400" />
        </div>
      ) : (
        <button
          onClick={(e) => onToggleFav(e, bev.id)}
          title={isFav ? t('drink.removeFromFavorites') : t('drink.addToFavorites')}
          className="absolute top-1 right-1 p-0.5 rounded-full transition-colors z-10"
        >
          <Star
            size={11}
            className={isFav
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-gray-300 dark:text-gray-600 hover:text-amber-400'}
          />
        </button>
      )}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function RetroAddModal({ open, date, onClose, onAdded }: Props) {
  const { t } = useTranslation();
  const addDrinkToDate = useAddDrinkToDate();
  const { settings, toggleFavorite } = useSettings();
  const customBeverages = useCustomBeverages();

  const [step, setStep] = useState<'beverage' | 'amount'>('beverage');
  const [selected, setSelected] = useState<BeverageType | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(250);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [timeError, setTimeError] = useState(false);
  const [success, setSuccess] = useState(false);

  const favorites = settings.favoriteBeverageIds ?? [];

  // Favorites section: water always first, then user favorites
  const favoriteIds = ['water', ...favorites.filter(id => id !== 'water')];
  const allBevs = [...customBeverages, ...defaultBeverages];
  const favBeverages = favoriteIds
    .map(id => allBevs.find(b => b.id === id))
    .filter(Boolean) as BeverageType[];

  // Standard categories (default beverages only)
  const grouped = CATEGORIES.map(cat => ({
    cat,
    labelKey: `category.${cat}`,
    items: defaultBeverages.filter(b => b.category === cat),
  }));

  const handleToggleFavorite = async (e: React.MouseEvent, bevId: string) => {
    e.stopPropagation();
    await toggleFavorite(bevId);
  };

  const handleSelectBeverage = (bev: BeverageType) => {
    setSelected(bev);
    setSelectedAmount(250);
    setHour(12);
    setMinute(0);
    setTimeError(false);
    setStep('amount');
  };

  const handleSave = useCallback(async () => {
    if (!selected || selectedAmount <= 0) return;

    // Build local-time Date for the entry
    const [y, m, d] = date.split('-').map(Number);
    const entryTime = new Date(y, m - 1, d, hour, minute, 0, 0);

    // Validate: entry must not be in the future
    if (entryTime > new Date()) {
      setTimeError(true);
      return;
    }

    setTimeError(false);
    const isoTimestamp = entryTime.toISOString();

    await addDrinkToDate(selected.id, selectedAmount, date, isoTimestamp);
    setSuccess(true);
    onAdded();

    setTimeout(() => {
      setSuccess(false);
      setStep('beverage');
      setSelected(null);
      setSelectedAmount(250);
      onClose();
    }, 800);
  }, [selected, selectedAmount, hour, minute, date, addDrinkToDate, onAdded, onClose]);

  const reset = () => {
    setStep('beverage');
    setSelected(null);
    setSelectedAmount(250);
    setTimeError(false);
    onClose();
  };

  if (!open) return null;

  const isToday = date === todayString();

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={reset}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          {step === 'amount' ? (
            <button
              onClick={() => setStep('beverage')}
              className="flex items-center gap-1 text-sm text-blue-500 font-medium hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={16} />
              {t('drink.back')}
            </button>
          ) : (
            <div />
          )}
          <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2">
            {step === 'beverage' ? t('drink.chooseBeverage') : t('drink.chooseAmount')}
          </h2>
          <button
            onClick={reset}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* ── Success ─────────────────────────────────────────────── */}
          {success && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Check size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="font-semibold text-green-600 dark:text-green-400">{t('drink.added')}</p>
            </div>
          )}

          {/* ── Step 1: Beverage selection ───────────────────────────── */}
          {!success && step === 'beverage' && (
            <div className="space-y-5">
              {/* Favorites */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                  {t('drink.favorites')}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {favBeverages.map(bev => (
                    <BevCard
                      key={bev.id}
                      bev={bev}
                      isFav={favorites.includes(bev.id)}
                      onSelect={handleSelectBeverage}
                      onToggleFav={handleToggleFavorite}
                      t={t}
                    />
                  ))}
                </div>
              </div>

              {/* Custom beverages (if any that aren't already in favorites) */}
              {customBeverages.filter(b => !favorites.includes(b.id)).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                    {t('customDrink.sectionTitle')}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {customBeverages.filter(b => !favorites.includes(b.id)).map(bev => (
                      <BevCard
                        key={bev.id}
                        bev={bev}
                        isFav={false}
                        onSelect={handleSelectBeverage}
                        onToggleFav={handleToggleFavorite}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Standard categories */}
              {grouped.map(({ cat, labelKey, items }) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                    {t(labelKey)}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {items.map(bev => (
                      <BevCard
                        key={bev.id}
                        bev={bev}
                        isFav={favorites.includes(bev.id)}
                        onSelect={handleSelectBeverage}
                        onToggleFav={handleToggleFavorite}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 2: Amount + Time ────────────────────────────────── */}
          {!success && step === 'amount' && selected && (
            <div className="space-y-5">
              {/* Selected beverage info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl">
                {selected.iconUrl ? (
                  <img src={selected.iconUrl} alt={getBevName(selected, t)} className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-4xl leading-none">{selected.icon}</span>
                )}
                <p className="font-bold">{getBevName(selected, t)}</p>
              </div>

              {/* Amount presets */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                  {t('drink.chooseAmount')}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {AMOUNT_PRESETS.map(ml => (
                    <button
                      key={ml}
                      onClick={() => setSelectedAmount(ml)}
                      className={[
                        'py-3.5 px-4 rounded-2xl border transition-all duration-150 font-semibold text-sm shadow-sm',
                        selectedAmount === ml
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                      ].join(' ')}
                    >
                      {ml} {t('common.ml')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time selection */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                  {t('retroAdd.timeLabel')}
                </p>
                <div className="flex gap-2 items-center">
                  {/* Hour */}
                  <select
                    value={hour}
                    onChange={e => { setHour(Number(e.target.value)); setTimeError(false); }}
                    className="flex-1 py-3 px-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                    ))}
                  </select>

                  <span className="font-bold text-gray-400 dark:text-gray-500 select-none">:</span>

                  {/* Minute */}
                  <select
                    value={minute}
                    onChange={e => { setMinute(Number(e.target.value)); setTimeError(false); }}
                    className="flex-1 py-3 px-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                  >
                    {[0, 15, 30, 45].map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>

                  <span className="text-sm text-gray-400 dark:text-gray-500 select-none shrink-0">Uhr</span>
                </div>

                {/* Future-time error (only relevant when date === today) */}
                {timeError && isToday && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">
                    {t('retroAdd.futureTimeError')}
                  </p>
                )}
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 active:scale-[0.98] transition-all duration-150 shadow-md shadow-blue-500/20"
              >
                {t('common.save')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
