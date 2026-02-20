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
    setTimeout(() => setFlash(null), 600);
  };

  return (
    <div className="flex gap-2 justify-center">
      {beverages.map(bev => (
        <button
          key={bev.id}
          onClick={() => handleQuick(bev.id)}
          className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all
            ${flash === bev.id
              ? 'bg-green-100 dark:bg-green-900 border-green-400 scale-105'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 active:scale-95'
            }`}
        >
          <span className="text-2xl">{bev.icon}</span>
          <span className="text-xs font-medium">{t(bev.nameKey)}</span>
          <span className="text-xs text-gray-400">250 {t('common.ml')}</span>
        </button>
      ))}
    </div>
  );
}
