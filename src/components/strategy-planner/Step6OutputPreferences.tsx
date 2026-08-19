import { ContentStrategyFormData } from '../../types/contentStrategy';
import { useLanguage } from '../../lib/LanguageContext';

interface Props {
  formData: Partial<ContentStrategyFormData>;
  updateFormData: (data: Partial<ContentStrategyFormData>) => void;
}

export function Step6OutputPreferences({ formData, updateFormData }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.stepOutputPreferences}</h2>
        <p className="text-gray-600">{t.outputPreferencesDesc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.outputLanguage} *
          </label>
          <select
            required
            value={formData.output_language || 'nl'}
            onChange={(e) => updateFormData({ output_language: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.strategyDepth} *
          </label>
          <select
            required
            value={formData.strategy_depth || 'standard'}
            onChange={(e) => updateFormData({ strategy_depth: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="light">{t.depthLight}</option>
            <option value="standard">{t.depthStandard}</option>
            <option value="advanced">{t.depthAdvanced}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.detailLevel} *
          </label>
          <select
            required
            value={formData.detail_level || 'high'}
            onChange={(e) => updateFormData({ detail_level: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">{t.detailLow}</option>
            <option value="medium">{t.detailMedium}</option>
            <option value="high">{t.detailHigh}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.numberOfWeeks} *
          </label>
          <input
            type="number"
            required
            min="4"
            max="24"
            value={formData.calendar_weeks || 12}
            onChange={(e) => updateFormData({ calendar_weeks: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">{t.recommendedWeeks}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          {t.includeInOutput}
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.include_examples !== false}
              onChange={(e) => updateFormData({ include_examples: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">{t.practicalExamples}</div>
              <div className="text-sm text-gray-600">{t.practicalExamplesDesc}</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.include_weekly_calendar !== false}
              onChange={(e) => updateFormData({ include_weekly_calendar: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">{t.weeklyCalendar}</div>
              <div className="text-sm text-gray-600">{t.weeklyCalendarDesc}</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.include_content_formats !== false}
              onChange={(e) => updateFormData({ include_content_formats: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">{t.contentFormatGuide}</div>
              <div className="text-sm text-gray-600">{t.contentFormatGuideDesc}</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.include_kpis !== false}
              onChange={(e) => updateFormData({ include_kpis: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">{t.kpisMeasurement}</div>
              <div className="text-sm text-gray-600">{t.kpisMeasurementDesc}</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.include_reuse_plan !== false}
              onChange={(e) => updateFormData({ include_reuse_plan: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">{t.contentReuseStrategy}</div>
              <div className="text-sm text-gray-600">{t.contentReuseStrategyDesc}</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
