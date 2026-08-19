import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { ContentStrategyFormData } from '../types/contentStrategy';
import { Step1CompanyContext } from '../components/strategy-planner/Step1CompanyContext';
import { Step2GoalsAmbition } from '../components/strategy-planner/Step2GoalsAmbition';
import { Step3Audience } from '../components/strategy-planner/Step3Audience';
import { Step4OfferPositioning } from '../components/strategy-planner/Step4OfferPositioning';
import { Step5ChannelsCadence } from '../components/strategy-planner/Step5ChannelsCadence';
import { Step6OutputPreferences } from '../components/strategy-planner/Step6OutputPreferences';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const TOTAL_STEPS = 6;

export default function ContentStrategyPlanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);

  const locationState = location.state as any;
  const prefilledTopic = locationState?.prefilledTopic;
  const prefilledKeywords = locationState?.prefilledKeywords;

  const [formData, setFormData] = useState<Partial<ContentStrategyFormData>>({
    primary_channel: 'linkedin',
    posts_per_week: 3,
    blog_frequency: 'weekly',
    case_frequency: 'weekly',
    case_day: 'wednesday',
    output_language: 'nl',
    strategy_depth: 'standard',
    detail_level: 'high',
    include_examples: true,
    include_weekly_calendar: true,
    calendar_weeks: 12,
    include_content_formats: true,
    include_kpis: true,
    include_reuse_plan: true,
    time_horizon_months: 3,
    secondary_channels: ['blog'],
    success_definition: [],
    target_roles: [],
    pain_points: [],
    core_services: [],
    key_differentiators: [],
  });

  const updateFormData = (data: Partial<ContentStrategyFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  useEffect(() => {
    const savedFormData = sessionStorage.getItem('strategyFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(prev => ({ ...prev, ...parsedData }));
        sessionStorage.removeItem('strategyFormData');
      } catch (error) {
        console.error('Failed to restore form data:', error);
      }
    }

    if (prefilledTopic && prefilledKeywords) {
      const keywords = prefilledKeywords.split(',').map((k: string) => k.trim());
      setFormData(prev => ({
        ...prev,
        success_definition: [
          ...(prev.success_definition || []),
          `Focus op trending topic: ${prefilledTopic}`
        ],
        core_services: [
          ...(prev.core_services || []),
          ...keywords.slice(0, 3)
        ]
      }));
    }
  }, [prefilledTopic, prefilledKeywords]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.company_name &&
          formData.sector &&
          formData.company_size &&
          formData.geo_market &&
          formData.sales_cycle &&
          formData.current_maturity
        );
      case 2:
        return !!(
          formData.primary_goal &&
          formData.time_horizon_months &&
          formData.success_definition?.length
        );
      case 3:
        return !!(
          formData.target_roles?.length &&
          formData.decision_level &&
          formData.awareness_level &&
          formData.pain_points?.length && formData.pain_points.length >= 3
        );
      case 4:
        return !!(
          formData.core_services?.length &&
          formData.key_differentiators?.length
        );
      case 5:
        return !!(
          formData.posts_per_week &&
          formData.blog_frequency &&
          formData.case_frequency &&
          formData.case_day
        );
      case 6:
        return !!(
          formData.output_language &&
          formData.strategy_depth &&
          formData.detail_level &&
          formData.calendar_weeks
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleGenerate();
      }
    } else {
      alert(t.fieldRequired);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      const confirmed = confirm(
        'Je moet ingelogd zijn om je contentstrategie te genereren. Wil je nu inloggen of een gratis account aanmaken?'
      );
      if (confirmed) {
        sessionStorage.setItem('strategyFormData', JSON.stringify(formData));
        navigate('/login', { state: { from: '/content-strategy-planner' } });
      }
      return;
    }

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      console.log('Sending request to edge function...');
      console.log('Form data:', formData);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-content-strategy`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      let data;
      const responseText = await response.text();
      console.log('Response text:', responseText);

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error(`Invalid JSON response from server. Status: ${response.status}`);
      }

      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new Error(data.error || `API Error ${response.status}: ${JSON.stringify(data)}`);
      }

      if (!data.success || !data.plan_id) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from server - missing plan_id or success flag');
      }

      console.log('Strategy generated successfully, navigating to result...');
      navigate(`/strategy-result/${data.plan_id}`);
    } catch (error) {
      console.error('Error generating strategy:', error);
      const errorMessage = error instanceof Error ? error.message : t.errorGeneratingStrategy;
      alert(`${t.errorGeneratingStrategy}\n\nDetails: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1CompanyContext formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2GoalsAmbition formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3Audience formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4OfferPositioning formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <Step5ChannelsCadence formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <Step6OutputPreferences formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.contentStrategyPlanner}</h1>
          <p className="text-xl text-gray-600">
            {t.strategyPlannerSubtitle}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step < currentStep
                        ? 'bg-green-600 text-white'
                        : step === currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="w-6 h-6" /> : step}
                  </div>
                  <div className="text-xs mt-1 text-center text-gray-600 hidden sm:block">
                    {step === 1 && t.stepCompanyContext}
                    {step === 2 && t.stepGoalsAmbition}
                    {step === 3 && t.stepAudience}
                    {step === 4 && t.stepOfferPositioning}
                    {step === 5 && t.stepChannelsCadence}
                    {step === 6 && t.stepOutputPreferences}
                  </div>
                </div>
                {step < TOTAL_STEPS && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8 min-h-[500px]">
          {renderStep()}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.previousStep}
          </button>

          <button
            onClick={handleNext}
            disabled={!validateStep(currentStep) || generating}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.generatingStrategy}
              </>
            ) : currentStep === TOTAL_STEPS ? (
              t.generateStrategy
            ) : (
              <>
                {t.nextStep}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
