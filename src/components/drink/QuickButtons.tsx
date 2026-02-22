import { useTranslation } from 'react-i18next';
import { useFrequentBeverages, useAddDrink } from '../../hooks/useDrinks';
import { useState } from 'react';

interface Props {
  onAdded: () => void;
}

export default function QuickButtons({ onAdded }: Props) {
  const { t } = useTranslation();
  const beverages = useFrequentBeverages();
  const addDrink = useAddDrink();
  const [flash, setFlash] = useState<string | null>(null);

  const handleQuick = async (bevId: string) => {
    await addDrink(bevId, 250);
    setFlash(bevId);
    onAdded();
    setTimeout(() => setFlash(null), 700);
  };

  return (
    <div className="flex gap-3 justify-center">
      {beverages.map(bev => {
        const isFlashing = flash === bev.id;
        return (
          <button
            key={bev.id}
            onClick={() => handleQuick(bev.id)}
            className={`flex flex-col items-center gap-1.5 px-4 py-3.5 rounded-2xl shadow-sm border transition-all duration-200 active:scale-95
              ${isFlashing
                ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 scale-105'
                : 'bg-white dark:bg-gray-800/80 border-gray-100 dark:border-gray-700/60 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
              }`}
          >
            <span className="text-2xl leading-none">{bev.icon}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t(bev.nameKey)}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">250 {t('common.ml')}</span>
          </button>
        );
      })}
    </div>
  );
}
