import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, AlertOctagon, Check, ChevronLeft, Star, Search, Pin, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { defaultBeverages } from '../../data/beverages';
import { useAddDrink, useRecentBeverages } from '../../hooks/useDrinks';
import { useSettings } from '../../hooks/useSettings';
import {
  useCustomBeverages,
  useCustomBeverageCount,
  useDeleteCustomBeverage,
  useRawCustomBeverages,
  MAX_CUSTOM_BEVERAGES,
} from '../../hooks/useCustomBeverages';
import CustomBeverageForm from './CustomBeverageForm';
import type { BeverageType, CustomBeverage } from '../../types';

const PRESETS = [
  { labelKey: 'amount.glass', ml: 250 },
  { labelKey: 'amount.cup', ml: 300 },
  { labelKey: 'amount.bottle', ml: 500 },
  { labelKey: 'amount.large_bottle', ml: 1000 },
];

const CATEGORIES = ['water', 'hot', 'cold', 'alcohol', 'other'] as const;

const SLIDER_MIN = 50;
const SLIDER_MAX = 2000;
const SLIDER_STEP = 25;
const LONG_PRESS_MS = 500;

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  /** If set, the modal opens directly at the amount step with this beverage pre-selected */
  initialBeverageId?: string;
}

/** Helper: get display name for a beverage */
function getBevName(bev: BeverageType, t: (key: string) => string): string {
  return bev.customName ?? t(bev.nameKey);
}

