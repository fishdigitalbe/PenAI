import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';
import { ContentStrategy, WeeklyContent } from '../types/contentStrategy';
import { Loader2, Target, Calendar, TrendingUp, ArrowRight } from 'lucide-react';

export default function StrategyResult() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);
  const [planData, setPlanData] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchStrategy();
  }, [user, planId]);

  const fetchStrategy = async () => {
    try {
      console.log('Fetching strategy for planId:', planId);

      const { data: plan, error: planError } = await supabase
        .from('content_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();

      console.log('Plan data:', plan, 'Error:', planError);

      if (planError) throw planError;
      if (!plan) {
        throw new Error('Plan not found');
      }
      setPlanData(plan);

      const { data: output, error: outputError } = await supabase
        .from('content_plan_outputs')
        .select('*')
        .eq('content_plan_id', planId)
        .maybeSingle();

      console.log('Output data:', output, 'Error:', outputError);

      if (outputError) throw outputError;
      if (!output || !output.output_json) {
        throw new Error('Strategy output not found');
      }

      setStrategy(output.output_json as ContentStrategy);
    } catch (error: any) {
      console.error('Error fetching strategy:', error);
      const errorMessage = error.message || 'Failed to load strategy';
      alert(`Error: ${errorMessage}\n\nYou will be redirected back.`);
      navigate('/content-strategy-planner');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t.generatingStrategy}</p>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t.errorGeneratingStrategy}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t.yourContentStrategy}</h1>
              <p className="text-lg sm:text-xl text-gray-600">{planData?.company_name}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">{t.executiveSummary}</h2>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed">{strategy.strategy_objective}</p>
        </div>

        {strategy.content_pillars && Array.isArray(strategy.content_pillars) && strategy.content_pillars.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">{t.contentPillars}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {strategy.content_pillars.map((pillar, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-900">{pillar}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {strategy.calendar_12_weeks && Array.isArray(strategy.calendar_12_weeks) && strategy.calendar_12_weeks.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">{t.weeklyContentPreview}</h2>
            </div>
            <p className="text-gray-600 mb-6">{t.weeksPreviewNote}</p>

            {strategy.calendar_12_weeks.slice(0, 2).map((week: WeeklyContent) => (
            <div key={week.week_number} className="mb-6 p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t.week} {week.week_number}</h3>

              {week.blog && (
                <div className="mb-4">
                  <div className="font-semibold text-gray-900 mb-2">{t.blogPost}</div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900 mb-2">{week.blog.title}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{t.buyerStage}: <span className="font-medium">{week.blog.buyer_stage}</span></div>
                      <div>{t.targetRole}: <span className="font-medium">{week.blog.target_role}</span></div>
                      <div>{t.keyword}: <span className="font-medium">{week.blog.primary_keyword}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {week.linkedin_posts && Array.isArray(week.linkedin_posts) && week.linkedin_posts.length > 0 && (
                <div>
                  <div className="font-semibold text-gray-900 mb-2">{t.linkedInPosts} ({week.linkedin_posts.length})</div>
                  <div className="space-y-3">
                    {week.linkedin_posts.map((post, idx) => (
                      <div key={idx} className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">{post.day} - {post.format}</div>
                        <div className="text-gray-800">{post.hook}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            ))}
          </div>
        )}

        {strategy.kpis && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.kpisMeasurement}</h2>
            {strategy.kpis.primary_metrics && Array.isArray(strategy.kpis.primary_metrics) && strategy.kpis.primary_metrics.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold text-gray-900 mb-2">{t.primaryMetrics}:</div>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {strategy.kpis.primary_metrics.map((metric, idx) => (
                    <li key={idx}>{metric}</li>
                  ))}
                </ul>
              </div>
            )}
            {strategy.kpis.measurement_notes && (
              <div className="text-gray-700">{strategy.kpis.measurement_notes}</div>
            )}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => navigate(`/strategy-execution/${planId}`)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-semibold"
          >
            Klaar om te starten?
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
