import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, ChevronRight } from 'lucide-react';
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

const TOTAL_STEPS = 6;

export default function Onboarding() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const setCurrentPage = useAppStore(s => s.setCurrentPage);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [lang, setLang] = useState<'de' | 'en' | 'fr' | 'tr' | 'it'>(settings.language);

  const selectLanguage = (code: typeof lang) => {
    setLang(code);
    i18n.changeLanguage(code); // ← sofort anwenden, Rest des Onboardings läuft in gewählter Sprache
  };

  const finish = async () => {
    await updateSettings({ dailyGoalMl: goal, language: lang, onboardingCompleted: true });
    setCurrentPage('dashboard');
  };

  const skip = () => finish();

  const clampGoal = (v: number) => Math.max(500, Math.min(5000, v));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
      {/* Skip */}
      <button
        onClick={skip}
        className="absolute top-4 right-4 text-sm text-white/60 hover:text-white/90 transition-colors"
      >
        {step === 0 ? 'Skip' : t('onboarding.skip')}
      </button>

      {/* ── Step 0: Language Selection (FIRST) ── */}
      {step === 0 && (
        <div className="text-center space-y-6 animate-fade-in w-full max-w-xs mx-auto">
          <div className="text-5xl">🌍</div>
          {/* Multilingual title — no translation needed here */}
          <h1 className="text-2xl font-bold text-white">
            Language · Sprache · Langue
          </h1>
          <div className="grid grid-cols-1 gap-2 w-full">
            {languages.map(l => (
              <button
                key={l.code}
                onClick={() => selectLanguage(l.code)}
                className={`py-3 px-4 rounded-xl text-left font-medium flex items-center gap-3 transition-all duration-200 ${
                  lang === l.code
                    ? 'bg-white text-blue-700 shadow-lg scale-[1.02]'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                <span className="text-xl">{l.flag}</span>
                <span>{l.label}</span>
                {lang === l.code && <span className="ml-auto text-blue-500">✓</span>}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold flex items-center gap-2 mx-auto shadow-lg hover:bg-blue-50 transition-colors"
          >
            {languages.find(l => l.code === lang)?.label === 'Deutsch' ? 'Weiter' :
             languages.find(l => l.code === lang)?.label === 'English' ? 'Next' :
             languages.find(l => l.code === lang)?.label === 'Français' ? 'Suivant' :
             languages.find(l => l.code === lang)?.label === 'Türkçe' ? 'İleri' :
             'Avanti'} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Step 1: Welcome ── */}
      {step === 1 && (
        <div className="text-center space-y-6 animate-fade-in">
          <img src="/icons/water.png" alt="water" className="w-20 h-20 mx-auto drop-shadow-lg" />
          <h1 className="text-3xl font-bold text-white">{t('onboarding.welcome')}</h1>
          <p className="text-white/75 max-w-xs mx-auto leading-relaxed">{t('onboarding.welcomeText')}</p>
          <button
            onClick={() => setStep(2)}
            className="mt-4 px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold flex items-center gap-2 mx-auto shadow-lg hover:bg-blue-50 transition-colors"
          >
            {t('onboarding.next')} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Step 2: Daily Goal ── */}
      {step === 2 && (
        <div className="text-center space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-white">{t('onboarding.setGoal')}</h2>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setGoal(clampGoal(goal - 100))}
              disabled={goal <= 500}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/30 transition-colors"
            >
              <Minus size={20} />
            </button>
            <span className="text-4xl font-bold tabular-nums text-white">{goal}</span>
            <span className="text-white/70">{t('common.ml')}</span>
            <button
              onClick={() => setGoal(clampGoal(goal + 100))}
              disabled={goal >= 5000}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/30 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <input
            type="range" min={500} max={5000} step={100} value={goal}
            onChange={e => setGoal(Number(e.target.value))}
            className="w-full max-w-xs accent-white"
          />
          <p className="text-xs text-white/60">{t('settings.goalHint')}</p>
          <button
            onClick={() => setStep(3)}
            className="px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold flex items-center gap-2 mx-auto shadow-lg hover:bg-blue-50 transition-colors"
          >
            {t('onboarding.next')} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Step 3: Favorites ── */}
      {step === 3 && (
        <div className="text-center space-y-5 animate-fade-in max-w-xs mx-auto">
          <img src="/icons/sparkling_water.png" alt="favorites" className="w-16 h-16 mx-auto drop-shadow-lg" />
          <h2 className="text-2xl font-bold text-white">{t('onboarding.favoritesTitle')}</h2>
          <p className="text-white/75 text-sm leading-relaxed">
            {t('onboarding.favoritesText')}
          </p>
          {/* Visual hint */}
          <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-3 text-left space-y-3 backdrop-blur-sm">
            {[
              { icon: '/icons/water.png', key: 'water' },
              { icon: '/icons/coffee.png', key: 'coffee' },
              { icon: '/icons/tea_herbal.png', key: 'tea_herbal' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={item.icon} alt={item.key} className="w-7 h-7 object-contain" />
                  <span className="text-sm font-medium text-white">{t(`beverage.${item.key}`)}</span>
                </div>
                <span className="text-amber-300 text-base">★</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep(4)}
            className="px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold flex items-center gap-2 mx-auto shadow-lg hover:bg-blue-50 transition-colors"
          >
            {t('onboarding.next')} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Step 4: Long-Press / Quick-Add Tip ── */}
      {step === 4 && (
        <div className="text-center space-y-5 animate-fade-in max-w-xs mx-auto">
          <div className="text-5xl">👆</div>
          <h2 className="text-2xl font-bold text-white">{t('onboarding.longPressTitle')}</h2>
          <p className="text-white/75 text-sm leading-relaxed">
            {t('onboarding.longPressText')}
          </p>
          {/* Visual hint: tap vs. long-press */}
          <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-4 text-left space-y-3 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">☝️</span>
              <div>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-0.5">Tap</p>
                <p className="text-sm text-white/80">{t('onboarding.longPressTapHint')}</p>
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">✋</span>
              <div>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-0.5">Long Press</p>
                <p className="text-sm text-white/80">{t('onboarding.longPressHoldHint')}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setStep(5)}
            className="px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold flex items-center gap-2 mx-auto shadow-lg hover:bg-blue-50 transition-colors"
          >
            {t('onboarding.next')} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Step 5: Stats + BHI ── */}
      {step === 5 && (
        <div className="text-center space-y-5 animate-fade-in max-w-xs mx-auto">
          <img src="/icons/cola.png" alt="stats" className="w-16 h-16 mx-auto drop-shadow-lg" />
          <h2 className="text-2xl font-bold text-white">{t('onboarding.statsTitle')}</h2>
          <p className="text-white/75 text-sm leading-relaxed">
            {t('onboarding.statsText')}
          </p>
          {/* BHI examples */}
          <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-3 text-left space-y-3 backdrop-blur-sm">
            {[
              { icon: '/icons/water.png', key: 'water', bhi: '1.0×' },
              { icon: '/icons/coffee.png', key: 'coffee', bhi: '0.95×' },
              { icon: '/icons/beer.png', key: 'beer', bhi: '0.6×' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={item.icon} alt={item.key} className="w-7 h-7 object-contain" />
                  <span className="text-sm font-medium text-white">{t(`beverage.${item.key}`)}</span>
                </div>
                <span className="text-sm font-bold text-cyan-300">{item.bhi}</span>
              </div>
            ))}
          </div>
          <button
            onClick={finish}
            className="px-8 py-3 bg-green-400 text-white rounded-xl font-semibold mx-auto block shadow-lg hover:bg-green-300 transition-colors"
          >
            {t('onboarding.letsGo')} 🚀
          </button>
        </div>
      )}

      {/* Step dots */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? 'bg-white w-5' : 'bg-white/30 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
