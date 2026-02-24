import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import { useAddCustomBeverage, useUpdateCustomBeverage, MAX_CUSTOM_BEVERAGES } from '../../hooks/useCustomBeverages';
import type { CustomBeverage } from '../../types';

/** All 21 available PNG icons */
const AVAILABLE_ICONS = [
  'water', 'sparkling_water', 'tea_herbal', 'tea_green', 'tea_black',
  'coffee', 'milk_skim', 'milk_whole', 'orange_juice', 'apple_juice',
  'cola', 'cola_diet', 'lemonade', 'smoothie', 'soup',
  'beer', 'wine', 'champagne', 'spirits', 'cocktail', 'energy_drink',
];

const HF_MIN = 0.0;
const HF_MAX = 1.5;
const HF_STEP = 0.05;
const HF_DEFAULT = 1.0;
const NAME_MAX = 30;

interface Props {
  open: boolean;
  /** If set: edit mode — pre-fills the form */
  editTarget?: CustomBeverage | null;
  currentCount: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomBeverageForm({ open, editTarget, currentCount, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const addCustomBeverage = useAddCustomBeverage();
  const updateCustomBeverage = useUpdateCustomBeverage();

  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('/icons/water.png');
  const [hf, setHf] = useState(HF_DEFAULT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill when editing
  useEffect(() => {
    if (open && editTarget) {
      setName(editTarget.name);
      setIconUrl(editTarget.iconUrl);
      setHf(editTarget.hydrationFactor);
    } else if (open && !editTarget) {
      setName('');
      setIconUrl('/icons/water.png');
      setHf(HF_DEFAULT);
    }
    setError(null);
  }, [open, editTarget]);

  if (!open) return null;

  const isEdit = Boolean(editTarget);
  const canSave = name.trim().length > 0 && !saving;
  const atMax = !isEdit && currentCount >= MAX_CUSTOM_BEVERAGES;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && editTarget) {
        await updateCustomBeverage(editTarget.id, name.trim(), iconUrl, hf);
      } else {
        await addCustomBeverage(name.trim(), iconUrl, hf);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'MAX_CUSTOM_BEVERAGES') {
        setError(t('customDrink.maxReached'));
      } else {
        setError(String(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const hfPercent = ((hf - HF_MIN) / (HF_MAX - HF_MIN)) * 100;

  // Hydration description label
  const getHfLabel = () => {
    if (hf <= 0.1) return t('customDrink.hfDehydrating');
    if (hf < 0.7) return t('customDrink.hfLow');
    if (hf < 0.95) return t('customDrink.hfMedium');
    if (hf <= 1.05) return t('customDrink.hfLikeWater');
    return t('customDrink.hfHigh');
  };

  return (
    /* Second drawer layer — sits on top of the modal */
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold">
            {isEdit ? t('customDrink.editTitle') : t('customDrink.createTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* At-limit warning */}
          {atMax && (
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-2xl text-sm border border-amber-200 dark:border-amber-800/50">
              {t('customDrink.maxReached')}
            </div>
          )}

          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {t('customDrink.nameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.slice(0, NAME_MAX))}
              placeholder={t('customDrink.namePlaceholder')}
              maxLength={NAME_MAX}
              disabled={atMax}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
            />
            <div className="text-right text-xs text-gray-400 dark:text-gray-500 mt-1">
              {name.length}/{NAME_MAX}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {t('customDrink.iconLabel')}
            </label>
            <div className="grid grid-cols-7 gap-2">
              {AVAILABLE_ICONS.map(key => {
                const url = `/icons/${key}.png`;
                const selected = iconUrl === url;
                return (
                  <button
                    key={key}
                    onClick={() => setIconUrl(url)}
                    disabled={atMax}
                    className={[
                      'aspect-square flex items-center justify-center rounded-xl p-1.5 transition-all duration-150',
                      selected
                        ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500 scale-110'
                        : 'bg-gray-50 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105',
                      'disabled:opacity-40',
                    ].join(' ')}
                    title={key.replace(/_/g, ' ')}
                  >
                    <img
                      src={url}
                      alt={key}
                      className="w-7 h-7 object-contain"
                      draggable={false}
                    />
                    {selected && (
                      <span className="absolute">
                        {/* ring is enough indicator */}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hydration factor slider */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {t('customDrink.hydrationLabel')}
            </label>

            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">{HF_MIN.toFixed(1)}×</span>
              <div className="text-center">
                <span className="text-lg font-bold text-blue-500 tabular-nums">{hf.toFixed(2)}×</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{getHfLabel()}</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">{HF_MAX.toFixed(1)}×</span>
            </div>

            <div className="relative h-6 flex items-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-none"
                    style={{ width: `${hfPercent}%` }}
                  />
                </div>
              </div>
              {/* Water reference line at 1.0 */}
              <div
                className="absolute w-0.5 h-4 bg-blue-300 dark:bg-blue-600 rounded-full pointer-events-none"
                style={{ left: `${((1.0 - HF_MIN) / (HF_MAX - HF_MIN)) * 100}%` }}
                title="Wasser = 1.0×"
              />
              <input
                type="range"
                min={HF_MIN}
                max={HF_MAX}
                step={HF_STEP}
                value={hf}
                disabled={atMax}
                onChange={e => setHf(Number(e.target.value))}
                className="relative w-full h-6 appearance-none bg-transparent cursor-pointer disabled:opacity-50
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-blue-500
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:shadow-blue-500/30
                  [&::-webkit-slider-thumb]:active:scale-125
                  [&::-moz-range-thumb]:w-6
                  [&::-moz-range-thumb]:h-6
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-blue-500
                  [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              {t('customDrink.hydrationHint')}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl text-sm border border-red-200 dark:border-red-800/50">
              {error}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!canSave || atMax}
            className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-sm disabled:opacity-40 hover:bg-blue-600 active:scale-[0.98] transition-all duration-150 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Check size={16} />
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
