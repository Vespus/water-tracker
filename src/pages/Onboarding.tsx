import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Droplets, ChevronRight } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useAppStore } from '../stores/appStore';
import i18n from '../i18n';

const languages = [
  { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
  { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
  { code: 'tr' as const, label: 'Türkçe', flag: '🇹🇷' },
  { code: 'it' as const, label: 'Italiano', flag: '🇮🇹' },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const setCurrentPage = useAppStore(s => s.setCurrentPage);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [lang, setLang] = useState<'de' | 'en' | 'fr' | 'tr' | 'it'>(settings.language);

  const finish = async () => {
    await updateSettings({ dailyGoalMl: goal, language: lang, onboardingCompleted: true });
    i18n.changeLanguage(lang);
    setCurrentPage('dashboard');
  };

  const skip = () => finish();

  const clampGoal = (v: number) => Math.max(500, Math.min(5000, v));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
      {/* Skip */}
      <button onClick={skip} className="absolute top-4 right-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        {t('onboarding.skip')}
      </button>

      {step === 0 && (
        <div className="text-center space-y-6 animate-fade-in">
          <Droplets size={64} className="mx-auto text-blue-500" />
          <h1 className="text-3xl font-bold">{t('onboarding.welcome')}</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{t('onboarding.welcomeText')}</p>
          <button onClick={() => setStep(1)} className="mt-4 px-8 py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto">
            {t('onboarding.next')} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="text-center space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold">{t('onboarding.setGoal')}</h2>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setGoal(clampGoal(goal - 100))} disabled={goal <= 500}
              className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center disabled:opacity-30">
              <Minus size={20} />
            </button>
            <span className="text-4xl font-bold tabular-nums">{goal}</span>
            <span className="text-gray-400">{t('common.ml')}</span>
            <button onClick={() => setGoal(clampGoal(goal + 100))} disabled={goal >= 5000}
              className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center disabled:opacity-30">
              <Plus size={20} />
            </button>
          </div>
          <input type="range" min={500} max={5000} step={100} value={goal}
            onChange={e => setGoal(Number(e.target.value))} className="w-full max-w-xs accent-blue-500" />
          <p className="text-xs text-gray-400">{t('settings.goalHint')}</p>
          <button onClick={() => setStep(2)} className="px-8 py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto">
            {t('onboarding.next')} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="text-center space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold">{t('onboarding.chooseLanguage')}</h2>
          <div className="grid grid-cols-1 gap-2 w-full max-w-xs mx-auto">
            {languages.map(l => (
              <button key={l.code} onClick={() => { setLang(l.code); i18n.changeLanguage(l.code); }}
                className={`py-3 px-4 rounded-xl text-left font-medium flex items-center gap-3 transition-colors ${
                  lang === l.code ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                <span className="text-xl">{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
          <button onClick={finish} className="px-8 py-3 bg-green-500 text-white rounded-xl font-semibold mx-auto">
            {t('onboarding.letsGo')} 🚀
          </button>
        </div>
      )}

      {/* Step dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
        ))}
      </div>
    </div>
  );
}
