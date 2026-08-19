import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface Step2Props {
  preview: {
    title: string;
    preview: string;
    wordCount: number;
    image?: {
      url: string;
      photographer: string;
      photographerUrl: string;
    } | null;
  } | null;
  isLoading: boolean;
  onBack: () => void;
  onNext: () => void;
}

export default function Step2Preview({ preview, isLoading, onBack, onNext }: Step2Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-fish-blue animate-spin mb-4" />
        <p className="text-fish-gray text-lg">Preview genereren...</p>
        <p className="text-fish-gray text-sm mt-2">Dit kan enkele seconden duren</p>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-fish-blue rounded p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{preview.title}</h3>
        {preview.image && (
          <div className="mb-6">
            <img
              src={preview.image.url}
              alt={preview.title}
              className="w-full h-auto rounded-lg shadow-md"
            />
            <p className="text-xs text-fish-gray mt-2 italic">
              Foto door{' '}
              <a
                href={preview.image.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fish-blue hover:underline"
              >
                {preview.image.photographer}
              </a>{' '}
              via Pexels
            </p>
          </div>
        )}
        <div className="prose prose-sm max-w-none text-fish-gray whitespace-pre-wrap">
          {preview.preview}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-sm text-fish-gray">
            Preview: {preview.wordCount} woorden
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-fish-blue rounded p-4">
        <p className="text-sm text-fish-gray">
          <strong className="text-fish-blue-dark">Let op:</strong> Dit is een preview van uw ebook.
          De volledige versie bevat meer hoofdstukken, diepgaande content en zal voldoen aan het
          door u opgegeven aantal woorden.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-4 px-6 rounded transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Terug
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 bg-fish-blue hover:bg-fish-blue-dark text-white font-semibold py-4 px-6 rounded transition-all duration-200 flex items-center justify-center gap-2"
        >
          Preview akkoord, naar betaling
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
