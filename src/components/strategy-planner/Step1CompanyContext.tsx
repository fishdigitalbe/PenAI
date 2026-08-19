import { ContentStrategyFormData } from '../../types/contentStrategy';
import { useLanguage } from '../../lib/LanguageContext';

interface Props {
  formData: Partial<ContentStrategyFormData>;
  updateFormData: (data: Partial<ContentStrategyFormData>) => void;
}

export function Step1CompanyContext({ formData, updateFormData }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t.stepCompanyContext || 'Bedrijfscontext'}
        </h2>
        <p className="text-gray-600">
          {t.companyContextDesc || 'Vertel ons over je bedrijf en marktpositie'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.companyName || 'Bedrijfsnaam'} *
          </label>
          <input
            type="text"
            required
            value={formData.company_name || ''}
            onChange={(e) => updateFormData({ company_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.companyNamePlaceholder || 'Acme Corp'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.companyWebsite || 'Website URL'}
          </label>
          <input
            type="url"
            value={formData.website_url || ''}
            onChange={(e) => updateFormData({ website_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.companyWebsitePlaceholder || 'https://example.com'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.sector || 'Sector'} *
          </label>
          <input
            type="text"
            required
            value={formData.sector || ''}
            onChange={(e) => updateFormData({ sector: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.sectorPlaceholder || 'bijv. SaaS, Consulting'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.companySize} *
          </label>
          <select
            required
            value={formData.company_size || ''}
            onChange={(e) => updateFormData({ company_size: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t.selectSize}</option>
            <option value="solo">{t.soloFreelancer}</option>
            <option value="kmo">{t.kmo}</option>
            <option value="mid-market">{t.midMarket}</option>
            <option value="enterprise">{t.enterprise}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.geoMarket} *
          </label>
          <input
            type="text"
            required
            value={formData.geo_market || ''}
            onChange={(e) => updateFormData({ geo_market: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t.geoMarketPlaceholder}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.salesCycle} *
          </label>
          <select
            required
            value={formData.sales_cycle || ''}
            onChange={(e) => updateFormData({ sales_cycle: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t.selectCycle}</option>
            <option value="short">{t.cycleShort}</option>
            <option value="medium">{t.cycleMedium}</option>
            <option value="long">{t.cycleLong}</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.currentMaturity} *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => updateFormData({ current_maturity: level })}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  formData.current_maturity === level
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold capitalize">
                  {level === 'low' && t.maturityLow}
                  {level === 'medium' && t.maturityMedium}
                  {level === 'high' && t.maturityHigh}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {level === 'low' && t.justStarting}
                  {level === 'medium' && t.someActivity}
                  {level === 'high' && t.establishedPresence}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
