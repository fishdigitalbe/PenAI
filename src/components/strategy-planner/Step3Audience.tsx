import { useState } from 'react';
import { ContentStrategyFormData } from '../../types/contentStrategy';
import { useLanguage } from '../../lib/LanguageContext';
import { X } from 'lucide-react';

interface Props {
  formData: Partial<ContentStrategyFormData>;
  updateFormData: (data: Partial<ContentStrategyFormData>) => void;
}

export function Step3Audience({ formData, updateFormData }: Props) {
  const { t } = useLanguage();
  const [newRole, setNewRole] = useState('');
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newObjection, setNewObjection] = useState('');
  const [newTrigger, setNewTrigger] = useState('');

  const addItem = (field: keyof ContentStrategyFormData, value: string, setValue: (v: string) => void) => {
    if (value.trim()) {
      updateFormData({
        [field]: [...((formData[field] as string[]) || []), value.trim()]
      });
      setValue('');
    }
  };

  const removeItem = (field: keyof ContentStrategyFormData, index: number) => {
    updateFormData({
      [field]: (formData[field] as string[])?.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.stepAudience}</h2>
        <p className="text-gray-600">{t.audienceDesc}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.targetRoles} *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('target_roles', newRole, setNewRole))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.targetRolesPlaceholder}
          />
          <button
            type="button"
            onClick={() => addItem('target_roles', newRole, setNewRole)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.target_roles?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button type="button" onClick={() => removeItem('target_roles', index)} className="hover:text-blue-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.decisionLevel} *
          </label>
          <select
            required
            value={formData.decision_level || ''}
            onChange={(e) => updateFormData({ decision_level: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t.selectLevel}</option>
            <option value="operational">{t.operational}</option>
            <option value="tactical">{t.tactical}</option>
            <option value="strategic">{t.strategic}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.awarenessLevel} *
          </label>
          <select
            required
            value={formData.awareness_level || ''}
            onChange={(e) => updateFormData({ awareness_level: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t.selectLevel}</option>
            <option value="low">{t.awarenessLow}</option>
            <option value="medium">{t.awarenessMedium}</option>
            <option value="high">{t.awarenessHigh}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.painPoints} *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newPainPoint}
            onChange={(e) => setNewPainPoint(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('pain_points', newPainPoint, setNewPainPoint))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.painPointsPlaceholder}
          />
          <button
            type="button"
            onClick={() => addItem('pain_points', newPainPoint, setNewPainPoint)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.pain_points?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button type="button" onClick={() => removeItem('pain_points', index)} className="hover:text-red-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.commonObjections}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newObjection}
            onChange={(e) => setNewObjection(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('objections', newObjection, setNewObjection))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.commonObjectionsPlaceholder}
          />
          <button
            type="button"
            onClick={() => addItem('objections', newObjection, setNewObjection)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.objections?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button type="button" onClick={() => removeItem('objections', index)} className="hover:text-orange-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.buyingTriggers}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('buying_triggers', newTrigger, setNewTrigger))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.buyingTriggersPlaceholder}
          />
          <button
            type="button"
            onClick={() => addItem('buying_triggers', newTrigger, setNewTrigger)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.buying_triggers?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button type="button" onClick={() => removeItem('buying_triggers', index)} className="hover:text-green-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
