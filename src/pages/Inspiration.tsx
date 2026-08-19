import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

interface ContentSuggestion {
  title: string;
  angle: string;
  structure: string[];
  contentGoals: string[];
  keywords: {
    primary: string;
    searchVolume: number;
    relatedKeywords: Array<{
      keyword: string;
      searchVolume: number;
    }>;
  };
}

export function Inspiration() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [formData, setFormData] = useState({
    funnelStage: 'problem-aware' as 'problem-aware' | 'solution-aware' | 'product-aware',
    productUrl: '',
    targetAudience: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-inspiration`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            ...formData,
            language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert(t.inspirationError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: ContentSuggestion) => {
    navigate('/generator', {
      state: {
        prefilledData: {
          subject: suggestion.title,
          contentGoal: formData.funnelStage,
          targetAudience: formData.targetAudience,
          productUrl: formData.productUrl,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Lightbulb className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t.inspirationTitle}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.inspirationSubtitle}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="funnelStage" className="block text-sm font-medium text-gray-900 mb-2">
                {t.funnelStageLabel}
              </label>
              <select
                id="funnelStage"
                value={formData.funnelStage}
                onChange={(e) => setFormData({ ...formData, funnelStage: e.target.value as any })}
                required
                className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
              >
                <option value="problem-aware">{t.funnelProblemAware}</option>
                <option value="solution-aware">{t.funnelSolutionAware}</option>
                <option value="product-aware">{t.funnelProductAware}</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {formData.funnelStage === 'problem-aware' && t.funnelProblemDesc}
                {formData.funnelStage === 'solution-aware' && t.funnelSolutionDesc}
                {formData.funnelStage === 'product-aware' && t.funnelProductDesc}
              </p>
            </div>

            <div>
              <label htmlFor="productUrl" className="block text-sm font-medium text-gray-900 mb-2">
                {t.productUrlLabel}
              </label>
              <input
                type="url"
                id="productUrl"
                value={formData.productUrl}
                onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
                required
                placeholder={t.productUrlPlaceholder}
                className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                {t.productUrlHelp}
              </p>
            </div>

            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-900 mb-2">
                {t.targetAudienceLabel}
              </label>
              <input
                type="text"
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                required
                placeholder={t.targetAudiencePlaceholder}
                className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                {t.targetAudienceHelp}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.generatingInspiration}
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5 mr-2" />
                  {t.generateIdeas}
                </>
              )}
            </button>
          </form>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t.yourContentIdeas}
            </h2>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {suggestion.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.keywordsAndVolume}</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-green-700 uppercase tracking-wide">{t.primaryKeyword}</span>
                          <p className="text-lg font-bold text-green-900 mt-1">{suggestion.keywords.primary}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-green-700">{t.monthlySearches}</span>
                          <p className="text-2xl font-bold text-green-900">{suggestion.keywords.searchVolume.toLocaleString()}</p>
                        </div>
                      </div>

                      {suggestion.keywords.relatedKeywords && suggestion.keywords.relatedKeywords.length > 0 && (
                        <div className="border-t border-green-200 pt-3 mt-3">
                          <span className="text-xs font-medium text-green-700 uppercase tracking-wide block mb-2">{t.relatedKeywords}</span>
                          <div className="space-y-2">
                            {suggestion.keywords.relatedKeywords.map((kw, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-green-800">{kw.keyword}</span>
                                <span className="font-semibold text-green-900">{kw.searchVolume.toLocaleString()} {t.searches}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.angle}</h4>
                    <p className="text-gray-600">{suggestion.angle}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.suggestedStructure}</h4>
                    <ul className="space-y-1">
                      {suggestion.structure.map((item, i) => (
                        <li key={i} className="flex items-start text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.contentGoals}</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.contentGoals.map((goal, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center group"
                >
                  {t.useThisIdea}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
