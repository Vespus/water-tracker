import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, AlertOctagon, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={reset}>
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {step === 'beverage' ? t('drink.chooseBeverage') : step === 'amount' ? t('drink.chooseAmount') : ''}
          </h2>
          <button onClick={reset} className="p-1"><X size={20} /></button>
        </div>

        {/* Success */}
        {step === 'done' && success && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center animate-bounce">
              <Check size={32} className="text-green-600" />
            </div>
            <p className="font-semibold text-green-600">{t('drink.added')}</p>
          </div>
        )}

        {/* Step 1: Beverage */}
        {step === 'beverage' && (
          <div className="space-y-4">
            {grouped.map(({ cat, labelKey, items }) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{t(labelKey)}</p>
                <div className="grid grid-cols-4 gap-2">
                  {items.map(bev => (
                    <button
                      key={bev.id}
                      onClick={() => handleSelect(bev)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-2xl">{bev.icon}</span>
                      <span className="text-[10px] text-center leading-tight">{t(bev.nameKey)}</span>
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
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <span className="text-3xl">{selected.icon}</span>
              <div>
                <p className="font-semibold">{t(selected.nameKey)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('drink.hydrationFactor', { factor: selected.hydrationFactor.toFixed(2) })}
                </p>
              </div>
            </div>

            {/* Warnings */}
            {selected.warningLevel === 'mild' && selected.warningTextKey && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
                <AlertTriangle size={16} />
                <span>{t(selected.warningTextKey)}</span>
              </div>
            )}
            {selected.warningLevel === 'strong' && selected.warningTextKey && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                <AlertOctagon size={16} />
                <span>{t(selected.warningTextKey)}</span>
              </div>
            )}

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.ml}
                  onClick={() => handleAdd(p.ml)}
                  className="py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 active:scale-95 transition-all font-medium"
                >
                  {t(p.labelKey)} ({p.ml} {t('common.ml')})
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
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={() => handleAdd(parseInt(customMl) || 0)}
                disabled={!customMl || parseInt(customMl) <= 0}
                className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-40 hover:bg-blue-600 active:scale-95 transition-all"
              >
                {t('common.save')}
              </button>
            </div>

            <button onClick={() => setStep('beverage')} className="text-sm text-gray-400 hover:text-gray-600">
              ← {t('drink.back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
