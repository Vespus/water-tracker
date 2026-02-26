import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Pencil, X, Check } from 'lucide-react';
import { useTodayDrinks, useDeleteDrink, useUpdateDrink } from '../../hooks/useDrinks';
import { useAllBeverages } from '../../hooks/useCustomBeverages';
import { defaultBeverages } from '../../data/beverages';
import type { DrinkEntry, BeverageType } from '../../types';

interface UndoState {
  entry: DrinkEntry;
  timer: ReturnType<typeof setTimeout>;
  remaining: number;
}

function getBevName(bev: BeverageType, t: (key: string) => string): string {
  return bev.customName ?? t(bev.nameKey);
}

export default function DrinkLog() {
  const { t } = useTranslation();
  const entries = useTodayDrinks();
  const deleteDrink = useDeleteDrink();
  const updateDrink = useUpdateDrink();
  const allBeverages = useAllBeverages();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [editBeverage, setEditBeverage] = useState('');
  const [editTime, setEditTime] = useState(''); // HH:mm
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
    // Pre-fill time from existing timestamp (HH:mm)
    const d = new Date(entry.timestamp);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    setEditTime(`${hh}:${mm}`);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    // Build new ISO timestamp: today's date + edited time
    const today = new Date();
    const [hh, mm] = editTime.split(':').map(Number);
    const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hh, mm, 0, 0);
    // Validation: must be today and not in the future beyond now
    const todayStr = today.toISOString().slice(0, 10);
    const newTimestamp = newDate.toISOString();
    if (newTimestamp.slice(0, 10) !== todayStr) {
      // Should not happen with type="time", but guard anyway
      return;
    }
    await updateDrink(editingId, editBeverage, editAmount, newTimestamp);
    setEditingId(null);
  };

  if (entries.length === 0 && !undo) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">💧</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('drink.noEntries')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {t('drink.todayEntries')}
      </h3>

      {/* Undo bar */}
      {undo && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-sm">
          <span className="flex-1 text-amber-800 dark:text-amber-300">{t('drink.deleted')} ({undo.remaining}s)</span>
          <button
            onClick={handleUndo}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
          >
            {t('drink.undo')}
          </button>
        </div>
      )}

      {[...entries].reverse().map(entry => {
        const bev = allBeverages.find(b => b.id === entry.beverageTypeId);
        const isDeleted = !bev;
        const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (editingId === entry.id) {
          return (
            <div key={entry.id} className="p-4 bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 space-y-3">
              <select
                value={editBeverage}
                onChange={e => setEditBeverage(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:border-blue-400"
              >
                {/* Custom beverages first */}
                {allBeverages.filter(b => b.isCustom).length > 0 && (
                  <optgroup label={t('customDrink.sectionTitle')}>
                    {allBeverages.filter(b => b.isCustom).map(b => (
                      <option key={b.id} value={b.id}>{getBevName(b, t)}</option>
                    ))}
                  </optgroup>
                )}
                {/* Default beverages */}
                {defaultBeverages.map(b => (
                  <option key={b.id} value={b.id}>{b.icon} {t(b.nameKey)}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(Number(e.target.value))}
                  min={1} max={5000} step={10}
                  className="flex-1 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:border-blue-400"
                />
                <span className="text-xs text-gray-400 font-medium">{t('common.ml')}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={saveEdit}
                  className="p-2 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100 transition-colors"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={entry.id}
            className="list-enter flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 transition-all duration-150"
          >
            {/* Icon */}
            {isDeleted ? (
              <span className="text-2xl leading-none opacity-40">🥤</span>
            ) : bev?.iconUrl ? (
              <img src={bev.iconUrl} alt={getBevName(bev, t)} className="w-8 h-8 object-contain flex-shrink-0" />
            ) : (
              <span className="text-2xl leading-none">{bev?.icon ?? '🥤'}</span>
            )}

            <div className="flex-1 min-w-0">
              {/* Name */}
              {isDeleted ? (
                <p className="font-semibold text-sm text-gray-400 dark:text-gray-600 italic truncate">
                  {t('customDrink.deletedLabel')}
                </p>
              ) : (
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                  {getBevName(bev!, t)}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {entry.amountMl} {t('common.ml')}
                <span className="mx-1 opacity-40">·</span>
                {entry.waterEquivalentMl} {t('common.ml')} {t('drink.waterEq')}
                <span className="mx-1 opacity-40">·</span>
                {time}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => startEdit(entry)}
                className="p-2 text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl transition-colors"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(entry)}
                className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
