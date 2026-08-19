import { useState } from 'react';
import { ContentStrategyFormData } from '../../types/contentStrategy';
import { useLanguage } from '../../lib/LanguageContext';
import { X } from 'lucide-react';

interface Props {
  formData: Partial<ContentStrategyFormData>;
  updateFormData: (data: Partial<ContentStrategyFormData>) => void;
}

export function Step2GoalsAmbition({ formData, updateFormData }: Props) {
  const { t } = useLanguage();
  const [newSuccess, setNewSuccess] = useState('');
  const [newConstraint, setNewConstraint] = useState('');

  const addSuccess = () => {
    if (newSuccess.trim()) {
      updateFormData({
        success_definition: [...(formData.success_definition || []), newSuccess.trim()]
      });
      setNewSuccess('');
    }
  };

  const removeSuccess = (index: number) => {
    updateFormData({
      success_definition: formData.success_definition?.filter((_, i) => i !== index)
    });
  };

  const addConstraint = () => {
    if (newConstraint.trim()) {
      updateFormData({
        constraints: [...(formData.constraints || []), newConstraint.trim()]
      });
      setNewConstraint('');
    }
  };

  const removeConstraint = (index: number) => {
    updateFormData({
      constraints: formData.constraints?.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.stepGoalsAmbition}</h2>
        <p className="text-gray-600">{t.goalsAmbitionDesc}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.primaryGoal} *
        </label>
        <select
          required
          value={formData.primary_goal || ''}
          onChange={(e) => updateFormData({ primary_goal: e.target.value as any })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{t.selectPrimaryGoal}</option>
          <option value="thought_leadership">{t.thoughtLeadership}</option>
          <option value="lead_generation">{t.leadGeneration}</option>
          <option value="demand_creation">{t.demandCreation}</option>
          <option value="employer_branding">{t.employerBranding}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.timeHorizonMonths} *
          </label>
          <input
            type="number"
            required
            min="1"
            max="24"
            value={formData.time_horizon_months || 3}
            onChange={(e) => updateFormData({ time_horizon_months: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.northStarMetric}
          </label>
          <input
            type="text"
            value={formData.north_star_metric || ''}
            onChange={(e) => updateFormData({ north_star_metric: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.northStarMetricPlaceholder}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.successDefinition} *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSuccess}
            onChange={(e) => setNewSuccess(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSuccess())}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.successDefinitionPlaceholder}
          />
          <button
            type="button"
            onClick={addSuccess}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.success_definition?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button
                type="button"
                onClick={() => removeSuccess(index)}
                className="hover:text-blue-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.constraints}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newConstraint}
            onChange={(e) => setNewConstraint(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addConstraint())}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.constraintsPlaceholder}
          />
          <button
            type="button"
            onClick={addConstraint}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.constraints?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button
                type="button"
                onClick={() => removeConstraint(index)}
                className="hover:text-gray-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
