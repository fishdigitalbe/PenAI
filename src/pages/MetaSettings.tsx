import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { CheckCircle, AlertCircle, Trash2, Eye, EyeOff } from 'lucide-react';

interface MetaSettings {
  id: string;
  pixel_id: string;
  access_token: string;
  test_event_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ConversionLog {
  id: string;
  order_id: string;
  pixel_id: string;
  event_type: string;
  conversion_value: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function MetaSettings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<MetaSettings | null>(null);
  const [conversionLogs, setConversionLogs] = useState<ConversionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState({
    pixel_id: '',
    access_token: '',
    test_event_code: '',
    is_active: true,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadSettings();
      loadConversionLogs();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('meta_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          pixel_id: data.pixel_id,
          access_token: data.access_token,
          test_event_code: data.test_event_code || '',
          is_active: data.is_active,
        });
      }
    } catch (error: any) {
      console.error('Error loading Meta settings:', error);
      setMessage({ type: 'error', text: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  const loadConversionLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('meta_conversion_logs')
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const saveData = {
        pixel_id: formData.pixel_id,
        access_token: formData.access_token,
        test_event_code: formData.test_event_code || null,
        is_active: formData.is_active,
      };

      if (settings) {
        const { error } = await supabase
          .from('meta_settings')
          .update(saveData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meta_settings')
          .insert({
            user_id: user?.id,
            ...saveData,
          });

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Meta settings saved successfully!' });
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving Meta settings:', error);
      setMessage({ type: 'error', text: error.message || 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!settings || !confirm('Are you sure you want to delete your Meta settings?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('meta_settings')
        .delete()
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(null);
      setFormData({
        pixel_id: '',
        access_token: '',
        test_event_code: '',
        is_active: true,
      });
      setMessage({ type: 'success', text: 'Meta settings deleted successfully!' });
    } catch (error: any) {
      console.error('Error deleting Meta settings:', error);
      setMessage({ type: 'error', text: error.message || 'Error deleting settings' });
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meta Conversion Tracking</h1>
          <p className="text-gray-600">
            Track conversions to Facebook and Instagram Ads for better campaign optimization
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">How to get your credentials:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Go to Facebook Events Manager</li>
                <li>Select your Pixel</li>
                <li>Copy the Pixel ID from Settings</li>
                <li>Go to Business Settings → System Users</li>
                <li>Create or select a System User</li>
                <li>Generate an Access Token with 'ads_management' and 'business_management' permissions</li>
                <li>Optional: Copy Test Event Code from the Test Events tab for debugging</li>
              </ol>
              <a
                href="https://developers.facebook.com/docs/marketing-api/conversions-api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 inline-block"
              >
                Learn more about Meta Conversions API →
              </a>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="pixel_id" className="block text-sm font-medium text-gray-700 mb-2">
                Pixel ID *
              </label>
              <input
                type="text"
                id="pixel_id"
                value={formData.pixel_id}
                onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
                placeholder="123456789012345"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Your Meta (Facebook) Pixel ID
              </p>
            </div>

            <div>
              <label htmlFor="access_token" className="block text-sm font-medium text-gray-700 mb-2">
                Access Token *
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  id="access_token"
                  value={formData.access_token}
                  onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                  placeholder="EAAxxxxxxxx..."
                  required
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your Meta API access token with conversion tracking permissions
              </p>
            </div>

            <div>
              <label htmlFor="test_event_code" className="block text-sm font-medium text-gray-700 mb-2">
                Test Event Code (Optional)
              </label>
              <input
                type="text"
                id="test_event_code"
                value={formData.test_event_code}
                onChange={(e) => setFormData({ ...formData, test_event_code: e.target.value })}
                placeholder="TEST12345"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Used to test events in Events Manager without affecting real data
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Enable conversion tracking
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Saving...' : settings ? 'Update Settings' : 'Save Settings'}
              </button>
              {settings && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </form>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Event</th>
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
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.event_type}
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
