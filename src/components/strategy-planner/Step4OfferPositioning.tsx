import { useState } from 'react';
import { ContentStrategyFormData } from '../../types/contentStrategy';
import { useLanguage } from '../../lib/LanguageContext';
import { X } from 'lucide-react';

interface Props {
  formData: Partial<ContentStrategyFormData>;
  updateFormData: (data: Partial<ContentStrategyFormData>) => void;
}

export function Step4OfferPositioning({ formData, updateFormData }: Props) {
  const { t } = useLanguage();
  const [newService, setNewService] = useState('');
  const [newDifferentiator, setNewDifferentiator] = useState('');
  const [newAvoid, setNewAvoid] = useState('');
  const [newProof, setNewProof] = useState('');

  const addItem = (field: keyof ContentStrategyFormData, value: string, setValue: (v: string) => void) => {
    if (value.trim()) {
      const maxItems = field === 'key_differentiators' ? 3 : 999;
      const currentItems = (formData[field] as string[]) || [];
      if (currentItems.length < maxItems) {
        updateFormData({
          [field]: [...currentItems, value.trim()]
        });
        setValue('');
      }
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.stepOfferPositioning}</h2>
        <p className="text-gray-600">{t.offerPositioningDesc}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.coreServices} *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('core_services', newService, setNewService))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.coreServicesPlaceholder}
          />
          <button
            type="button"
            onClick={() => addItem('core_services', newService, setNewService)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.core_services?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button type="button" onClick={() => removeItem('core_services', index)} className="hover:text-blue-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.keyDifferentiators} *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newDifferentiator}
            onChange={(e) => setNewDifferentiator(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('key_differentiators', newDifferentiator, setNewDifferentiator))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.keyDifferentiatorsPlaceholder}
            disabled={(formData.key_differentiators?.length || 0) >= 3}
          />
          <button
            type="button"
            onClick={() => addItem('key_differentiators', newDifferentiator, setNewDifferentiator)}
            disabled={(formData.key_differentiators?.length || 0) >= 3}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.key_differentiators?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button type="button" onClick={() => removeItem('key_differentiators', index)} className="hover:text-green-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {(formData.key_differentiators?.length || 0) >= 3 && (
          <p className="text-sm text-gray-500 mt-1">{t.maxDifferentiatorsReached}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.topicsToAvoid}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newAvoid}
            onChange={(e) => setNewAvoid(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('topics_to_avoid', newAvoid, setNewAvoid))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.topicsToAvoidPlaceholder}
          />
          <button
            type="button"
            onClick={() => addItem('topics_to_avoid', newAvoid, setNewAvoid)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.topics_to_avoid?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button type="button" onClick={() => removeItem('topics_to_avoid', index)} className="hover:text-red-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.proofAssets}
        </label>
        <p className="text-sm text-gray-500 mb-2">{t.proofAssetsDesc}</p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newProof}
            onChange={(e) => setNewProof(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('proof_assets', newProof, setNewProof))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.proofAssetsPlaceholder}
          />
          <button
            type="button"
            onClick={() => addItem('proof_assets', newProof, setNewProof)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {t.add}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.proof_assets?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              <span className="text-sm">{item}</span>
              <button type="button" onClick={() => removeItem('proof_assets', index)} className="hover:text-yellow-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
