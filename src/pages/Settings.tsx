import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import i18n from '../i18n';

const languages = [
  { code: 'de' as const, label: 'Deutsch' },
  { code: 'en' as const, label: 'English' },
  { code: 'fr' as const, label: 'Français' },
  { code: 'tr' as const, label: 'Türkçe' },
  { code: 'it' as const, label: 'Italiano' },
];

export default function Settings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const setGoal = (val: number) => {
    const clamped = Math.max(500, Math.min(5000, val));
    updateSettings({ dailyGoalMl: clamped });
  };

  const setLanguage = (lang: 'de' | 'en' | 'fr' | 'tr' | 'it') => {
    updateSettings({ language: lang });
    i18n.changeLanguage(lang);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Daily Goal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">{t('settings.dailyGoal')}</h2>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setGoal(settings.dailyGoalMl - 100)}
            disabled={settings.dailyGoalMl <= 500}
            className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center disabled:opacity-30"
          >
            <Minus size={20} />
          </button>
          <span className="text-3xl font-bold tabular-nums w-28 text-center">
            {settings.dailyGoalMl}
          </span>
          <span className="text-gray-400">{t('common.ml')}</span>
          <button
            onClick={() => setGoal(settings.dailyGoalMl + 100)}
            disabled={settings.dailyGoalMl >= 5000}
            className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center disabled:opacity-30"
          >
            <Plus size={20} />
          </button>
        </div>
        <input
          type="range"
          min={500}
          max={5000}
          step={100}
          value={settings.dailyGoalMl}
          onChange={e => setGoal(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <p className="text-xs text-gray-400 text-center">{t('settings.goalHint')}</p>
      </div>

      {/* Language */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">{t('settings.language')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                settings.language === lang.code
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
