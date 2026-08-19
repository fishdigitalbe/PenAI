import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { ContentStrategy, WeeklyContent } from '../types/contentStrategy';
import { Loader2, Calendar, FileText, Linkedin, ArrowRight } from 'lucide-react';

export default function StrategyExecution() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      const { data: plan, error: planError } = await supabase
        .from('content_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();

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

      if (outputError) throw outputError;
      if (!output || !output.output_json) {
        throw new Error('Strategy output not found');
      }

      setStrategy(output.output_json as ContentStrategy);
    } catch (error: any) {
      console.error('Error fetching strategy:', error);
      alert(`Error: ${error.message}\n\nYou will be redirected back.`);
      navigate(`/strategy-result/${planId}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Plan laden...</p>
        </div>
      </div>
    );
  }

  if (!strategy || !strategy.calendar_12_weeks) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Geen planning beschikbaar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            12-Weken Uitvoeringsplan
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">{planData?.company_name}</p>
        </div>

        <div className="space-y-6">
          {strategy.calendar_12_weeks.map((week: WeeklyContent) => (
            <div key={week.week_number} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-600 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <Calendar className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Week {week.week_number}</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {week.blog && (
                  <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Blog Article</h3>
                        </div>
                        <div className="font-medium text-gray-900 mb-3">{week.blog.title}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><span className="font-medium">Buyer Stage:</span> {week.blog.buyer_stage}</div>
                          <div><span className="font-medium">Target Role:</span> {week.blog.target_role}</div>
                          <div><span className="font-medium">Keyword:</span> {week.blog.primary_keyword}</div>
                        </div>
                        {week.blog.outline_h2 && week.blog.outline_h2.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm font-medium text-gray-700 mb-1">Hoofdstukken:</div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {week.blog.outline_h2.map((h2, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>{h2}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const buyerStageToGoalMap: Record<string, 'problem-aware' | 'solution-aware' | 'product-aware'> = {
                            'Awareness': 'problem-aware',
                            'Consideration': 'solution-aware',
                            'Decision': 'product-aware',
                          };

                          const languageMap: Record<string, string> = {
                            'Nederlands': 'nl',
                            'English': 'en',
                            'Frans': 'fr',
                            'Duits': 'de',
                            'Spaans': 'es',
                          };

                          const outputLang = planData?.output_language || 'Nederlands';
                          const langCode = languageMap[outputLang] || 'nl';

                          const prefilledData = {
                            targetAudience: week.blog.target_role || '',
                            subject: week.blog.title || '',
                            wordCount: 2500,
                            toneOfVoice: 'professional',
                            language: langCode,
                            contentType: 'blog' as const,
                            contentGoal: buyerStageToGoalMap[week.blog.buyer_stage] || 'problem-aware',
                            websiteUrl: planData?.website_url || '',
                          };

                          navigate('/generator', { state: { prefilledData } });
                        }}
                        className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium text-sm"
                      >
                        Genereer Blog
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {week.linkedin_posts && week.linkedin_posts.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Linkedin className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        LinkedIn Posts ({week.linkedin_posts.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {week.linkedin_posts.map((post, idx) => (
                        <div key={idx} className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-blue-900 mb-2">
                            {post.day} - {post.format}
                          </div>
                          <div className="text-gray-800 mb-2">{post.hook}</div>
                          {post.bullets && post.bullets.length > 0 && (
                            <ul className="text-sm text-gray-700 space-y-1 ml-4">
                              {post.bullets.map((bullet, bidx) => (
                                <li key={bidx} className="list-disc">{bullet}</li>
                              ))}
                            </ul>
                          )}
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="mt-2 text-sm text-blue-600">
                              {post.hashtags.map(tag => `#${tag}`).join(' ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(`/strategy-result/${planId}`)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Terug naar strategie overzicht
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
