import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { CheckCircle, AlertCircle, Trash2, Eye, EyeOff, Share2, BarChart, LogOut, Link as LinkIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { SUPABASE_URL, LINKEDIN_CLIENT_ID } from '../config';

interface LinkedInConversionSettings {
  id: string;
  access_token: string;
  conversion_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LinkedInPostSettings {
  id: string;
  access_token: string;
  person_id: string;
  organization_id: string | null;
  post_type: 'personal' | 'organization';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LinkedInOAuthToken {
  id: string;
  user_id: string;
  access_token: string;
  expires_at: string;
  scope: string;
  person_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversionLog {
  id: string;
  order_id: string;
  conversion_id: string;
  event_type: string;
  conversion_value: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function LinkedInSettings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversionSettings, setConversionSettings] = useState<LinkedInConversionSettings | null>(null);
  const [postSettings, setPostSettings] = useState<LinkedInPostSettings | null>(null);
  const [oauthToken, setOauthToken] = useState<LinkedInOAuthToken | null>(null);
  const [conversionLogs, setConversionLogs] = useState<ConversionLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingConversion, setSavingConversion] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [connectingLinkedIn, setConnectingLinkedIn] = useState(false);

  const [showConversionToken, setShowConversionToken] = useState(false);

  const [conversionFormData, setConversionFormData] = useState({
    access_token: '',
    conversion_id: '',
    is_active: true,
  });

  const [postFormData, setPostFormData] = useState({
    organization_id: '',
    post_type: 'personal' as 'personal' | 'organization',
    is_active: true,
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadSettings();
      loadConversionLogs();
    }
  }, [user]);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setMessage({ type: 'success', text: 'LinkedIn account successfully connected!' });
      loadSettings();
      searchParams.delete('success');
      setSearchParams(searchParams);
    } else if (error) {
      setMessage({ type: 'error', text: `Failed to connect LinkedIn: ${error}` });
      searchParams.delete('error');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const loadSettings = async () => {
    try {
      const [conversionResult, postResult, oauthResult] = await Promise.all([
        supabase
          .from('linkedin_settings')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle(),
        supabase
          .from('linkedin_post_settings')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle(),
        supabase
          .from('linkedin_oauth_tokens')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle()
      ]);

      if (conversionResult.error) throw conversionResult.error;
      if (postResult.error) throw postResult.error;
      if (oauthResult.error) throw oauthResult.error;

      if (conversionResult.data) {
        setConversionSettings(conversionResult.data);
        setConversionFormData({
          access_token: conversionResult.data.access_token,
          conversion_id: conversionResult.data.conversion_id,
          is_active: conversionResult.data.is_active,
        });
      }

      if (postResult.data) {
        setPostSettings(postResult.data);
        setPostFormData({
          organization_id: postResult.data.organization_id || '',
          post_type: postResult.data.post_type,
          is_active: postResult.data.is_active,
        });
      }

      if (oauthResult.data) {
        setOauthToken(oauthResult.data);
      }
    } catch (error: any) {
      console.error('Error loading LinkedIn settings:', error);
      setMessage({ type: 'error', text: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  const loadConversionLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('linkedin_conversion_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setConversionLogs(data || []);
    } catch (error: any) {
      console.error('Error loading conversion logs:', error);
    }
  };

  const handleSaveConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConversion(true);
    setMessage(null);

    try {
      if (conversionSettings) {
        const { error } = await supabase
          .from('linkedin_settings')
          .update({
            access_token: conversionFormData.access_token,
            conversion_id: conversionFormData.conversion_id,
            is_active: conversionFormData.is_active,
          })
          .eq('id', conversionSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('linkedin_settings')
          .insert({
            user_id: user?.id,
            access_token: conversionFormData.access_token,
            conversion_id: conversionFormData.conversion_id,
            is_active: conversionFormData.is_active,
          });

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Conversion tracking settings saved!' });
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving conversion settings:', error);
      setMessage({ type: 'error', text: error.message || 'Error saving settings' });
    } finally {
      setSavingConversion(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    setConnectingLinkedIn(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = SUPABASE_URL;
      const linkedInClientId = LINKEDIN_CLIENT_ID;
      const redirectUri = `${supabaseUrl}/functions/v1/linkedin-oauth-callback`;

      const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', linkedInClientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'w_member_social openid profile email');
      authUrl.searchParams.set('state', session.access_token);

      window.location.href = authUrl.toString();
    } catch (error: any) {
      console.error('Error connecting LinkedIn:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to connect LinkedIn' });
      setConnectingLinkedIn(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!oauthToken || !confirm('Are you sure you want to disconnect your LinkedIn account?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('linkedin_oauth_tokens')
        .delete()
        .eq('id', oauthToken.id);

      if (error) throw error;

      setOauthToken(null);
      setMessage({ type: 'success', text: 'LinkedIn account disconnected!' });
    } catch (error: any) {
      console.error('Error disconnecting LinkedIn:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to disconnect LinkedIn' });
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPost(true);
    setMessage(null);

    try {
      if (!oauthToken) {
        throw new Error('Please connect your LinkedIn account first');
      }

      if (!oauthToken?.person_id) {
        throw new Error('Person ID not found. Please reconnect your LinkedIn account.');
      }

      if (postSettings) {
        const { error } = await supabase
          .from('linkedin_post_settings')
          .update({
            person_id: oauthToken.person_id,
            organization_id: postFormData.organization_id || null,
            post_type: postFormData.post_type,
            is_active: postFormData.is_active,
          })
          .eq('id', postSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('linkedin_post_settings')
          .insert({
            user_id: user?.id,
            access_token: '',
            person_id: oauthToken.person_id,
            organization_id: postFormData.organization_id || null,
            post_type: postFormData.post_type,
            is_active: postFormData.is_active,
          });

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Post publishing settings saved!' });
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving post settings:', error);
      setMessage({ type: 'error', text: error.message || 'Error saving settings' });
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeleteConversion = async () => {
    if (!conversionSettings || !confirm('Are you sure you want to delete your conversion tracking settings?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('linkedin_settings')
        .delete()
        .eq('id', conversionSettings.id);

      if (error) throw error;

      setConversionSettings(null);
      setConversionFormData({
        access_token: '',
        conversion_id: '',
        is_active: true,
      });
      setMessage({ type: 'success', text: 'Conversion tracking settings deleted!' });
    } catch (error: any) {
      console.error('Error deleting conversion settings:', error);
      setMessage({ type: 'error', text: error.message || 'Error deleting settings' });
    }
  };

  const handleDeletePost = async () => {
    if (!postSettings || !confirm('Are you sure you want to delete your post publishing settings?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('linkedin_post_settings')
        .delete()
        .eq('id', postSettings.id);

      if (error) throw error;

      setPostSettings(null);
      setPostFormData({
        organization_id: '',
        post_type: 'personal',
        is_active: true,
      });
      setMessage({ type: 'success', text: 'Post publishing settings deleted!' });
    } catch (error: any) {
      console.error('Error deleting post settings:', error);
      setMessage({ type: 'error', text: error.message || 'Error deleting settings' });
    }
  };

  const isTokenExpired = () => {
    if (!oauthToken) return false;
    return new Date(oauthToken.expires_at) <= new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LinkedIn Integratie</h1>
          <p className="text-gray-600">
            Configureer LinkedIn conversion tracking en automatisch publiceren van blog posts
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Share2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Post Publishing</h2>
                <p className="text-sm text-gray-600">Automatisch blog posts publiceren</p>
              </div>
            </div>

            {oauthToken ? (
              <div className="mb-6">
                <div className={`p-4 rounded-lg border ${isTokenExpired() ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isTokenExpired() ? (
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    <span className={`font-semibold ${isTokenExpired() ? 'text-orange-900' : 'text-green-900'}`}>
                      {isTokenExpired() ? 'Token Verlopen' : 'LinkedIn Verbonden'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {isTokenExpired()
                      ? 'Je LinkedIn token is verlopen. Maak opnieuw verbinding.'
                      : `Verbonden sinds ${new Date(oauthToken.created_at).toLocaleDateString()}`
                    }
                  </p>
                  {oauthToken.person_id && !isTokenExpired() && (
                    <p className="text-xs text-gray-500 mb-3">
                      Person ID: {oauthToken.person_id}
                    </p>
                  )}
                  <button
                    onClick={isTokenExpired() ? handleConnectLinkedIn : handleDisconnectLinkedIn}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      isTokenExpired()
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    {isTokenExpired() ? (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        Opnieuw Verbinden
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        Verbinding Verbreken
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2 text-sm">OAuth 2.0 Authenticatie</h3>
                  <p className="text-xs text-blue-800 mb-3">
                    Klik op onderstaande knop om veilig verbinding te maken met je LinkedIn account via OAuth 2.0.
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-blue-800">
                    <li>Je wordt doorverwezen naar LinkedIn</li>
                    <li>Log in en geef toestemming</li>
                    <li>Je komt automatisch terug naar deze pagina</li>
                  </ol>
                </div>
                <button
                  onClick={handleConnectLinkedIn}
                  disabled={connectingLinkedIn}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <LinkIcon className="w-5 h-5" />
                  {connectingLinkedIn ? 'Verbinden...' : 'Verbind LinkedIn Account'}
                </button>
              </div>
            )}

            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label htmlFor="post_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Post Type *
                </label>
                <select
                  id="post_type"
                  value={postFormData.post_type}
                  onChange={(e) => setPostFormData({ ...postFormData, post_type: e.target.value as 'personal' | 'organization' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!oauthToken || isTokenExpired()}
                >
                  <option value="personal">Personal Profile</option>
                  <option value="organization">Company Page</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Person ID:</strong> {oauthToken?.person_id || 'Niet beschikbaar'}
                </p>
                <p className="text-xs text-blue-800">
                  Dit ID wordt automatisch opgehaald wanneer je je LinkedIn account verbindt. Als het ontbreekt, maak dan opnieuw verbinding.
                </p>
              </div>

              {postFormData.post_type === 'organization' && (
                <div>
                  <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Organization ID *
                  </label>
                  <input
                    type="text"
                    id="organization_id"
                    value={postFormData.organization_id}
                    onChange={(e) => setPostFormData({ ...postFormData, organization_id: e.target.value })}
                    placeholder="12345678"
                    required={postFormData.post_type === 'organization'}
                    disabled={!oauthToken || isTokenExpired()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Alleen het ID gedeelte (niet urn:li:organization:)
                  </p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="post_is_active"
                  checked={postFormData.is_active}
                  onChange={(e) => setPostFormData({ ...postFormData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={!oauthToken || isTokenExpired()}
                />
                <label htmlFor="post_is_active" className="ml-2 text-sm text-gray-700">
                  Publicatie inschakelen
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingPost || !oauthToken || isTokenExpired()}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  {savingPost ? 'Opslaan...' : postSettings ? 'Update' : 'Opslaan'}
                </button>
                {postSettings && (
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Conversion Tracking</h2>
                <p className="text-sm text-gray-600">LinkedIn Ads conversies bijhouden</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2 text-sm">Hoe verkrijg je de credentials:</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs text-green-800">
                <li>Ga naar <a href="https://www.linkedin.com/campaignmanager" target="_blank" rel="noopener" className="underline">Campaign Manager</a></li>
                <li>Account Assets → Insight Tag</li>
                <li>Maak een conversie aan en kopieer het ID</li>
                <li>Genereer Access Token via Developer Portal</li>
              </ol>
            </div>

            <form onSubmit={handleSaveConversion} className="space-y-4">
              <div>
                <label htmlFor="conversion_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Conversion ID *
                </label>
                <input
                  type="text"
                  id="conversion_id"
                  value={conversionFormData.conversion_id}
                  onChange={(e) => setConversionFormData({ ...conversionFormData, conversion_id: e.target.value })}
                  placeholder="12345678"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Je LinkedIn conversion tracking pixel ID
                </p>
              </div>

              <div>
                <label htmlFor="conversion_access_token" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token *
                </label>
                <div className="relative">
                  <input
                    type={showConversionToken ? 'text' : 'password'}
                    id="conversion_access_token"
                    value={conversionFormData.access_token}
                    onChange={(e) => setConversionFormData({ ...conversionFormData, access_token: e.target.value })}
                    placeholder="AQV..."
                    required
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConversionToken(!showConversionToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConversionToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Token voor Conversion API
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="conversion_is_active"
                  checked={conversionFormData.is_active}
                  onChange={(e) => setConversionFormData({ ...conversionFormData, is_active: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="conversion_is_active" className="ml-2 text-sm text-gray-700">
                  Tracking inschakelen
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingConversion}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  {savingConversion ? 'Opslaan...' : conversionSettings ? 'Update' : 'Opslaan'}
                </button>
                {conversionSettings && (
                  <button
                    type="button"
                    onClick={handleDeleteConversion}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {conversionLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Conversions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {conversionLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                        {log.order_id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        €{log.conversion_value.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status === 'success' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {log.status}
                        </span>
                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
