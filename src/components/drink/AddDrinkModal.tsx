import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, AlertOctagon, Check, ChevronLeft } from 'lucide-react';
import { defaultBeverages } from '../../data/beverages';
import { useAddDrink } from '../../hooks/useDrinks';
import type { BeverageType } from '../../types';

const PRESETS = [
  { labelKey: 'amount.glass', ml: 250 },
  { labelKey: 'amount.cup', ml: 300 },
  { labelKey: 'amount.bottle', ml: 500 },
  { labelKey: 'amount.large_bottle', ml: 1000 },
];

const CATEGORIES = ['water', 'hot', 'cold', 'alcohol', 'other'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddDrinkModal({ open, onClose, onAdded }: Props) {
  const { t } = useTranslation();
  const addDrink = useAddDrink();
  const [step, setStep] = useState<'beverage' | 'amount' | 'done'>('beverage');
  const [selected, setSelected] = useState<BeverageType | null>(null);
  const [customMl, setCustomMl] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSelect = (bev: BeverageType) => {
    setSelected(bev);
    setStep('amount');
  };

  const handleAdd = async (ml: number) => {
    if (!selected || ml <= 0) return;
    await addDrink(selected.id, ml);
    setSuccess(true);
    setStep('done');
    onAdded();
    setTimeout(() => {
      setSuccess(false);
      setStep('beverage');
      setSelected(null);
      setCustomMl('');
      onClose();
    }, 800);
  };

  const reset = () => {
    setStep('beverage');
    setSelected(null);
    setCustomMl('');
    onClose();
  };

  const grouped = CATEGORIES.map(cat => ({
    cat,
    labelKey: `category.${cat}`,
    items: defaultBeverages.filter(b => b.category === cat),
  }));

  return (
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
              {grouped.map(({ cat, labelKey, items }) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                    {t(labelKey)}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {items.map(bev => (
                      <button
                        key={bev.id}
                        onClick={() => handleSelect(bev)}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105 active:scale-95 transition-all duration-150 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                      >
                        <span className="text-2xl leading-none">{bev.icon}</span>
                        <span className="text-[10px] text-center leading-tight font-medium text-gray-600 dark:text-gray-300">{t(bev.nameKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Amount */}
          {step === 'amount' && selected && (
            <div className="space-y-4">
              {/* Selected beverage info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl">
                <span className="text-4xl leading-none">{selected.icon}</span>
                <div>
                  <p className="font-bold">{t(selected.nameKey)}</p>
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
                    onClick={() => handleAdd(p.ml)}
                    className="py-3.5 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-[0.97] transition-all duration-150 font-semibold text-sm shadow-sm"
                  >
                    {t(p.labelKey)}
                    <span className="block text-xs font-normal text-gray-400 mt-0.5">{p.ml} {t('common.ml')}</span>
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  placeholder={t('drink.customAmount')}
                  value={customMl}
                  onChange={e => setCustomMl(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600"
                />
                <button
                  onClick={() => handleAdd(parseInt(customMl) || 0)}
                  disabled={!customMl || parseInt(customMl) <= 0}
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
  );
}
