import { Download, Copy, Check, FileText, FileCode } from 'lucide-react';
import { useState } from 'react';
import { GenerationResult } from '../types';
import { generatePDF } from '../utils/pdfGenerator';
import { exportAsHTML } from '../utils/htmlExporter';

interface GeneratedContentProps {
  result: GenerationResult;
  seoData?: any;
}

export default function GeneratedContent({ result, seoData }: GeneratedContentProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingHTML, setIsDownloadingHTML] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      await generatePDF(result);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadHTML = async () => {
    setIsDownloadingHTML(true);
    try {
      await exportAsHTML(result, seoData);
    } catch (error) {
      console.error('Error generating HTML:', error);
      alert('Failed to generate HTML. Please try again.');
    } finally {
      setIsDownloadingHTML(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2">{result.title}</h3>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>{result.wordCount.toLocaleString()} words</span>
          <span>•</span>
          <span>{result.chapters.length} chapters</span>
          <span>•</span>
          <span>{new Date(result.generatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={handleDownloadHTML}
          disabled={isDownloadingHTML}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {isDownloadingHTML ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileCode className="w-4 h-4" />
              Download HTML
            </>
          )}
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloadingPDF}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {isDownloadingPDF ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Download PDF
            </>
          )}
        </button>
        <button
          onClick={handleCopy}
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Text
            </>
          )}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 max-h-[600px] overflow-y-auto">
        <div className="prose prose-slate max-w-none">
          {result.chapters.map((chapter, index) => (
            <div key={index} className="mb-8">
              <h4 className="text-lg font-semibold text-slate-900 mb-3">
                {chapter.title}
              </h4>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {chapter.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
