import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, User, CreditCard, Building2, MapPin, Hash, Tag, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { GenerationParams, CustomerDetails } from '../types';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

interface Step3Props {
  generationParams: GenerationParams;
  onBack: () => void;
  onSubmit: (customerDetails: CustomerDetails, promoCode?: string) => void;
  isProcessing: boolean;
}

export default function Step3Billing({
  generationParams,
  onBack,
  onSubmit,
  isProcessing,
}: Step3Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CustomerDetails>({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    vatNumber: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'BE',
  });

  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    const loadCustomerData = async () => {
      if (!loading && user) {
        let { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!customerData && user.email) {
          const { data: emailCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', user.email)
            .is('user_id', null)
            .maybeSingle();

          customerData = emailCustomer;
        }

        if (customerData) {
          setFormData({
            firstName: customerData.first_name || '',
            lastName: customerData.last_name || '',
            email: customerData.email || user.email || '',
            phone: customerData.phone || '',
            companyName: customerData.company_name || '',
            vatNumber: customerData.vat_number || '',
            address: customerData.address || '',
            postalCode: customerData.postal_code || '',
            city: customerData.city || '',
            country: customerData.country || 'BE',
          });
        } else {
          setFormData(prev => ({
            ...prev,
            email: user.email || ''
          }));
        }
      }
    };

    loadCustomerData();
  }, [user, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is admin (stein@fishdigital.be) - bypass payment
    if (user?.email === 'stein@fishdigital.be') {
      // Use a special promo code for 100% discount
      onSubmit(formData, 'ADMIN_BYPASS');
      return;
    }

    onSubmit(formData, promoStatus === 'valid' ? promoCode : undefined);
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      return;
    }

    setPromoStatus('validating');
    setPromoError('');

    try {
      const supabaseUrl = SUPABASE_URL;
      const supabaseKey = SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/promo_codes?code=eq.${promoCode.toUpperCase()}&is_active=eq.true&select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to validate promo code');
      }

      const data = await response.json();

      if (data.length === 0) {
        setPromoStatus('invalid');
        setPromoError('Ongeldige promocode');
        return;
      }

      const promo = data[0];
      const now = new Date();

      if (promo.valid_from && new Date(promo.valid_from) > now) {
        setPromoStatus('invalid');
        setPromoError('Deze promocode is nog niet geldig');
        return;
      }

      if (promo.valid_until && new Date(promo.valid_until) < now) {
        setPromoStatus('invalid');
        setPromoError('Deze promocode is verlopen');
        return;
      }

      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        setPromoStatus('invalid');
        setPromoError('Deze promocode heeft de gebruikslimiet bereikt');
        return;
      }

      setPromoStatus('valid');
      setDiscountPercentage(promo.discount_percentage);
    } catch (error) {
      setPromoStatus('invalid');
      setPromoError('Fout bij het valideren van promocode');
    }
  };

  const calculatePrice = () => {
    const basePrice = 4900;
    const pricePerWord = 0;
    return basePrice + (generationParams.wordCount * pricePerWord);
  };

  const calculateFinalPrice = () => {
    const originalPrice = calculatePrice();
    if (promoStatus === 'valid' && discountPercentage > 0) {
      return originalPrice - Math.round(originalPrice * (discountPercentage / 100));
    }
    return originalPrice;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    const handleLoginRedirect = () => {
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        generationParams,
        returnTo: '/generator'
      }));
      navigate('/login');
    };

    const handleSignupRedirect = () => {
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        generationParams,
        returnTo: '/generator'
      }));
      navigate('/signup');
    };

    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <LogIn className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Inloggen verplicht</h3>
              <p className="text-yellow-800 mb-4">
                Om een ebook te bestellen, moet u eerst inloggen of een account aanmaken. Zo krijgt u toegang tot uw klantenzone waar al uw content beschikbaar is.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleLoginRedirect}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Inloggen
                </button>
                <button
                  onClick={handleSignupRedirect}
                  className="px-6 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Registreren
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 text-fish-gray hover:text-fish-blue transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Terug
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-fish-blue rounded p-4 mb-6">
        <h3 className="font-semibold text-fish-blue-dark mb-2">Uw gegevens</h3>
        <p className="text-sm text-fish-gray">
          Vul uw gegevens in om de bestelling te voltooien. Na succesvolle betaling is uw ebook beschikbaar in uw klantenzone.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            Voornaam *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="Jan"
            className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            Achternaam *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder="Jansen"
            className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
          <Mail className="inline w-4 h-4 mr-1" />
          E-mailadres *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="jan@voorbeeld.be"
          className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-900 mb-2">
            <Building2 className="inline w-4 h-4 mr-1" />
            Bedrijfsnaam *
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            placeholder="Fish Digital BV"
            className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
          />
        </div>

        <div>
          <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-900 mb-2">
            <Hash className="inline w-4 h-4 mr-1" />
            BTW nummer *
          </label>
          <input
            type="text"
            id="vatNumber"
            name="vatNumber"
            value={formData.vatNumber}
            onChange={handleChange}
            required
            placeholder="BE0123456789"
            className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          Adres *
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          placeholder="Straatnaam 123"
          className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-900 mb-2">
            Postcode *
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
            placeholder="1000"
            className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">
            Gemeente *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            placeholder="Brussel"
            className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-900 mb-2">
            Land *
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
          >
            <option value="BE">België</option>
            <option value="NL">Nederland</option>
            <option value="LU">Luxemburg</option>
            <option value="FR">Frankrijk</option>
            <option value="DE">Duitsland</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded p-6 mb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Promocode</h4>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoStatus('idle');
                setPromoError('');
              }}
              placeholder="Voer promocode in"
              className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
            />
          </div>
          <button
            type="button"
            onClick={validatePromoCode}
            disabled={!promoCode.trim() || promoStatus === 'validating'}
            className="px-6 py-3 bg-fish-blue hover:bg-fish-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded transition-all duration-200 flex items-center gap-2"
          >
            {promoStatus === 'validating' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Valideren...
              </>
            ) : (
              <>
                <Tag className="w-4 h-4" />
                Toepassen
              </>
            )}
          </button>
        </div>
        {promoStatus === 'valid' && (
          <div className="mt-2 flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Promocode toegepast! {discountPercentage}% korting</span>
          </div>
        )}
        {promoStatus === 'invalid' && (
          <div className="mt-2 flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{promoError}</span>
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-fish-blue rounded p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Overzicht bestelling</h4>
        <div className="space-y-2 text-sm text-fish-gray mb-4">
          <div className="flex justify-between">
            <span>Ebook onderwerp:</span>
            <span className="font-medium text-gray-900">{generationParams.subject}</span>
          </div>
          <div className="flex justify-between">
            <span>Aantal woorden:</span>
            <span className="font-medium text-gray-900">
              {generationParams.wordCount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tone of voice:</span>
            <span className="font-medium text-gray-900">{generationParams.toneOfVoice}</span>
          </div>
        </div>
        <div className="border-t-2 border-gray-300 pt-4 space-y-2">
          {promoStatus === 'valid' && discountPercentage > 0 && (
            <>
              <div className="flex justify-between items-center text-fish-gray">
                <span>Oorspronkelijke prijs:</span>
                <span className="line-through">€{(calculatePrice() / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-green-600 font-medium">
                <span>Korting ({discountPercentage}%):</span>
                <span>- €{(Math.round(calculatePrice() * (discountPercentage / 100)) / 100).toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-900 font-semibold text-lg">Totale prijs:</span>
            <span className="text-3xl font-bold text-fish-blue">
              €{(calculateFinalPrice() / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-900 font-semibold py-4 px-6 rounded transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Terug
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="flex-1 bg-fish-blue hover:bg-fish-blue-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verwerken...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Doorgaan naar betaling
            </>
          )}
        </button>
      </div>
    </form>
  );
}
