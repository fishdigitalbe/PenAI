import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link to="/" className="flex justify-center mb-8">
              <img src="/PenAI.png" alt="Penai.be" className="h-16" />
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t.emailSentTitle}
              </h2>
              <p className="text-gray-600 mb-6">
                {t.emailSentMessage} <strong>{email}</strong> {t.emailSentInstructions}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {t.checkSpamFolder}
              </p>
              <Link
                to="/login"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToLogin}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="flex justify-center mb-8">
            <img src="/PenAI.png" alt="Penai.be" className="h-16" />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t.forgotPasswordTitle}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t.forgotPasswordSubtitle}
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white rounded-xl shadow-lg p-8" onSubmit={handleSubmit}>
          <div>
            <Input
              label={t.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder={t.emailPlaceholder}
            />
          </div>

          {error && (
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div>
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {t.sendResetLink}
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.backToLogin}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
