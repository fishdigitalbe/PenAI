import { useState } from 'react';
import { Sparkles, Mail, User } from 'lucide-react';
import { GenerationParams, CheckoutFormData } from '../types';

interface EbookFormProps {
  onCheckout: (data: CheckoutFormData) => void;
  isProcessing: boolean;
}

export default function EbookForm({ onCheckout, isProcessing }: EbookFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    generationParams: {
      targetAudience: '',
      subject: '',
      wordCount: 100,
      toneOfVoice: '',
      websiteUrl: '',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckout(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParamChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      generationParams: {
        ...prev.generationParams,
        [name]: name === 'wordCount' ? parseInt(value) || 0 : value,
      },
    }));
  };

  const calculatePrice = () => {
    const basePrice = 4900;
    const pricePerWord = 0;
    return basePrice + (formData.generationParams.wordCount * pricePerWord);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-fish-blue rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-fish-blue-dark mb-2">Klantgegevens</h3>
        <p className="text-sm text-fish-gray">
          Uw ebook wordt na betaling gegenereerd en naar uw e-mail verzonden
        </p>
      </div>

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

      <hr className="my-6 border-gray-300" />

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
          Ebook onderwerp *
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.generationParams.subject}
          onChange={handleParamChange}
          required
          placeholder="bijv. Digitale Marketing voor KMO's"
          className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
        />
      </div>

      <div>
        <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-900 mb-2">
          Doelgroep *
        </label>
        <textarea
          id="targetAudience"
          name="targetAudience"
          value={formData.generationParams.targetAudience}
          onChange={handleParamChange}
          required
          rows={3}
          placeholder="bijv. KMO-eigenaren tussen 30-50 jaar die hun online aanwezigheid willen uitbreiden"
          className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none resize-none"
        />
      </div>

      <div>
        <label htmlFor="wordCount" className="block text-sm font-medium text-gray-900 mb-2">
          Aantal woorden: {formData.generationParams.wordCount.toLocaleString()}
        </label>
        <input
          type="range"
          id="wordCount"
          name="wordCount"
          value={formData.generationParams.wordCount}
          onChange={handleParamChange}
          min="100"
          max="50000"
          step="100"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-fish-blue"
        />
        <div className="flex justify-between text-xs text-fish-gray mt-1">
          <span>100</span>
          <span>25.000</span>
          <span>50.000</span>
        </div>
      </div>

      <div>
        <label htmlFor="toneOfVoice" className="block text-sm font-medium text-gray-900 mb-2">
          Tone of voice *
        </label>
        <select
          id="toneOfVoice"
          name="toneOfVoice"
          value={formData.generationParams.toneOfVoice}
          onChange={handleParamChange}
          required
          className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
        >
          <option value="">Selecteer tone...</option>
          <option value="professional">Professioneel</option>
          <option value="casual">Casual & Conversationeel</option>
          <option value="authoritative">Gezaghebbend & Expert</option>
          <option value="friendly">Vriendelijk & Toegankelijk</option>
          <option value="inspirational">Inspirerend & Motiverend</option>
          <option value="educational">Educatief & Informatief</option>
          <option value="humorous">Humoristisch & Onderhoudend</option>
        </select>
      </div>

      <div>
        <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-900 mb-2">
          Website URL (optioneel)
        </label>
        <input
          type="url"
          id="websiteUrl"
          name="websiteUrl"
          value={formData.generationParams.websiteUrl}
          onChange={handleParamChange}
          placeholder="https://voorbeeld.be"
          className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
        />
        <p className="text-xs text-fish-gray mt-1">
          Geef een website op om de tone of voice te analyseren
        </p>
      </div>

      <div className="bg-white border-2 border-fish-blue rounded p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-900 font-semibold">Totale prijs:</span>
          <span className="text-2xl font-bold text-fish-blue">
            €{(calculatePrice() / 100).toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-fish-gray mt-2">
          Prijs varieert op basis van aantal woorden
        </p>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-fish-blue hover:bg-fish-blue-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verwerken...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Doorgaan naar betaling
          </>
        )}
      </button>
    </form>
  );
}
