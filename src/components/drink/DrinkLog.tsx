import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { useTodayDrinks, useDeleteDrink } from '../../hooks/useDrinks';
import { defaultBeverages } from '../../data/beverages';

export default function DrinkLog() {
  const { t } = useTranslation();
  const entries = useTodayDrinks();
  const deleteDrink = useDeleteDrink();

  if (entries.length === 0) {
    return (
      <p className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">
        {t('drink.noEntries')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
        {t('drink.todayEntries')}
      </h3>
      {[...entries].reverse().map(entry => {
        const bev = defaultBeverages.find(b => b.id === entry.beverageTypeId);
        const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
          <div key={entry.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl">
            <span className="text-xl">{bev?.icon ?? '🥤'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{bev ? t(bev.nameKey) : entry.beverageTypeId}</p>
              <p className="text-xs text-gray-400">
                {entry.amountMl} {t('common.ml')} · {entry.waterEquivalentMl} {t('common.ml')} {t('drink.waterEq')} · {time}
              </p>
            </div>
            <button
              onClick={() => deleteDrink(entry.id)}
              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
