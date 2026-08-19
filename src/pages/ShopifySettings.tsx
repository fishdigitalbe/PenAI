import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Store, Plus, Trash2, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface ShopifyStore {
  id: string;
  shop_name: string;
  is_active: boolean;
  created_at: string;
}

export default function ShopifySettings() {
  const { user } = useAuth();
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    access_token: '',
  });

  useEffect(() => {
    if (user) {
      loadStores();
    }
  }, [user]);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('id, shop_name, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error('Error loading stores:', err);
      setError('Fout bij het laden van Shopify stores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let shopName = formData.shop_name.trim().toLowerCase();

      if (!shopName.endsWith('.myshopify.com')) {
        shopName = shopName.replace(/^https?:\/\//, '');
        shopName = shopName.replace(/\/$/, '');
        if (!shopName.includes('.')) {
          shopName = `${shopName}.myshopify.com`;
        }
      }

      const { data, error } = await supabase
        .from('shopify_stores')
        .insert([
          {
            user_id: user?.id,
            shop_name: shopName,
            access_token: formData.access_token.trim(),
            is_active: stores.length === 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSuccess('Shopify store succesvol toegevoegd!');
      setFormData({ shop_name: '', access_token: '' });
      setShowAddForm(false);
      await loadStores();
    } catch (err: any) {
      console.error('Error adding store:', err);
      setError(err.message || 'Fout bij het toevoegen van Shopify store');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetActive = async (storeId: string) => {
    try {
      await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .eq('user_id', user?.id);

      const { error } = await supabase
        .from('shopify_stores')
        .update({ is_active: true })
        .eq('id', storeId);

      if (error) throw error;

      setSuccess('Actieve store bijgewerkt!');
      await loadStores();
    } catch (err: any) {
      console.error('Error setting active store:', err);
      setError('Fout bij het instellen van actieve store');
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Weet je zeker dat je deze Shopify store wilt verwijderen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('shopify_stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      setSuccess('Shopify store verwijderd!');
      await loadStores();
    } catch (err: any) {
      console.error('Error deleting store:', err);
      setError('Fout bij het verwijderen van Shopify store');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Shopify Integratie</h1>
          </div>
          <p className="text-gray-600">
            Verbind je Shopify store(s) om blogs direct te publiceren vanuit Penai
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">Fout</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-semibold">Succes</p>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Hoe krijg je een Shopify Access Token?</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Ga naar je Shopify admin: <strong>Settings → Apps and sales channels</strong></li>
            <li>Klik op <strong>"Develop apps"</strong></li>
            <li>Klik op <strong>"Create an app"</strong> en geef het een naam (bijv. "Penai Blog Publisher")</li>
            <li>Ga naar <strong>Configuration</strong> en klik op <strong>"Configure Admin API scopes"</strong></li>
            <li>Selecteer de scope: <strong>write_blogs</strong></li>
            <li>Klik op <strong>"Install app"</strong> en kopieer de <strong>Admin API access token</strong></li>
          </ol>
          <a
            href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium mt-2 text-sm"
          >
            Meer info in Shopify documentatie
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Shopify stores laden...</p>
          </div>
        ) : (
          <>
            {stores.length > 0 && (
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Verbonden Stores</h2>
                  <div className="space-y-3">
                    {stores.map((store) => (
                      <div
                        key={store.id}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          store.is_active
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Store className={`w-5 h-5 ${store.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium text-gray-900">{store.shop_name}</p>
                            {store.is_active && (
                              <span className="text-xs text-green-700 font-semibold">Actief</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!store.is_active && (
                            <button
                              onClick={() => handleSetActive(store.id)}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            >
                              Maak actief
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                <p className="text-gray-600 group-hover:text-green-700 font-medium">
                  Voeg een Shopify store toe
                </p>
              </button>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Nieuwe Shopify Store</h2>
                <form onSubmit={handleAddStore} className="space-y-4">
                  <div>
                    <label htmlFor="shop_name" className="block text-sm font-medium text-gray-900 mb-2">
                      Shop Name *
                    </label>
                    <input
                      type="text"
                      id="shop_name"
                      value={formData.shop_name}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      placeholder="mijnwinkel.myshopify.com"
                      required
                      className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all outline-none"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Je myshopify.com domein (bijv. mijnwinkel.myshopify.com)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="access_token" className="block text-sm font-medium text-gray-900 mb-2">
                      Admin API Access Token *
                    </label>
                    <input
                      type="password"
                      id="access_token"
                      value={formData.access_token}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      placeholder="shpat_..."
                      required
                      className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all outline-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Je Shopify Admin API access token met write_blogs rechten
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Toevoegen...
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 mr-2" />
                          Store Toevoegen
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setFormData({ shop_name: '', access_token: '' });
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-all"
                    >
                      Annuleren
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
