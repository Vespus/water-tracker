import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Monitor, Sun, Moon, Settings2, Download, FileText, Shield, X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import GoalFormulaSection from '../components/settings/GoalFormulaSection';
import type { ThemePreference } from '../types';
import i18n from '../i18n';
import { db } from '../data/db';

const languages = [
  { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
  { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
  { code: 'tr' as const, label: 'Türkçe', flag: '🇹🇷' },
  { code: 'it' as const, label: 'Italiano', flag: '🇮🇹' },
];

const themeOptions: { value: ThemePreference; icon: typeof Monitor; labelKey: string }[] = [
  { value: 'system', icon: Monitor, labelKey: 'settings.themeSystem' },
  { value: 'light',  icon: Sun,     labelKey: 'settings.themeLight'  },
  { value: 'dark',   icon: Moon,    labelKey: 'settings.themeDark'   },
];

type ModalType = 'impressum' | 'privacy' | null;

export default function Settings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const [modal, setModal] = useState<ModalType>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const setGoal = (val: number) => {
    const clamped = Math.max(500, Math.min(5000, val));
    updateSettings({ dailyGoalMl: clamped });
  };

  const setLanguage = (lang: 'de' | 'en' | 'fr' | 'tr' | 'it') => {
    updateSettings({ language: lang });
    i18n.changeLanguage(lang);
  };

  const setTheme = (theme: ThemePreference) => {
    updateSettings({ theme });
  };

  const handleExport = async () => {
    setExportStatus('loading');
    try {
      const [drinkEntries, settingsData] = await Promise.all([
        db.drinkEntries.toArray(),
        db.settings.toArray(),
      ]);
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: 1,
        drinkEntries,
        settings: settingsData,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `water-tracker-export-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('done');
      setTimeout(() => setExportStatus('idle'), 2500);
    } catch (e) {
      console.error('Export failed', e);
      setExportStatus('idle');
    }
  };

  const currentTheme = settings.theme ?? 'system';

  return (
    <div className="page-enter pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <Settings2 size={22} className="text-cyan-200" />
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('settings.title')}</h1>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Daily Goal */}
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            {t('settings.dailyGoal')}
          </h2>

          {/* Formula / Manual mode selector */}
          <GoalFormulaSection
            goalMode={settings.goalMode ?? 'manual'}
            weightKg={settings.weightKg}
            activityLevel={settings.activityLevel}
            age={settings.age}
            gender={settings.gender}
            climate={settings.climate}
            onUpdate={(patch) => updateSettings(patch as Parameters<typeof updateSettings>[0])}
          />

          {/* Manual goal controls – always shown so user can adjust freely */}
          <div className="mt-5">
            <p className="text-xs text-gray-400 text-center mb-3">
              {settings.goalMode === 'formula' ? t('settings.goalManualOverride') : t('settings.goalHint')}
            </p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setGoal(settings.dailyGoalMl - 100)}
                disabled={settings.dailyGoalMl <= 500}
                className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center disabled:opacity-30 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95 transition-all"
              >
                <Minus size={20} strokeWidth={2.5} />
              </button>
              <div className="text-center">
                <span className="text-4xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {settings.dailyGoalMl}
                </span>
                <span className="text-lg text-gray-400 ml-1.5">{t('common.ml')}</span>
              </div>
              <button
                onClick={() => setGoal(settings.dailyGoalMl + 100)}
                disabled={settings.dailyGoalMl >= 5000}
                className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center disabled:opacity-30 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95 transition-all"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </div>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={settings.dailyGoalMl}
              onChange={e => setGoal(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5"
            />
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            {t('settings.theme')}
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {themeOptions.map(({ value, icon: Icon, labelKey }) => {
              const active = currentTheme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                      : 'bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  <span>{t(labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            {t('settings.language')}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {languages.map(lang => {
              const active = settings.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-2.5 py-3 px-4 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                      : 'bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg leading-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Datensicherung
          </h2>
          <button
            onClick={handleExport}
            disabled={exportStatus === 'loading'}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              exportStatus === 'done'
                ? 'bg-green-500 text-white shadow-md shadow-green-500/25'
                : 'bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-700'
            }`}
          >
            <Download size={18} />
            <span>
              {exportStatus === 'loading'
                ? '…'
                : exportStatus === 'done'
                ? t('settings.exportSuccess')
                : t('settings.exportData')}
            </span>
          </button>
        </div>

        {/* Legal */}
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            {t('settings.legal')}
          </h2>
          <div className="space-y-2.5">
            <button
              onClick={() => setModal('impressum')}
              className="w-full flex items-center gap-2.5 py-3 px-4 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-150"
            >
              <FileText size={18} className="text-gray-400" />
              <span>{t('settings.impressum')}</span>
            </button>
            <button
              onClick={() => setModal('privacy')}
              className="w-full flex items-center gap-2.5 py-3 px-4 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-150"
            >
              <Shield size={18} className="text-gray-400" />
              <span>{t('settings.privacy')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legal Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {modal === 'impressum' ? t('settings.impressum') : t('settings.privacy')}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              {modal === 'impressum' ? t('settings.impressumText') : t('settings.privacyText')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
