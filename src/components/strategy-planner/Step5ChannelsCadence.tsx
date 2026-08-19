import { useState } from 'react';
import { ContentStrategyFormData } from '../../types/contentStrategy';
import { useLanguage } from '../../lib/LanguageContext';

interface Props {
  formData: Partial<ContentStrategyFormData>;
  updateFormData: (data: Partial<ContentStrategyFormData>) => void;
}

export function Step5ChannelsCadence({ formData, updateFormData }: Props) {
  const { t } = useLanguage();
  const secondaryChannelOptions = ['blog', 'email', 'webinar', 'podcast', 'youtube'];

  const toggleSecondaryChannel = (channel: string) => {
    const current = formData.secondary_channels || [];
    if (current.includes(channel)) {
      updateFormData({ secondary_channels: current.filter(c => c !== channel) });
    } else {
      updateFormData({ secondary_channels: [...current, channel] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.stepChannelsCadence}</h2>
        <p className="text-gray-600">{t.channelsCadenceDesc}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            Li
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t.primaryChannelLinkedIn}</h3>
            <p className="text-sm text-gray-600">{t.mainPlatformDesc}</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t.secondaryChannels}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {secondaryChannelOptions.map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => toggleSecondaryChannel(channel)}
              className={`p-4 border-2 rounded-lg text-center transition-colors capitalize ${
                formData.secondary_channels?.includes(channel)
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {t[channel as keyof typeof t] || channel}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.postsPerWeek} *
          </label>
          <input
            type="number"
            required
            min="1"
            max="7"
            value={formData.posts_per_week || 3}
            onChange={(e) => updateFormData({ posts_per_week: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">{t.recommendedPosts}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.blogFrequency} *
          </label>
          <select
            required
            value={formData.blog_frequency || 'weekly'}
            onChange={(e) => updateFormData({ blog_frequency: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="weekly">{t.frequencyWeekly}</option>
            <option value="biweekly">{t.frequencyBiweekly}</option>
            <option value="monthly">{t.frequencyMonthly}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.caseFrequency} *
          </label>
          <select
            required
            value={formData.case_frequency || 'weekly'}
            onChange={(e) => updateFormData({ case_frequency: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="weekly">{t.frequencyWeekly}</option>
            <option value="biweekly">{t.frequencyBiweekly}</option>
            <option value="monthly">{t.frequencyMonthly}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.caseDay} *
          </label>
          <select
            required
            value={formData.case_day || 'wednesday'}
            onChange={(e) => updateFormData({ case_day: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="monday">{t.monday}</option>
            <option value="tuesday">{t.tuesday}</option>
            <option value="wednesday">{t.wednesday}</option>
            <option value="thursday">{t.thursday}</option>
            <option value="friday">{t.friday}</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">{t.bestPracticeMidWeek}</p>
        </div>
      </div>
    </div>
  );
}
