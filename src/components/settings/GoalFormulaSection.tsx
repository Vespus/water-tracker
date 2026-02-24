import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, ChevronDown, Sparkles, Pencil } from 'lucide-react';
import { calculatePersonalGoal, isFormulaComplete } from '../../utils/hydration';
import type { ActivityLevel, ClimateType, GenderType, GoalMode } from '../../types';

interface Props {
  goalMode: GoalMode;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  age?: number;
  gender?: GenderType;
  climate?: ClimateType;
  onUpdate: (patch: {
    goalMode?: GoalMode;
    weightKg?: number;
    activityLevel?: ActivityLevel;
    age?: number;
    gender?: GenderType;
    climate?: ClimateType;
    dailyGoalMl?: number;
  }) => void;
}

function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-gray-400 hover:text-blue-400 transition-colors"
        aria-label="Info"
      >
        <Info size={15} />
      </button>
      {open && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-gray-100 text-xs rounded-2xl p-3 shadow-xl z-50 leading-relaxed"
          onClick={() => setOpen(false)}
        >
          {text}
        </div>
      )}
    </div>
  );
}

function SelectBtn<T extends string>({
  options,
  value,
  onChange,
  labelFn,
}: {
  options: T[];
  value: T | undefined;
  onChange: (v: T) => void;
  labelFn: (v: T) => string;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
            value === opt
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {labelFn(opt)}
        </button>
      ))}
    </div>
  );
}

export default function GoalFormulaSection({
  goalMode,
  weightKg,
  activityLevel,
  age,
  gender,
  climate,
  onUpdate,
}: Props) {
  const { t } = useTranslation();

  const formulaParams = { weightKg: weightKg ?? 0, activityLevel: activityLevel ?? 'medium', age: age ?? 0, gender: gender ?? 'female', climate: climate ?? 'temperate' };
  const complete = isFormulaComplete({ weightKg, activityLevel, age, gender, climate });
  const suggestedGoal = complete ? calculatePersonalGoal(formulaParams) : null;

  const handleModeSwitch = (mode: GoalMode) => {
    const patch: Parameters<typeof onUpdate>[0] = { goalMode: mode };
    if (mode === 'formula' && complete && suggestedGoal !== null) {
      patch.dailyGoalMl = suggestedGoal;
    }
    onUpdate(patch);
  };

  const handleFieldChange = (field: Partial<{ weightKg: number; activityLevel: ActivityLevel; age: number; gender: GenderType; climate: ClimateType }>) => {
    const next = { ...formulaParams, ...field };
    if (goalMode === 'formula' && isFormulaComplete(next)) {
      onUpdate({ ...field, dailyGoalMl: calculatePersonalGoal(next) });
    } else {
      onUpdate(field);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-2xl">
        <button
          type="button"
          onClick={() => handleModeSwitch('formula')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            goalMode === 'formula'
              ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Sparkles size={13} />
          {t('settings.goalFormula')}
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('manual')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            goalMode === 'manual'
              ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Pencil size={13} />
          {t('settings.goalManual')}
        </button>
      </div>

      {/* Formula fields */}
      {goalMode === 'formula' && (
        <div className="space-y-4">
          {/* Weight */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t('settings.weight')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={20}
                max={250}
                value={weightKg ?? ''}
                onChange={e => handleFieldChange({ weightKg: Number(e.target.value) || undefined as any })}
                placeholder="70"
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <span className="text-sm text-gray-400 w-6">kg</span>
            </div>
          </div>

          {/* Activity */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('settings.activity')}
              </label>
              <Tooltip text={t('settings.activityTooltip')} />
            </div>
            <SelectBtn<ActivityLevel>
              options={['low', 'medium', 'high']}
              value={activityLevel}
              onChange={v => handleFieldChange({ activityLevel: v })}
              labelFn={v => t(`settings.activity_${v}`)}
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t('settings.age')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                value={age ?? ''}
                onChange={e => handleFieldChange({ age: Number(e.target.value) || undefined as any })}
                placeholder="30"
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <span className="text-sm text-gray-400 w-10">{t('settings.years')}</span>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t('settings.gender')}
            </label>
            <SelectBtn<GenderType>
              options={['female', 'male']}
              value={gender}
              onChange={v => handleFieldChange({ gender: v })}
              labelFn={v => t(`settings.gender_${v}`)}
            />
          </div>

          {/* Climate */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('settings.climate')}
              </label>
              <Tooltip text={t('settings.climateTooltip')} />
            </div>
            <SelectBtn<ClimateType>
              options={['cold', 'temperate', 'hot']}
              value={climate}
              onChange={v => handleFieldChange({ climate: v })}
              labelFn={v => t(`settings.climate_${v}`)}
            />
          </div>

          {/* Suggested result */}
          {complete && suggestedGoal !== null ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-4 py-3 border border-blue-100 dark:border-blue-800/40">
              <div>
                <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider">{t('settings.suggestedGoal')}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-300 tabular-nums">
                  {suggestedGoal} <span className="text-base font-normal">ml</span>
                </p>
              </div>
              <ChevronDown size={18} className="text-blue-400 -rotate-90" />
            </div>
          ) : (
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
              {t('settings.fillAllFields')}
            </div>
          )}

          {/* Formula explanation */}
          <details className="group">
            <summary className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer list-none select-none">
              <Info size={12} />
              {t('settings.formulaExplain')}
            </summary>
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl text-xs text-gray-500 dark:text-gray-400 leading-relaxed space-y-1">
              <p>• {t('settings.formulaLine1')}</p>
              <p>• {t('settings.formulaLine2')}</p>
              <p>• {t('settings.formulaLine3')}</p>
              <p>• {t('settings.formulaLine4')}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
