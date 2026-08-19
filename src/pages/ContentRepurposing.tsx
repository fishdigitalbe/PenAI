import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Recycle, Copy, Download, Sparkles, FileText, MessageSquare, Mail, Linkedin, Facebook, Instagram, Youtube, Check, Link, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

interface RepurposedContent {
  format: string;
  content: string;
}

export default function ContentRepurposing() {
  const { user } = useAuth();
  const [sourceContent, setSourceContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [sourceType, setSourceType] = useState('blog');
  const [targetFormats, setTargetFormats] = useState<string[]>(['linkedin']);
  const [tone, setTone] = useState('professional');
  const [repurposedContent, setRepurposedContent] = useState<RepurposedContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sourceTypes = [
    { id: 'blog', label: 'Blog Post', icon: FileText },
    { id: 'article', label: 'Artikel', icon: FileText },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'social', label: 'Social Media Post', icon: MessageSquare },
    { id: 'video', label: 'Video Script', icon: Youtube },
    { id: 'presentation', label: 'Presentatie', icon: FileText },
  ];

  const formats = [
    { id: 'linkedin', label: 'LinkedIn Post', icon: Linkedin, color: 'blue' },
    { id: 'facebook', label: 'Facebook Post', icon: Facebook, color: 'blue' },
    { id: 'instagram', label: 'Instagram Caption', icon: Instagram, color: 'pink' },
    { id: 'twitter', label: 'Twitter Thread', icon: MessageSquare, color: 'sky' },
    { id: 'email', label: 'Email Newsletter', icon: Mail, color: 'gray' },
    { id: 'blog', label: 'Blog Post', icon: FileText, color: 'green' },
    { id: 'summary', label: 'Samenvatting', icon: FileText, color: 'purple' },
    { id: 'infographic', label: 'Infographic Script', icon: Sparkles, color: 'orange' },
  ];

  const tones = [
    { id: 'professional', label: 'Professioneel' },
    { id: 'casual', label: 'Casual' },
    { id: 'friendly', label: 'Vriendelijk' },
    { id: 'authoritative', label: 'Gezaghebbend' },
    { id: 'inspirational', label: 'Inspirerend' },
    { id: 'educational', label: 'Educatief' },
  ];

  const toggleFormat = (formatId: string) => {
    setTargetFormats(prev =>
      prev.includes(formatId)
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  const fetchUrlContent = async () => {
    if (!sourceUrl.trim()) return;

    setIsFetchingUrl(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/repurpose-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            fetchUrl: sourceUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch URL content');
      }

      const data = await response.json();
      setSourceContent(data.content);
      setInputMode('text');
    } catch (error) {
      console.error('Error fetching URL:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch URL content');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleGenerate = async () => {
    const content = inputMode === 'text' ? sourceContent : '';

    if (!content.trim() || targetFormats.length === 0) return;

    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/repurpose-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            sourceContent: content,
            sourceType,
            targetFormats,
            tone,
            userId: user?.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to repurpose content');
      }

      const data = await response.json();
      setRepurposedContent(data.repurposedContent);
    } catch (error) {
      console.error('Error repurposing content:', error);
      setError(error instanceof Error ? error.message : 'Failed to repurpose content');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadAsText = (content: string, format: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${format}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFormatDetails = (formatId: string) => {
    return formats.find(f => f.id === formatId) || formats[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-6">
            <Recycle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Content Repurposing Tool
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transformeer je bestaande content naar verschillende formats en bereik meer mensen
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Fout opgetreden</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Bron Content</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Input Methode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    inputMode === 'text'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  Tekst
                </button>
                <button
                  onClick={() => setInputMode('url')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    inputMode === 'url'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Link className="w-5 h-5" />
                  URL
                </button>
              </div>
            </div>

            {inputMode === 'url' ? (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Content URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://example.com/artikel"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={fetchUrlContent}
                    disabled={!sourceUrl.trim() || isFetchingUrl}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isFetchingUrl ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Laden...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Ophalen
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Voer een URL in om automatisch de content op te halen
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Content Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {sourceTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSourceType(type.id)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                            sourceType === type.id
                              ? 'bg-green-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Originele Content
                  </label>
                  <textarea
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                    placeholder="Plak hier je content..."
                    rows={12}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors resize-none"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {sourceContent.length} karakters
                  </p>
                </div>
              </>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tone of Voice
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
              >
                {tones.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Doel Formats</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Selecteer formats (meerdere mogelijk)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {formats.map(format => {
                  const Icon = format.icon;
                  const isSelected = targetFormats.includes(format.id);
                  return (
                    <button
                      key={format.id}
                      onClick={() => toggleFormat(format.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all border-2 ${
                        isSelected
                          ? `bg-${format.color}-50 border-${format.color}-500 text-${format.color}-700`
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{format.label}</span>
                      {isSelected && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!sourceContent.trim() || targetFormats.length === 0 || isGenerating}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Content genereren...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Repurpose Content
                </>
              )}
            </button>

            {targetFormats.length === 0 && (
              <p className="mt-4 text-sm text-gray-500 text-center">
                Selecteer minimaal één format om te genereren
              </p>
            )}
          </div>
        </div>

        {repurposedContent.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Gegenereerde Content</h2>

            {repurposedContent.map((item, index) => {
              const formatDetails = getFormatDetails(item.format);
              const Icon = formatDetails.icon;
              const isCopied = copiedIndex === index;

              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${formatDetails.color}-100`}>
                        <Icon className={`w-6 h-6 text-${formatDetails.color}-600`} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {formatDetails.label}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(item.content, index)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          isCopied
                            ? 'bg-green-50 text-green-700 border-2 border-green-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Gekopieerd!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Kopieer
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => downloadAsText(item.content, item.format)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                      {item.content}
                    </pre>
                  </div>

                  <div className="mt-4 text-sm text-gray-500">
                    {item.content.length} karakters
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!repurposedContent.length && !isGenerating && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <Recycle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Klaar om te beginnen?
            </h3>
            <p className="text-gray-600">
              Voer je content in en selecteer de formats waarin je het wilt omzetten
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
