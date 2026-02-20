import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Pencil, X, Check } from 'lucide-react';
import { useTodayDrinks, useDeleteDrink, useUpdateDrink } from '../../hooks/useDrinks';
import { defaultBeverages } from '../../data/beverages';
import type { DrinkEntry } from '../../types';

interface UndoState {
  entry: DrinkEntry;
  timer: ReturnType<typeof setTimeout>;
  remaining: number;
}

export default function DrinkLog() {
  const { t } = useTranslation();
  const entries = useTodayDrinks();
  const deleteDrink = useDeleteDrink();
  const updateDrink = useUpdateDrink();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [editBeverage, setEditBeverage] = useState('');
  const [undo, setUndo] = useState<UndoState | null>(null);

  // Countdown for undo
  useEffect(() => {
    if (!undo) return;
    const interval = setInterval(() => {
      setUndo(prev => {
        if (!prev) return null;
        const remaining = prev.remaining - 1;
        if (remaining <= 0) return null;
        return { ...prev, remaining };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [undo?.entry.id]);

  const handleDelete = useCallback(async (entry: DrinkEntry) => {
    // Clear previous undo
    if (undo) clearTimeout(undo.timer);

    await deleteDrink(entry.id);
    const timer = setTimeout(() => setUndo(null), 5000);
    setUndo({ entry, timer, remaining: 5 });
  }, [deleteDrink, undo]);

  const handleUndo = useCallback(async () => {
    if (!undo) return;
    clearTimeout(undo.timer);
    const { id, beverageTypeId, amountMl, hydrationFactor, waterEquivalentMl, date, timestamp, createdAt, updatedAt } = undo.entry;
    const { db } = await import('../../data/db');
    await db.drinkEntries.add({ id, beverageTypeId, amountMl, hydrationFactor, waterEquivalentMl, date, timestamp, createdAt, updatedAt });
    setUndo(null);
  }, [undo]);

  const startEdit = (entry: DrinkEntry) => {
    setEditingId(entry.id);
    setEditAmount(entry.amountMl);
    setEditBeverage(entry.beverageTypeId);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateDrink(editingId, editBeverage, editAmount);
    setEditingId(null);
  };

  if (entries.length === 0 && !undo) {
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

      {/* Undo bar */}
      {undo && (
        <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm">
          <span className="flex-1">{t('drink.deleted')} ({undo.remaining}s)</span>
          <button onClick={handleUndo} className="font-semibold text-blue-600 dark:text-blue-400">
            {t('drink.undo')}
          </button>
        </div>
      )}

      {[...entries].reverse().map(entry => {
        const bev = defaultBeverages.find(b => b.id === entry.beverageTypeId);
        const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (editingId === entry.id) {
          return (
            <div key={entry.id} className="p-3 bg-white dark:bg-gray-800 rounded-xl space-y-2">
              <select value={editBeverage} onChange={e => setEditBeverage(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
                {defaultBeverages.map(b => (
                  <option key={b.id} value={b.id}>{b.icon} {t(b.nameKey)}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input type="number" value={editAmount} onChange={e => setEditAmount(Number(e.target.value))}
                  min={1} max={5000} step={10}
                  className="flex-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm" />
                <span className="text-xs text-gray-400">{t('common.ml')}</span>
                <button onClick={saveEdit} className="p-2 text-green-500"><Check size={18} /></button>
                <button onClick={() => setEditingId(null)} className="p-2 text-gray-400"><X size={18} /></button>
              </div>
            </div>
          );
        }

        return (
          <div key={entry.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl">
            <span className="text-xl">{bev?.icon ?? '🥤'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{bev ? t(bev.nameKey) : entry.beverageTypeId}</p>
              <p className="text-xs text-gray-400">
                {entry.amountMl} {t('common.ml')} · {entry.waterEquivalentMl} {t('common.ml')} {t('drink.waterEq')} · {time}
              </p>
            </div>
            <button onClick={() => startEdit(entry)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors">
              <Pencil size={16} />
            </button>
            <button onClick={() => handleDelete(entry)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
