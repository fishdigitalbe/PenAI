import { useState } from 'react';
import { ArrowRight, Loader2, BookOpen, FileText, AlertCircle, Compass, ShoppingBag } from 'lucide-react';
import { GenerationParams } from '../types';

interface Step1Props {
  onNext: (params: GenerationParams) => void;
  isGenerating?: boolean;
  initialData?: Partial<GenerationParams>;
}

export default function Step1EbookParams({ onNext, isGenerating = false, initialData }: Step1Props) {
  const [formData, setFormData] = useState<GenerationParams>({
    targetAudience: initialData?.targetAudience || '',
    subject: initialData?.subject || '',
    wordCount: initialData?.wordCount || 100,
    toneOfVoice: initialData?.toneOfVoice || '',
    language: initialData?.language || '',
    contentType: initialData?.contentType || 'blog',
    contentGoal: initialData?.contentGoal || 'problem-aware',
    productUrl: '',
    websiteUrl: '',
    createSocialAssets: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'wordCount' ? parseInt(value) || 0 : value),
    }));
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Content type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, contentType: 'ebook' }))}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              formData.contentType === 'ebook'
                ? 'border-fish-blue bg-blue-50 ring-2 ring-fish-blue ring-offset-2'
                : 'border-gray-300 hover:border-fish-blue hover:bg-gray-50'
            }`}
          >
            <BookOpen className={`w-6 h-6 mb-2 ${
              formData.contentType === 'ebook' ? 'text-fish-blue' : 'text-gray-600'
            }`} />
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">E-book</h3>
            <p className="text-xs text-fish-gray">
              Een uitgebreid e-book met meerdere hoofdstukken
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, contentType: 'blog' }))}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              formData.contentType === 'blog'
                ? 'border-fish-blue bg-blue-50 ring-2 ring-fish-blue ring-offset-2'
                : 'border-gray-300 hover:border-fish-blue hover:bg-gray-50'
            }`}
          >
            <FileText className={`w-6 h-6 mb-2 ${
              formData.contentType === 'blog' ? 'text-fish-blue' : 'text-gray-600'
            }`} />
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Long-read blog</h3>
            <p className="text-xs text-fish-gray">
              SEO-geoptimaliseerd voor maximale vindbaarheid
            </p>
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
          {formData.contentType === 'blog' ? 'Blog onderwerp' : 'Ebook onderwerp'} *
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          placeholder="bijv. Digitale Marketing voor KMO's"
          className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
        />
      </div>

      <div>
        <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-900 mb-2">
          Doelgroep *
        </label>
        <textarea
          id="targetAudience"
          name="targetAudience"
          value={formData.targetAudience}
          onChange={handleChange}
          required
          rows={2}
          placeholder="bijv. KMO-eigenaren tussen 30-50 jaar die hun online aanwezigheid willen uitbreiden"
          className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="toneOfVoice" className="block text-sm font-medium text-gray-900 mb-2">
            Tone of voice *
          </label>
          <select
            id="toneOfVoice"
            name="toneOfVoice"
            value={formData.toneOfVoice}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
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
          <label htmlFor="language" className="block text-sm font-medium text-gray-900 mb-2">
            Taal *
          </label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-fish-blue focus:border-fish-blue transition-all outline-none"
          >
            <option value="">Selecteer taal...</option>
            <option value="nl">Nederlands</option>
            <option value="fr">Frans</option>
            <option value="en">Engels</option>
            <option value="de">Duits</option>
            <option value="es">Spaans</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="wordCount" className="block text-sm font-medium text-gray-900 mb-2">
          Aantal woorden: {formData.wordCount.toLocaleString()}
        </label>
        <input
          type="range"
          id="wordCount"
          name="wordCount"
          value={formData.wordCount}
          onChange={handleChange}
          min="100"
          max="15000"
          step="100"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-fish-blue"
        />
        <div className="flex justify-between text-xs text-fish-gray mt-1">
          <span>100</span>
          <span>15.000</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Content doel *
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, contentGoal: 'problem-aware' }))}
            className={`relative p-3 rounded-lg border-2 transition-all duration-200 text-center ${
              formData.contentGoal === 'problem-aware'
                ? 'border-fish-blue bg-blue-50 ring-2 ring-fish-blue ring-offset-2'
                : 'border-gray-300 hover:border-fish-blue hover:bg-gray-50'
            }`}
          >
            <AlertCircle className={`w-6 h-6 mb-2 mx-auto ${
              formData.contentGoal === 'problem-aware' ? 'text-fish-blue' : 'text-gray-600'
            }`} />
            <h3 className="font-semibold text-gray-900 text-xs mb-1">Problem Aware</h3>
            <p className="text-xs text-fish-gray leading-tight">
              Bewust maken van probleem
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, contentGoal: 'solution-aware' }))}
            className={`relative p-3 rounded-lg border-2 transition-all duration-200 text-center ${
              formData.contentGoal === 'solution-aware'
                ? 'border-fish-blue bg-blue-50 ring-2 ring-fish-blue ring-offset-2'
                : 'border-gray-300 hover:border-fish-blue hover:bg-gray-50'
            }`}
          >
            <Compass className={`w-6 h-6 mb-2 mx-auto ${
              formData.contentGoal === 'solution-aware' ? 'text-fish-blue' : 'text-gray-600'
            }`} />
            <h3 className="font-semibold text-gray-900 text-xs mb-1">Solution Aware</h3>
            <p className="text-xs text-fish-gray leading-tight">
              Tonen van oplossingen
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, contentGoal: 'product-aware' }))}
            className={`relative p-3 rounded-lg border-2 transition-all duration-200 text-center ${
              formData.contentGoal === 'product-aware'
                ? 'border-fish-blue bg-blue-50 ring-2 ring-fish-blue ring-offset-2'
                : 'border-gray-300 hover:border-fish-blue hover:bg-gray-50'
            }`}
          >
            <ShoppingBag className={`w-6 h-6 mb-2 mx-auto ${
              formData.contentGoal === 'product-aware' ? 'text-fish-blue' : 'text-gray-600'
            }`} />
            <h3 className="font-semibold text-gray-900 text-xs mb-1">Product Aware</h3>
            <p className="text-xs text-fish-gray leading-tight">
              Overtuigen van product
            </p>
          </button>
        </div>
      </div>


      {!isGenerating && (
        <button
          type="submit"
          className="w-full bg-fish-blue hover:bg-fish-blue-dark text-white font-semibold py-3 px-6 rounded transition-all duration-200 flex items-center justify-center gap-2"
        >
          Genereer preview
          <ArrowRight className="w-5 h-5" />
        </button>
      )}

      {isGenerating && (
        <div className="flex items-center justify-center py-3 text-fish-blue">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="font-semibold">Preview genereren...</span>
        </div>
      )}
    </form>
  );
}