/** Reusable beverage card used in the grid */
function BevCard({
  bev,
  isFav,
  onSelect,
  onToggleFav,
  onLongPress,
  t,
}: {
  bev: BeverageType;
  isFav: boolean;
  onSelect: (bev: BeverageType) => void;
  onToggleFav: (e: React.MouseEvent, id: string) => void;
  onLongPress?: (bev: BeverageType) => void;
  t: (key: string) => string;
}) {
  const isPinned = bev.id === 'water';
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);

  const startLongPress = () => {
    if (!onLongPress) return;
    triggeredRef.current = false;
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      if ('vibrate' in navigator) navigator.vibrate([20, 10, 20]);
      onLongPress(bev);
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (triggeredRef.current) return; // long-press already handled
    onSelect(bev);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        style={{ WebkitTouchCallout: 'none', touchAction: 'manipulation' } as React.CSSProperties}
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

/** Bottom sheet context menu for Edit/Delete custom drink */
function CustomDrinkMenu({
  bev,
  onEdit,
  onDelete,
  onClose,
  t,
}: {
  bev: BeverageType;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl w-full max-w-sm shadow-2xl pb-safe"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Beverage info */}
        <div className="flex items-center gap-3 px-5 pb-3 pt-1">
          {bev.iconUrl && (
            <img src={bev.iconUrl} alt={getBevName(bev, t)} className="w-9 h-9 object-contain" />
          )}
          <span className="font-semibold text-sm">{getBevName(bev, t)}</span>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        {!confirmDelete ? (
          <div className="p-3 space-y-1">
            {/* Edit */}
            <button
              onClick={onEdit}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-sm font-medium text-left"
            >
              <Pencil size={16} className="text-blue-500" />
              {t('common.edit')}
            </button>
            {/* Delete */}
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium text-left text-red-600 dark:text-red-400"
            >
              <Trash2 size={16} />
              {t('common.delete')}
            </button>
            {/* Cancel */}
            <button
              onClick={onClose}
              className="w-full px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          /* Confirm delete */
          <div className="p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('customDrink.deleteConfirm')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('customDrink.deleteConfirmText')}</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onDelete}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:scale-[0.98] transition-all shadow-sm shadow-red-500/20"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function hapticTick() {
  if ('vibrate' in navigator) navigator.vibrate(8);
}

export default function AddDrinkModal({ open, onClose, onAdded, initialBeverageId }: Props) {
  const { t } = useTranslation();
  const addDrink = useAddDrink();
  const { settings, toggleFavorite, saveLastAmount } = useSettings();
  const [step, setStep] = useState<'beverage' | 'amount' | 'done'>('beverage');
  const [selected, setSelected] = useState<BeverageType | null>(null);
  const [sliderVal, setSliderVal] = useState(250);
  const [inputVal, setInputVal] = useState('250');
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customHour, setCustomHour] = useState<number | null>(null);
  const [customMinute, setCustomMinute] = useState<number | null>(null);

  // Custom beverages state
  const customBeverages = useCustomBeverages();
  const rawCustomBeverages = useRawCustomBeverages();
  const customCount = useCustomBeverageCount();
  const deleteCustomBeverage = useDeleteCustomBeverage();

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingCustom, setEditingCustom] = useState<CustomBeverage | null>(null);
  const [contextMenuBev, setContextMenuBev] = useState<BeverageType | null>(null);

  const favorites = settings.favoriteBeverageIds ?? [];
  const recentBeverages = useRecentBeverages(5);

  const handleToggleFavorite = async (e: React.MouseEvent, bevId: string) => {
    e.stopPropagation();
    await toggleFavorite(bevId);
  };

  // Pre-select beverage when opened via long-press from QuickButtons
  useEffect(() => {
    if (open && initialBeverageId) {
      // Check in custom beverages too
      const bev =
        customBeverages.find(b => b.id === initialBeverageId) ??
        defaultBeverages.find(b => b.id === initialBeverageId);
      if (bev) {
        setSelected(bev);
        const last = settings.lastAmounts?.[bev.id] ?? 250;
        const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, last));
        setSliderVal(clamped);
        setInputVal(String(clamped));
        setStep('amount');
      }
    } else if (open && !initialBeverageId) {
      setStep('beverage');
      setSelected(null);
      setSliderVal(250);
      setInputVal('250');
      setSearch('');
      setShowTimePicker(false);
      setCustomHour(null);
      setCustomMinute(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialBeverageId]);

  const handleAdd = useCallback(async (ml: number) => {
    if (!selected || ml <= 0) return;

    let customTimestamp: string | undefined;
    if (showTimePicker && customHour !== null) {
      const chosen = new Date();
      chosen.setHours(customHour, customMinute ?? 0, 0, 0);
      if (chosen <= new Date()) {
        customTimestamp = chosen.toISOString();
      }
    }

    await addDrink(selected.id, ml, customTimestamp);
    await saveLastAmount(selected.id, ml);
    setSuccess(true);
    setStep('done');
    onAdded();
    setTimeout(() => {
      setSuccess(false);
      setStep('beverage');
      setSelected(null);
      setSliderVal(250);
      setInputVal('250');
      setSearch('');
      setShowTimePicker(false);
      setCustomHour(null);
      setCustomMinute(null);
      onClose();
    }, 800);
  }, [selected, addDrink, saveLastAmount, onAdded, onClose, showTimePicker, customHour, customMinute]);

  if (!open) return null;

  const handleSelect = (bev: BeverageType) => {
    setSelected(bev);
    const last = settings.lastAmounts?.[bev.id] ?? 250;
    const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, last));
    setSliderVal(clamped);
    setInputVal(String(clamped));
    setStep('amount');
  };

  const handlePresetClick = (ml: number) => {
    const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, ml));
    setSliderVal(clamped);
    setInputVal(String(ml));
    handleAdd(ml);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderVal(val);
    setInputVal(String(val));
    hapticTick();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputVal(raw);
    const parsed = parseInt(raw);
    if (!isNaN(parsed)) {
      const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, parsed));
      setSliderVal(clamped);
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputVal);
    if (isNaN(parsed) || parsed <= 0) {
      setInputVal(String(sliderVal));
    } else {
      const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, parsed));
      setSliderVal(clamped);
      setInputVal(String(clamped));
    }
  };

  const reset = () => {
    setStep('beverage');
    setSelected(null);
    setSliderVal(250);
    setInputVal('250');
    setSearch('');
    setShowTimePicker(false);
    setCustomHour(null);
    setCustomMinute(null);
    onClose();
  };

  // Custom drink long-press → context menu
  const handleCustomLongPress = (bev: BeverageType) => {
    setContextMenuBev(bev);
  };

  const handleContextEdit = () => {
    if (!contextMenuBev) return;
    const raw = rawCustomBeverages.find(c => c.id === contextMenuBev.id);
    if (raw) setEditingCustom(raw);
    setContextMenuBev(null);
    setShowCustomForm(true);
  };

  const handleContextDelete = async () => {
    if (!contextMenuBev) return;
    await deleteCustomBeverage(contextMenuBev.id);
    setContextMenuBev(null);
  };

  const handleOpenCreate = () => {
    setEditingCustom(null);
    setShowCustomForm(true);
  };

  const handleFormSaved = () => {
    setEditingCustom(null);
    setShowCustomForm(false);
  };

  const searchTrimmed = search.trim().toLowerCase();

  // Search includes both custom and default beverages
  const allForSearch = [...customBeverages, ...defaultBeverages];
  const searchResults = searchTrimmed
    ? allForSearch.filter(b => getBevName(b, t).toLowerCase().includes(searchTrimmed))
    : [];

  const grouped = CATEGORIES.map(cat => ({
    cat,
    labelKey: `category.${cat}`,
    items: defaultBeverages.filter(b => b.category === cat),
  }));

  const sliderPercent = ((sliderVal - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={reset}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle bar */}
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
              {step === 'beverage' ? t('drink.chooseBeverage') : step === 'amount' ? t('drink.chooseAmount') : ''}
            </h2>
            <button
              onClick={reset}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            {/* Success */}
            {step === 'done' && success && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <Check size={32} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="font-semibold text-green-600 dark:text-green-400">{t('drink.added')}</p>
              </div>
            )}

            {/* Step 1: Beverage */}
            {step === 'beverage' && (
              <div className="space-y-5">
                {/* A) Search field */}
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('drink.search')}
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>

                {/* Search results */}
                {searchTrimmed && (
                  <div>
                    {searchResults.length === 0 ? (
                      <p className="text-sm text-center text-gray-400 dark:text-gray-500 py-4">—</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {searchResults.map(bev => (
                          <BevCard
                            key={bev.id}
                            bev={bev}
                            isFav={favorites.includes(bev.id)}
                            onSelect={handleSelect}
                            onToggleFav={handleToggleFavorite}
                            onLongPress={bev.isCustom ? handleCustomLongPress : undefined}
                            t={t}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Normal grid (hidden when searching) */}
                {!searchTrimmed && (
                  <>
                    {/* ── "Meine Getränke" section (always shown first) ── */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          {t('customDrink.sectionTitle')}
                        </p>
                        {customCount < MAX_CUSTOM_BEVERAGES ? (
                          <button
                            onClick={handleOpenCreate}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors py-0.5 px-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Plus size={12} />
                            {t('customDrink.addNew')}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {t('customDrink.maxReachedShort')}
                          </span>
                        )}
                      </div>

                      {customBeverages.length === 0 ? (
                        <button
                          onClick={handleOpenCreate}
                          className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-400 dark:hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={14} />
                          {t('customDrink.empty')}
                        </button>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {customBeverages.map(bev => (
                            <BevCard
                              key={bev.id}
                              bev={bev}
                              isFav={favorites.includes(bev.id)}
                              onSelect={handleSelect}
                              onToggleFav={handleToggleFavorite}
                              onLongPress={handleCustomLongPress}
                              t={t}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── "Zuletzt verwendet" section ── */}
                    {recentBeverages.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                          {t('category.recent')}
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {recentBeverages.map(bev => (
                            <BevCard
                              key={bev.id}
                              bev={bev}
                              isFav={favorites.includes(bev.id)}
                              onSelect={handleSelect}
                              onToggleFav={handleToggleFavorite}
                              onLongPress={bev.isCustom ? handleCustomLongPress : undefined}
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
                              onSelect={handleSelect}
                              onToggleFav={handleToggleFavorite}
                              t={t}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Step 2: Amount */}
            {step === 'amount' && selected && (
              <div className="space-y-4">
                {/* Selected beverage info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl">
                  {selected.iconUrl ? (
                    <img src={selected.iconUrl} alt={getBevName(selected, t)} className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-4xl leading-none">{selected.icon}</span>
                  )}
                  <div>
                    <p className="font-bold">{getBevName(selected, t)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {t('drink.hydrationFactor', { factor: selected.hydrationFactor.toFixed(2) })}
                    </p>
                  </div>
                </div>

                {/* Warnings */}
                {selected.warningLevel === 'mild' && selected.warningTextKey && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-2xl text-sm border border-amber-200 dark:border-amber-800/50">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{t(selected.warningTextKey)}</span>
                  </div>
                )}
                {selected.warningLevel === 'strong' && selected.warningTextKey && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl text-sm border border-red-200 dark:border-red-800/50">
                    <AlertOctagon size={16} className="mt-0.5 shrink-0" />
                    <span>{t(selected.warningTextKey)}</span>
                  </div>
                )}

                {/* Presets */}
                <div className="grid grid-cols-2 gap-2.5">
                  {PRESETS.map(p => (
                    <button
                      key={p.ml}
                      onClick={() => handlePresetClick(p.ml)}
                      className="py-3.5 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-[0.97] transition-all duration-150 font-semibold text-sm shadow-sm"
                    >
                      {t(p.labelKey)}
                      <span className="block text-xs font-normal text-gray-400 mt-0.5">{p.ml} {t('common.ml')}</span>
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <div className="px-1 py-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{SLIDER_MIN} {t('common.ml')}</span>
                    <span className="text-lg font-bold text-blue-500 tabular-nums">{sliderVal} {t('common.ml')}</span>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{SLIDER_MAX} {t('common.ml')}</span>
                  </div>

                  <div className="relative h-6 flex items-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-none"
                          style={{ width: `${sliderPercent}%` }}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={SLIDER_MIN}
                      max={SLIDER_MAX}
                      step={SLIDER_STEP}
                      value={sliderVal}
                      onChange={handleSliderChange}
                      className="relative w-full h-6 appearance-none bg-transparent cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-6
                        [&::-webkit-slider-thumb]:h-6
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-blue-500
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:shadow-blue-500/30
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:active:scale-125
                        [&::-moz-range-thumb]:w-6
                        [&::-moz-range-thumb]:h-6
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-white
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-blue-500
                        [&::-moz-range-thumb]:shadow-md
                        [&::-moz-range-thumb]:cursor-pointer"
                      aria-label={t('drink.sliderLabel')}
                    />
                  </div>
                </div>

                {/* Optional time picker toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!showTimePicker) {
                        const now = new Date();
                        setCustomHour(now.getHours());
                        setCustomMinute(Math.floor(now.getMinutes() / 15) * 15);
                      }
                      setShowTimePicker(p => !p);
                    }}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${
                      showTimePicker
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Clock size={13} />
                    {showTimePicker && customHour !== null
                      ? `${String(customHour).padStart(2, '0')}:${String(customMinute ?? 0).padStart(2, '0')}`
                      : t('drink.setTime')}
                  </button>
                  {showTimePicker && (
                    <button
                      type="button"
                      onClick={() => { setShowTimePicker(false); setCustomHour(null); setCustomMinute(null); }}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {t('common.reset')}
                    </button>
                  )}
                </div>

                {/* Expandable time picker */}
                {showTimePicker && (
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-3 space-y-2">
                    {/* Quick Offset Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: '-15m', minutes: -15 },
                        { label: '-30m', minutes: -30 },
                        { label: '-1h', minutes: -60 },
                        { label: '-2h', minutes: -120 },
                      ].map(({ label, minutes }) => {
                        const base = new Date();
                        base.setMinutes(base.getMinutes() + minutes);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              const rounded = Math.round(base.getMinutes() / 5) * 5 % 60;
                              setCustomHour(base.getHours());
                              setCustomMinute(rounded);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-medium hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Manual selects */}
                    <div className="flex items-center gap-2">
                      <select
                        value={customHour ?? new Date().getHours()}
                        onChange={e => setCustomHour(Number(e.target.value))}
                        className="flex-1 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center focus:outline-none focus:border-blue-400"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="text-gray-400 font-bold">:</span>
                      <select
                        value={customMinute ?? 0}
                        onChange={e => setCustomMinute(Number(e.target.value))}
                        className="flex-1 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center focus:outline-none focus:border-blue-400"
                      >
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                    {/* Validation: future time */}
                    {customHour !== null && (() => {
                      const chosen = new Date();
                      chosen.setHours(customHour, customMinute ?? 0, 0, 0);
                      return chosen > new Date();
                    })() && (
                      <p className="text-xs text-red-500 dark:text-red-400">{t('retroAdd.futureTimeError')}</p>
                    )}
                  </div>
                )}

                {/* Custom input + confirm */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    placeholder={t('drink.customAmount')}
                    value={inputVal}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  />
                  <button
                    onClick={() => handleAdd(sliderVal)}
                    disabled={sliderVal <= 0}
                    className="px-5 py-3 rounded-2xl bg-blue-500 text-white font-semibold text-sm disabled:opacity-40 hover:bg-blue-600 active:scale-95 transition-all duration-150 shadow-md shadow-blue-500/20"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Drink Context Menu (long-press) */}
      {contextMenuBev && (
        <CustomDrinkMenu
          bev={contextMenuBev}
          onEdit={handleContextEdit}
          onDelete={handleContextDelete}
          onClose={() => setContextMenuBev(null)}
          t={t}
        />
      )}

      {/* Custom Beverage Form (create / edit) */}
      <CustomBeverageForm
        open={showCustomForm}
        editTarget={editingCustom}
        currentCount={customCount}
        onClose={() => { setShowCustomForm(false); setEditingCustom(null); }}
        onSaved={handleFormSaved}
      />
    </>
  );
}
