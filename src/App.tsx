import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { BookOpen, CheckCircle } from 'lucide-react';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Success } from './pages/Success';
import { Inspiration } from './pages/Inspiration';
import { Orders } from './pages/Orders';
import Portal from './pages/Portal';
import Profile from './pages/Profile';
import ShopifySettings from './pages/ShopifySettings';
import LinkedInSettings from './pages/LinkedInSettings';
import MetaSettings from './pages/MetaSettings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Disclaimer from './pages/Disclaimer';
import Withdrawal from './pages/Withdrawal';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogCategory from './pages/BlogCategory';
import BlogAdmin from './pages/BlogAdmin';
import ContentStrategyPlanner from './pages/ContentStrategyPlanner';
import StrategyResult from './pages/StrategyResult';
import StrategyExecution from './pages/StrategyExecution';
import ScheduledPosts from './pages/ScheduledPosts';
import TrendingTopics from './pages/TrendingTopics';
import ContentRepurposing from './pages/ContentRepurposing';
import ContentCalendar from './pages/ContentCalendar';
import About from './pages/About';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import StepIndicator from './components/StepIndicator';
import Step1EbookParams from './components/Step1EbookParams';
import Step2Preview from './components/Step2Preview';
import Step3Billing from './components/Step3Billing';
import { GenerationParams } from './types';
import { useLanguage } from './lib/LanguageContext';
import { LanguageProvider } from './lib/LanguageContext';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

function Generator() {
  const { t } = useLanguage();
  const location = useLocation();

  const getPendingOrder = () => {
    const pendingOrderData = sessionStorage.getItem('pendingOrder');
    if (pendingOrderData) {
      const { generationParams: savedParams } = JSON.parse(pendingOrderData);
      sessionStorage.removeItem('pendingOrder');
      return savedParams;
    }
    return null;
  };

  const initialParams = getPendingOrder();
  const [currentStep, setCurrentStep] = useState(initialParams ? 2 : 0);
  const [generationParams, setGenerationParams] = useState<GenerationParams | null>(initialParams);

  // Handle OAuth callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      console.log('Processing OAuth callback on generator page...');
      // Clean up the URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  const prefilledData = (location.state as any)?.prefilledData;
  const [preview, setPreview] = useState<{
    title: string;
    preview: string;
    wordCount: number;
    image?: { url: string; photographer: string; photographerUrl: string } | null;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const steps = [t.stepEbookDetails, t.stepPreview, t.stepPayment];

  const handleStep1Complete = async (params: GenerationParams) => {
    setGenerationParams(params);
    setError(null);
    setIsLoadingPreview(true);

    try {
      const apiUrl = `${SUPABASE_URL}/functions/v1/generate-preview`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ generationParams: params }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate preview');
      }

      const data = await response.json();
      setPreview(data);
      setCurrentStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleStep2Complete = () => {
    setCurrentStep(2);
  };

  const handleStep3Complete = async (customerDetails: import('./types').CustomerDetails, promoCode?: string) => {
    if (!generationParams) return;

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const basePrice = 4900;
      const pricePerWord = 0;
      const amount = basePrice + (generationParams.wordCount * pricePerWord);

      const apiUrl = `${SUPABASE_URL}/functions/v1/create-checkout`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          customerDetails,
          generationParams,
          amount,
          promoCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (data.isFree) {
        setSuccessMessage(data.message);
        setIsProcessing(false);
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">


        <StepIndicator currentStep={currentStep} steps={steps} />

        <div className="bg-fish-gray-light rounded-lg p-8 lg:p-12 mb-8">
          {successMessage && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-semibold mb-1">{t.success}</p>
                  <p className="text-green-700 text-sm">{successMessage}</p>
                  <p className="text-green-600 text-sm mt-2">
                    {t.successCheck}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-semibold mb-1">{t.error}</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {currentStep === 0 && (
            <Step1EbookParams
              onNext={handleStep1Complete}
              isGenerating={isLoadingPreview}
              initialData={prefilledData}
            />
          )}

          {currentStep === 1 && (
            <Step2Preview
              preview={preview}
              isLoading={isLoadingPreview}
              onBack={handleBack}
              onNext={handleStep2Complete}
            />
          )}

          {currentStep === 2 && generationParams && (
            <Step3Billing
              generationParams={generationParams}
              onBack={handleBack}
              onSubmit={handleStep3Complete}
              isProcessing={isProcessing}
            />
          )}
        </div>

        <div className="text-center text-sm text-fish-gray">
          <p>{t.securePayment}</p>
          <p className="mt-2">{t.deliveryTime}</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generator" element={<Generator />} />
            <Route path="/inspiration" element={<Inspiration />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/success" element={<Success />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/algemene-voorwaarden" element={<Terms />} />
            <Route path="/privacy-policy" element={<Privacy />} />
            <Route path="/cookie-policy" element={<Cookies />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/herroepingsrecht" element={<Withdrawal />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/category/:category" element={<BlogCategory />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route
              path="/blog-admin"
              element={
                <ProtectedRoute>
                  <BlogAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-strategy-planner"
              element={<ContentStrategyPlanner />}
            />
            <Route
              path="/trending-topics"
              element={<TrendingTopics />}
            />
            <Route
              path="/content-repurposing"
              element={<ContentRepurposing />}
            />
            <Route
              path="/content-calendar"
              element={<ContentCalendar />}
            />
            <Route
              path="/strategy-result/:planId"
              element={
                <ProtectedRoute>
                  <StrategyResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strategy-execution/:planId"
              element={
                <ProtectedRoute>
                  <StrategyExecution />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal"
              element={
                <ProtectedRoute>
                  <Portal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shopify"
              element={
                <ProtectedRoute>
                  <ShopifySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/linkedin"
              element={
                <ProtectedRoute>
                  <LinkedInSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meta"
              element={
                <ProtectedRoute>
                  <MetaSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduled-posts"
              element={
                <ProtectedRoute>
                  <ScheduledPosts />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;