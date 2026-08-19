import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Save, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

interface CustomerData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  vat_number: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
}

interface VatLookupResponse {
  valid: boolean;
  countryCode?: string;
  vatNumber?: string;
  name?: string;
  address?: {
    street?: string;
    number?: string;
    zip_code?: string;
    city?: string;
    country?: string;
    countryCode?: string;
  };
  strAddress?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookingUpVat, setLookingUpVat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vatError, setVatError] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    vat_number: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'BE',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadCustomerData();
  }, [user, navigate]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      let { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data && user?.email) {
        const { data: emailData, error: emailFetchError } = await supabase
          .from('customers')
          .select('*')
          .eq('email', user.email)
          .is('user_id', null)
          .maybeSingle();

        if (!emailFetchError) {
          data = emailData;
        }
      }

      if (data) {
        setCustomerData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          company_name: data.company_name || '',
          vat_number: data.vat_number || '',
          address: data.address || '',
          postal_code: data.postal_code || '',
          city: data.city || '',
          country: data.country || 'BE',
        });
      } else {
        setCustomerData(prev => ({
          ...prev,
          email: user?.email || '',
        }));
      }
    } catch (err) {
      console.error('Error loading customer data:', err);
      setError('Fout bij het laden van uw gegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!customerData.first_name?.trim()) {
      setError('Voornaam is verplicht');
      setSaving(false);
      return;
    }

    if (!customerData.email?.trim()) {
      setError('E-mailadres is verplicht');
      setSaving(false);
      return;
    }

    try {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      const { data: emailCustomer } = await supabase
        .from('customers')
        .select('id, user_id')
        .eq('email', customerData.email.trim())
        .maybeSingle();

      if (existingCustomer) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            first_name: customerData.first_name.trim(),
            last_name: customerData.last_name?.trim() || null,
            phone: customerData.phone?.trim() || null,
            company_name: customerData.company_name?.trim() || null,
            vat_number: customerData.vat_number?.trim() || null,
            address: customerData.address?.trim() || null,
            postal_code: customerData.postal_code?.trim() || null,
            city: customerData.city?.trim() || null,
            country: customerData.country?.trim() || 'BE',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user?.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
      } else if (emailCustomer && !emailCustomer.user_id) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            user_id: user?.id,
            first_name: customerData.first_name.trim(),
            last_name: customerData.last_name?.trim() || null,
            phone: customerData.phone?.trim() || null,
            company_name: customerData.company_name?.trim() || null,
            vat_number: customerData.vat_number?.trim() || null,
            address: customerData.address?.trim() || null,
            postal_code: customerData.postal_code?.trim() || null,
            city: customerData.city?.trim() || null,
            country: customerData.country?.trim() || 'BE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', emailCustomer.id);

        if (updateError) {
          console.error('Update error for email customer:', updateError);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            user_id: user?.id,
            email: customerData.email.trim(),
            first_name: customerData.first_name.trim(),
            last_name: customerData.last_name?.trim() || null,
            phone: customerData.phone?.trim() || null,
            company_name: customerData.company_name?.trim() || null,
            vat_number: customerData.vat_number?.trim() || null,
            address: customerData.address?.trim() || null,
            postal_code: customerData.postal_code?.trim() || null,
            city: customerData.city?.trim() || null,
            country: customerData.country?.trim() || 'BE',
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      setSuccess('Uw gegevens zijn succesvol bijgewerkt');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error saving customer data:', err);
      const errorMessage = err?.message || 'Fout bij het opslaan van uw gegevens';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatVatNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) return '';

    if (digits.length <= 4) {
      return `BE${digits}`;
    } else if (digits.length <= 7) {
      return `BE${digits.slice(0, 4)}.${digits.slice(4)}`;
    } else {
      return `BE${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7, 10)}`;
    }
  };

  const validateVatFormat = (vat: string): boolean => {
    const pattern = /^BE\d{4}\.\d{3}\.\d{3}$/;
    return pattern.test(vat);
  };

  const lookupVatNumber = async () => {
    if (!customerData.vat_number) return;

    if (!validateVatFormat(customerData.vat_number)) {
      setVatError('BTW-nummer moet het formaat BExxxx.xxx.xxx hebben');
      return;
    }

    setLookingUpVat(true);
    setVatError(null);
    setError(null);

    try {
      const vatNumberClean = customerData.vat_number.replace(/\./g, '');
      const response = await fetch(`https://controleerbtwnummer.eu/api/validate/${vatNumberClean}.json`);

      if (!response.ok) {
        throw new Error('Fout bij ophalen BTW-gegevens');
      }

      const data: VatLookupResponse = await response.json();

      if (data.valid) {
        const newData: Partial<CustomerData> = {};

        if (data.name) {
          newData.company_name = data.name;
        }

        if (data.address) {
          const addr = data.address;

          if (addr.street && addr.number) {
            newData.address = `${addr.street} ${addr.number}`;
          } else if (addr.street) {
            newData.address = addr.street;
          }

          if (addr.zip_code) {
            newData.postal_code = addr.zip_code;
          }

          if (addr.city) {
            newData.city = addr.city;
          }

          if (addr.countryCode) {
            newData.country = addr.countryCode;
          }
        }

        setCustomerData(prev => ({ ...prev, ...newData }));
        setSuccess('Bedrijfsgegevens succesvol opgehaald');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setVatError('BTW-nummer niet gevonden of niet geldig');
      }
    } catch (err) {
      console.error('Error looking up VAT number:', err);
      setVatError('Fout bij ophalen BTW-gegevens. Probeer later opnieuw.');
    } finally {
      setLookingUpVat(false);
    }
  };

  const handleChange = (field: keyof CustomerData, value: string) => {
    if (field === 'vat_number') {
      const formatted = formatVatNumber(value);
      setCustomerData(prev => ({ ...prev, [field]: formatted }));
      setVatError(null);
    } else {
      setCustomerData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-gray-500">Laden...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mijn Profiel</h1>
          <p className="text-gray-600">Beheer uw persoonlijke en bedrijfsgegevens</p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Persoonlijke gegevens</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Voornaam *"
                value={customerData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
                placeholder="Jan"
              />

              <Input
                label="Achternaam"
                value={customerData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Janssens"
              />

              <Input
                label="E-mailadres *"
                type="email"
                value={customerData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled
                placeholder="jan@example.com"
              />

              <Input
                label="Telefoonnummer"
                type="tel"
                value={customerData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+32 123 45 67 89"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Bedrijfsgegevens (optioneel)</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BTW-nummer (formaat: BExxxx.xxx.xxx)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={customerData.vat_number}
                      onChange={(e) => handleChange('vat_number', e.target.value)}
                      placeholder="BE0123.456.789"
                      maxLength={14}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={lookupVatNumber}
                    disabled={lookingUpVat || !customerData.vat_number}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Search className="w-4 h-4" />
                    {lookingUpVat ? 'Bezig...' : 'Gegevens ophalen'}
                  </Button>
                </div>
                {vatError && (
                  <p className="text-sm text-red-600 mt-1">{vatError}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Vul uw BTW-nummer in en klik op "Gegevens ophalen" om automatisch uw bedrijfsgegevens in te vullen
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Bedrijfsnaam"
                  value={customerData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Mijn Bedrijf BV"
                  className="md:col-span-2"
                />

                <Input
                  label="Land"
                  value={customerData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="BE"
                />

                <Input
                  label="Stad"
                  value={customerData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Brussel"
                />

                <Input
                  label="Postcode"
                  value={customerData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder="1000"
                />

                <Input
                  label="Adres"
                  value={customerData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Straatnaam 123"
                  className="md:col-span-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/portal')}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Bezig met opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
