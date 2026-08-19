import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { FileText, Download, Calendar, Package, Image, Share2, PlusCircle, Trash2, BookOpen, FileIcon, RefreshCw, Store, Mail, Copy, CheckCircle2, BarChart3, Search, Filter, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { exportAsHTML } from '../utils/htmlExporter';
import { searchPexelsPhotos, PexelsPhoto } from '../utils/pexelsApi';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

interface Order {
  id: string;
  status: string;
  payment_status: string;
  amount: number;
  currency: string;
  created_at: string;
  completed_at: string | null;
  generation_params: {
    subject: string;
    targetAudience: string;
    wordCount: number;
    toneOfVoice: string;
    includeVisuals: boolean;
    createSocialAssets: boolean;
    contentType?: 'ebook' | 'blog';
  };
  generated_content: {
    title: string;
    wordCount: number;
    chapters: Array<{
      title: string;
      content: string;
      image?: {
        url: string;
        photographer: string;
        photographerUrl: string;
      };
      pexelsImage?: {
        url: string;
        photographer: string;
        photographerUrl: string;
      };
      uploadedImage?: {
        url: string;
      };
    }>;
    seo?: {
      metaTitle: string;
      metaDescription: string;
      h1: string;
      keywords: string[];
      ogTitle: string;
      ogDescription: string;
      internalLinks: string[];
      geoKeywords: string[];
      structuredData?: any;
    };
    structuredData?: any;
  } | null;
  assets_urls: {
    visuals: string[];
    socialAssets: Array<{
      platform: string;
      copy: string;
    }>;
  } | null;
  pdf_url: string | null;
}

export default function Portal() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [generatingImages, setGeneratingImages] = useState<string | null>(null);
  const [publishingToShopify, setPublishingToShopify] = useState<string | null>(null);
  const [selectedImageOrderId, setSelectedImageOrderId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailOrderId, setEmailOrderId] = useState<string | null>(null);
  const [numberOfEmails, setNumberOfEmails] = useState<number>(3);
  const [generatingEmails, setGeneratingEmails] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState<Array<{
    subject: string;
    body: string;
    purpose: string;
    sendTiming: string;
  }> | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedEmailHistory, setSavedEmailHistory] = useState<Array<{
    id: string;
    order_id: string;
    emails: Array<{
      subject: string;
      body: string;
      purpose: string;
      sendTiming: string;
    }>;
    created_at: string;
  }>>([]);
  const [showInfographicModal, setShowInfographicModal] = useState(false);
  const [infographicOrderId, setInfographicOrderId] = useState<string | null>(null);
  const [infographicStyle, setInfographicStyle] = useState<'modern' | 'minimal' | 'colorful' | 'professional'>('modern');
  const [generatingInfographic, setGeneratingInfographic] = useState(false);
  const [generatedInfographic, setGeneratedInfographic] = useState<string | null>(null);
  const [filterContentType, setFilterContentType] = useState<'all' | 'ebook' | 'blog'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingImage, setDeletingImage] = useState<{ orderId: string; chapterIndex: number } | null>(null);
  const [uploadingImage, setUploadingImage] = useState<{ orderId: string; chapterIndex: number } | null>(null);
  const [showPexelsModal, setShowPexelsModal] = useState(false);
  const [pexelsSearchQuery, setPexelsSearchQuery] = useState('');
  const [pexelsResults, setPexelsResults] = useState<PexelsPhoto[]>([]);
  const [searchingPexels, setSearchingPexels] = useState(false);
  const [pexelsOrderId, setPexelsOrderId] = useState<string | null>(null);
  const [pexelsChapterIndex, setPexelsChapterIndex] = useState<number | null>(null);
  const [addingPexelsImage, setAddingPexelsImage] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Handle OAuth callback
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('Processing OAuth callback...');
        // Clean up the URL
        window.history.replaceState(null, '', window.location.pathname);
        // Wait for auth context to process the session
        await new Promise(resolve => setTimeout(resolve, 1000));
        // The auth context will automatically update the user state
        // Don't reload, just let the effect run again when user is set
        return;
      }

      // Don't redirect if auth is still loading
      if (authLoading) {
        return;
      }

      // Normal flow - redirect to login if no user
      if (!user) {
        navigate('/login');
        return;
      }

      loadOrders();
    };

    init();
  }, [user, authLoading, navigate]);

  const loadOrders = async () => {
    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!customerData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      const locationState = location.state as { selectedOrderId?: string };
      if (locationState?.selectedOrderId && data) {
        const orderToSelect = data.find(o => o.id === locationState.selectedOrderId);
        if (orderToSelect) {
          setSelectedOrder(orderToSelect);
          window.history.replaceState({}, document.title);
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Weet u zeker dat u deze bestelling wilt verwijderen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.filter(order => order.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Er ging iets mis bij het verwijderen van de bestelling.');
    }
  };

  const retryOrder = async (orderId: string) => {
    console.log('=== RETRY ORDER DEBUG ===');
    console.log('Order ID:', orderId);
    console.log('Order ID type:', typeof orderId);
    console.log('Order ID length:', orderId?.length);

    if (!confirm('Weet u zeker dat u deze bestelling opnieuw wilt starten?')) {
      return;
    }

    try {
      setOrders(orders.map(o =>
        o.id === orderId
          ? { ...o, status: 'processing' }
          : o
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/retry-order`;

      console.log('Request URL:', url);
      console.log('Request body:', JSON.stringify({ orderId }));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to retry order');
      }

      alert('Bestelling wordt opnieuw verwerkt. U ontvangt een e-mail wanneer deze voltooid is.');

      setTimeout(() => loadOrders(), 2000);
    } catch (error) {
      console.error('Error retrying order:', error);

      setOrders(orders.map(o =>
        o.id === orderId ? { ...o, status: 'failed' } : o
      ));

      alert('Er ging iets mis bij het opnieuw starten van de bestelling.');
    }
  };

  const startImageGeneration = (orderId: string) => {
    setSelectedImageOrderId(orderId);
    generateImages(orderId);
  };

  const uploadChapterImage = async (orderId: string, chapterIndex: number, file: File) => {
    try {
      setUploadingImage({ orderId, chapterIndex });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}/${chapterIndex}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ebook-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('ebook-assets')
        .getPublicUrl(fileName);

      const supabaseUrl = SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/upload-chapter-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          chapterIndex,
          imageUrl: publicUrl
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorObj;
        try {
          errorObj = JSON.parse(errorText);
        } catch {
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(errorObj.error || 'Failed to upload image');
      }

      await loadOrders();

      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }

      alert('Afbeelding succesvol geüpload!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Er ging iets mis bij het uploaden van de afbeelding.');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleImageUpload = (orderId: string, chapterIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadChapterImage(orderId, chapterIndex, file);
      }
    };
    input.click();
  };

  const openPexelsSearch = (orderId: string, chapterIndex: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.generated_content) {
      const chapter = order.generated_content.chapters[chapterIndex];
      setPexelsSearchQuery(chapter.title);
    }
    setPexelsOrderId(orderId);
    setPexelsChapterIndex(chapterIndex);
    setPexelsResults([]);
    setShowPexelsModal(true);
  };

  const handlePexelsSearch = async () => {
    if (!pexelsSearchQuery.trim()) return;

    setSearchingPexels(true);
    try {
      const results = await searchPexelsPhotos(pexelsSearchQuery, 15);
      setPexelsResults(results);
    } catch (error) {
      console.error('Error searching Pexels:', error);
      alert('Er ging iets mis bij het zoeken naar foto\'s.');
    } finally {
      setSearchingPexels(false);
    }
  };

  const addPexelsImageToChapter = async (photo: PexelsPhoto) => {
    if (!pexelsOrderId || pexelsChapterIndex === null) return;

    setAddingPexelsImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Sessie verlopen. Log opnieuw in.');
        return;
      }

      const order = orders.find(o => o.id === pexelsOrderId);
      if (!order || !order.generated_content) return;

      const updatedChapters = [...order.generated_content.chapters];
      updatedChapters[pexelsChapterIndex] = {
        ...updatedChapters[pexelsChapterIndex],
        pexelsImage: {
          url: photo.src.large,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
        },
      };

      const { error } = await supabase
        .from('orders')
        .update({
          generated_content: {
            ...order.generated_content,
            chapters: updatedChapters,
          },
        })
        .eq('id', pexelsOrderId);

      if (error) throw error;

      setOrders(orders.map(o =>
        o.id === pexelsOrderId
          ? {
              ...o,
              generated_content: {
                ...o.generated_content!,
                chapters: updatedChapters,
              },
            }
          : o
      ));

      setShowPexelsModal(false);
      setPexelsResults([]);
      setPexelsSearchQuery('');
      alert('Pexels foto succesvol toegevoegd!');
    } catch (error) {
      console.error('Error adding Pexels image:', error);
      alert('Er ging iets mis bij het toevoegen van de foto.');
    } finally {
      setAddingPexelsImage(false);
    }
  };

  const deleteChapterImage = async (orderId: string, chapterIndex: number, imageType: 'ai' | 'pexels' | 'uploaded' = 'ai') => {
    if (!confirm('Weet u zeker dat u deze afbeelding wilt verwijderen?')) {
      return;
    }

    try {
      setDeletingImage({ orderId, chapterIndex });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/delete-chapter-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          chapterIndex,
          imageType
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorObj;
        try {
          errorObj = JSON.parse(errorText);
        } catch {
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(errorObj.error || 'Failed to delete image');
      }

      await loadOrders();

      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }

      alert('Afbeelding succesvol verwijderd. U kunt nu een nieuwe genereren.');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Er ging iets mis bij het verwijderen van de afbeelding.');
    } finally {
      setDeletingImage(null);
    }
  };

  const generateImages = async (orderId: string) => {
    console.log('=== generateImages CALLED ===');
    console.log('orderId:', orderId);

    if (!orderId) {
      console.log('No orderId, returning early');
      return;
    }

    try {
      console.log('Setting generating state...');
      setGeneratingImages(orderId);

      console.log('Getting session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      console.log('Session OK, access_token:', session.access_token.substring(0, 20) + '...');

      const supabaseUrl = SUPABASE_URL;
      console.log('Supabase URL:', supabaseUrl);

      console.log('Making fetch request...');
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-chapter-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Response data:', responseData);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('Image generation error response:', responseText);
        console.error('Full response status:', response.status, response.statusText);
        throw new Error(responseData.error || `Server error: ${response.status}`);
      }

      console.log('Pexels image search started successfully!');

      alert(`Pexels afbeeldingen worden gezocht! (${responseData.chaptersToProcess || responseData.totalChapters} hoofdstukken)\n\nDe afbeeldingen worden automatisch toegevoegd zodra ze gevonden zijn.`);

      // Poll database to check progress
      let checksRemaining = 30; // Check for 5 minutes (30 checks * 10 seconds)
      const checkProgress = async () => {
        console.log(`Checking image generation progress... (${checksRemaining} checks remaining)`);

        try {
          const { data: order, error } = await supabase
            .from('orders')
            .select('generated_content')
            .eq('id', orderId)
            .maybeSingle();

          if (error) {
            console.error('Error checking progress:', error);
            checksRemaining--;
            return checksRemaining <= 0;
          }

          if (order?.generated_content?.chapters) {
            const chapters = order.generated_content.chapters;
            const imagesCount = chapters.filter((ch: any) => ch.image || ch.pexelsImage).length;
            console.log(`Progress: ${imagesCount}/${chapters.length} chapters have images`);

            // Refresh the orders list to show updated images
            await loadOrders();

            if (imagesCount === chapters.length) {
              console.log('All images generated!');
              alert('Alle afbeeldingen zijn succesvol gegenereerd!');
              return true; // Stop polling
            }
          }

          checksRemaining--;
          return checksRemaining <= 0; // Stop after max checks
        } catch (error) {
          console.error('Error in checkProgress:', error);
          checksRemaining--;
          return checksRemaining <= 0;
        }
      };

      // Check immediately, then every 10 seconds
      const pollInterval = setInterval(async () => {
        const shouldStop = await checkProgress();
        if (shouldStop) {
          clearInterval(pollInterval);
          setGeneratingImages(null);
        }
      }, 10000);

      // Initial check after 5 seconds
      setTimeout(() => checkProgress(), 5000);
    } catch (error) {
      console.error('!!! Error generating images:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Er ging iets mis bij het genereren van de afbeeldingen:\n\n${errorMessage}\n\nControleer de browser console voor meer details.`);
    } finally {
      console.log('=== generateImages FINISHED ===');
      setGeneratingImages(null);
    }
  };

  const publishToShopify = async (orderId: string) => {
    if (!confirm('Weet u zeker dat u deze blog naar Shopify wilt publiceren?')) {
      return;
    }

    try {
      setPublishingToShopify(orderId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/publish-to-shopify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish to Shopify');
      }

      const result = await response.json();
      alert(`Blog succesvol gepubliceerd naar Shopify!\n\nBlog URL: ${result.shopUrl}`);

      await loadOrders();
    } catch (error: any) {
      console.error('Error publishing to Shopify:', error);

      if (error.message.includes('No active Shopify store')) {
        if (confirm('U heeft nog geen Shopify store verbonden. Wilt u er nu een toevoegen?')) {
          navigate('/shopify');
        }
      } else {
        alert(`Er ging iets mis bij het publiceren naar Shopify:\n${error.message}`);
      }
    } finally {
      setPublishingToShopify(null);
    }
  };

  const openEmailGenerator = async (orderId: string) => {
    setEmailOrderId(orderId);
    setShowEmailModal(true);
    setGeneratedEmails(null);
    setNumberOfEmails(3);

    await loadEmailHistory(orderId);
  };

  const loadEmailHistory = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('promotional_emails')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedEmailHistory(data || []);
    } catch (error) {
      console.error('Error loading email history:', error);
    }
  };

  const generatePromotionalEmails = async () => {
    if (!emailOrderId) return;

    try {
      setGeneratingEmails(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-promotional-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: emailOrderId,
          numberOfEmails
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate emails');
      }

      const result = await response.json();
      setGeneratedEmails(result.emails);

      if (emailOrderId) {
        await loadEmailHistory(emailOrderId);
      }
    } catch (error: any) {
      console.error('Error generating emails:', error);
      alert(`Er ging iets mis bij het genereren van emails:\n${error.message}`);
    } finally {
      setGeneratingEmails(false);
    }
  };

  const copyEmailToClipboard = async (email: any, index: number) => {
    const fullEmail = `Onderwerp: ${email.subject}\n\n${email.body}`;
    try {
      await navigator.clipboard.writeText(fullEmail);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Kopiëren mislukt. Probeer het opnieuw.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const openInfographicGenerator = (orderId: string) => {
    setInfographicOrderId(orderId);
    setShowInfographicModal(true);
    setInfographicStyle('modern');
    setGeneratedInfographic(null);
  };

  const generateInfographic = async () => {
    if (!infographicOrderId) return;

    try {
      setGeneratingInfographic(true);

      const order = orders.find(o => o.id === infographicOrderId);
      if (!order || !order.generated_content) {
        throw new Error('Order content not found');
      }

      const fullContent = order.generated_content.chapters
        .map(ch => `${ch.title}\n\n${ch.content}`)
        .join('\n\n');

      const supabaseUrl = SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-infographic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: infographicOrderId,
          content: fullContent,
          subject: order.generation_params.subject,
          style: infographicStyle
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate infographic');
      }

      const result = await response.json();
      setGeneratedInfographic(result.infographicUrl);
    } catch (error) {
      console.error('Error generating infographic:', error);
      alert('Er ging iets mis bij het genereren van de infographic.');
    } finally {
      setGeneratingInfographic(false);
    }
  };

  const downloadInfographic = () => {
    if (!generatedInfographic) return;

    const link = document.createElement('a');
    link.href = generatedInfographic;
    link.download = `infographic-${infographicOrderId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const checkAllChaptersHaveImages = (order: Order): boolean => {
    if (!order.generated_content?.chapters) return false;

    const chaptersWithoutImages = order.generated_content.chapters.filter(
      chapter => !chapter.image && !chapter.pexelsImage && !chapter.uploadedImage
    );

    return chaptersWithoutImages.length === 0;
  };

  const downloadAsHTML = async (order: Order) => {
    if (!order.generated_content) return;

    // Check if all chapters have at least one image
    if (!checkAllChaptersHaveImages(order)) {
      const chaptersWithoutImages = order.generated_content.chapters.filter(
        chapter => !chapter.image && !chapter.pexelsImage && !chapter.uploadedImage
      );

      alert(
        `⚠️ Niet alle hoofdstukken hebben afbeeldingen!\n\n` +
        `${chaptersWithoutImages.length} hoofdstuk${chaptersWithoutImages.length > 1 ? 'ken' : ''} ${chaptersWithoutImages.length > 1 ? 'hebben' : 'heeft'} nog geen afbeeldingen.\n\n` +
        `U moet eerst:\n` +
        `• Afbeeldingen genereren via de "Genereer Afbeeldingen" knop, OF\n` +
        `• Eigen afbeeldingen uploaden via de "Upload eigen afbeelding" knop per hoofdstuk\n\n` +
        `Download wordt geannuleerd.`
      );
      return;
    }

    const isBlog = order.generation_params.contentType === 'blog';

    // Use old format for blogs, new format for ebooks
    if (isBlog) {
      const seo = order.generated_content.seo;
      const structuredData = order.generated_content.structuredData || seo?.structuredData;

      const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seo?.metaTitle || order.generated_content.title}</title>
  ${seo ? `
  <meta name="description" content="${seo.metaDescription}">
  <meta name="keywords" content="${seo.keywords.join(', ')}">

  <!-- Open Graph / Social Media -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${seo.ogTitle}">
  <meta property="og:description" content="${seo.ogDescription}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seo.ogTitle}">
  <meta name="twitter:description" content="${seo.ogDescription}">
  ${structuredData ? `

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
  ${JSON.stringify(structuredData, null, 2)}
  </script>
  ` : ''}
  ` : ''}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1 {
      color: #0EA5E9;
      border-bottom: 3px solid #0EA5E9;
      padding-bottom: 10px;
    }
    h2 {
      color: #0284C7;
      margin-top: 40px;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 20px 0;
    }
    .chapter {
      margin-bottom: 40px;
    }
    .image-credit {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }
  </style>
</head>
<body>
  <h1>${seo?.h1 || order.generated_content.title}</h1>
  ${seo && seo.keywords.length > 0 ? `
  <div style="margin-bottom: 20px; padding: 12px; background: #f0f9ff; border-radius: 8px; font-size: 14px;">
    <strong style="color: #0284C7;">🏷️ Trefwoorden:</strong> ${seo.keywords.join(', ')}
  </div>
  ` : ''}
  ${order.generated_content.chapters.map(chapter => `
    <div class="chapter">
      <h2>${chapter.title}</h2>
      ${chapter.image ? `
        <img src="${chapter.image.url}" alt="${chapter.title}" />
        <p class="image-credit">${chapter.image.photographer}</p>
      ` : ''}
      ${chapter.pexelsImage ? `
        <img src="${chapter.pexelsImage.url}" alt="${chapter.title}" />
        <p class="image-credit">Foto door ${chapter.pexelsImage.photographer}</p>
      ` : ''}
      <div>${chapter.content.replace(/\n/g, '<br>')}</div>
    </div>
  `).join('')}
</body>
</html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.generation_params.subject.replace(/[^a-z0-9]/gi, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Use new book format for ebooks
      try {
        await exportAsHTML({
          title: order.generated_content.title,
          chapters: order.generated_content.chapters,
          wordCount: order.generated_content.wordCount,
          generatedAt: order.created_at,
          metadata: {
            description: order.generated_content.seo?.metaDescription,
            keywords: order.generated_content.seo?.keywords,
            author: 'PenAI',
            organization: 'Fish Digital',
            jsonLd: order.generated_content.structuredData ? JSON.stringify(order.generated_content.structuredData) : undefined
          }
        }, order.generated_content.seo);
      } catch (error) {
        console.error('Error exporting HTML:', error);
        alert('Er ging iets mis bij het exporteren van de HTML.');
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const contentTypeMatch = filterContentType === 'all' ||
      (filterContentType === 'ebook' && order.generation_params.contentType !== 'blog') ||
      (filterContentType === 'blog' && order.generation_params.contentType === 'blog');

    const statusMatch = filterStatus === 'all' || order.status === filterStatus;

    const searchMatch = searchQuery === '' ||
      order.generation_params.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.generation_params.targetAudience.toLowerCase().includes(searchQuery.toLowerCase());

    return contentTypeMatch && statusMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Laden...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Mijn Klantenzone</h1>
              <p className="text-sm md:text-base text-gray-600">Bekijk al uw gegenereerde ebooks, blogs en social media content</p>
            </div>
            {orders.length > 0 && (
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium w-full md:w-auto"
              >
                <PlusCircle className="h-5 w-5" />
                <span>Nieuwe bestelling</span>
              </button>
            )}
          </div>

          {orders.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-gray-500" />
                <h2 className="text-base md:text-lg font-semibold text-gray-900">Filters</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Zoeken
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Onderwerp of doelgroep..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-2">
                      Type content
                    </label>
                    <select
                      id="contentType"
                      value={filterContentType}
                      onChange={(e) => setFilterContentType(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                    >
                      <option value="all">Alle types</option>
                      <option value="ebook">Ebooks</option>
                      <option value="blog">Blogs</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                    >
                      <option value="all">Alle statussen</option>
                      <option value="completed">Voltooid</option>
                      <option value="processing">Bezig</option>
                      <option value="failed">Mislukt</option>
                    </select>
                  </div>
                </div>
              </div>

              {(filterContentType !== 'all' || filterStatus !== 'all' || searchQuery !== '') && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <p className="text-gray-600">
                    {filteredOrders.length} van {orders.length} bestellingen
                  </p>
                  <button
                    onClick={() => {
                      setFilterContentType('all');
                      setFilterStatus('all');
                      setSearchQuery('');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
            <Package className="mx-auto h-12 md:h-16 w-12 md:w-16 text-gray-400 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Nog geen bestellingen</h3>
            <p className="text-sm md:text-base text-gray-600 mb-6">Start met het maken van uw eerste ebook</p>
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Maak een ebook
            </a>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
            <Package className="mx-auto h-12 md:h-16 w-12 md:w-16 text-gray-400 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Geen resultaten gevonden</h3>
            <p className="text-sm md:text-base text-gray-600 mb-6">Pas uw filters aan om meer bestellingen te zien</p>
            <button
              onClick={() => {
                setFilterContentType('all');
                setFilterStatus('all');
                setSearchQuery('');
              }}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 break-words">
                      {order.generation_params.subject}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
                        {order.status === 'completed' ? 'Voltooid' :
                         order.status === 'processing' ? 'Bezig...' :
                         order.status === 'failed' ? 'Mislukt' :
                         'In behandeling'}
                      </span>
                      {order.payment_status === 'free' && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          Gratis
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800 flex items-center gap-1">
                        {order.generation_params.contentType === 'blog' ? (
                          <>
                            <FileIcon className="h-3 w-3" />
                            Blog
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-3 w-3" />
                            Ebook
                          </>
                        )}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-gray-100 text-gray-800">
                        {order.generation_params.wordCount.toLocaleString()} woorden
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleDateString('nl-BE')}
                      </span>
                      {order.generated_content && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Gegenereerd: {order.generated_content.wordCount.toLocaleString()} woorden
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    {order.status === 'completed' && order.generated_content && (
                      <>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadAsHTML(order);
                            }}
                            className={`flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors flex-1 font-medium text-xs md:text-sm ${
                              checkAllChaptersHaveImages(order)
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                            title={!checkAllChaptersHaveImages(order) ? 'Niet alle hoofdstukken hebben afbeeldingen' : ''}
                          >
                            <Download className="h-3.5 md:h-4 w-3.5 md:w-4 flex-shrink-0" />
                            {order.generation_params.contentType === 'blog' ? (
                              <>
                                <span className="hidden md:inline">Download HTML</span>
                                <span className="md:hidden">HTML</span>
                              </>
                            ) : (
                              <>
                                <span className="hidden md:inline">
                                  {checkAllChaptersHaveImages(order) ? 'Download Ebook' : 'Download Ebook ⚠️'}
                                </span>
                                <span className="md:hidden">Ebook</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                            className="flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-xs md:text-sm"
                          >
                            {selectedOrder?.id === order.id ? 'Verberg' : 'Bekijk'}
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEmailGenerator(order.id);
                            }}
                            className="flex items-center justify-center gap-1 px-1.5 md:px-2 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs md:text-sm font-medium"
                          >
                            <Mail className="h-3.5 md:h-4 w-3.5 md:w-4 flex-shrink-0" />
                            <span className="hidden md:inline">Emails</span>
                            <span className="md:hidden">Mail</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startImageGeneration(order.id);
                            }}
                            disabled={generatingImages === order.id}
                            className="flex items-center justify-center gap-1 px-1.5 md:px-2 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs md:text-sm font-medium"
                          >
                            <Image className="h-3.5 md:h-4 w-3.5 md:w-4 flex-shrink-0" />
                            <span className="hidden md:inline">{generatingImages === order.id ? 'Zoeken...' : 'Afbeeldingen'}</span>
                            <span className="md:hidden">Img</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              publishToShopify(order.id);
                            }}
                            disabled={publishingToShopify === order.id}
                            className="flex items-center justify-center gap-1 px-1.5 md:px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs md:text-sm font-medium"
                          >
                            <Store className="h-3.5 md:h-4 w-3.5 md:w-4 flex-shrink-0" />
                            <span className="hidden md:inline">{publishingToShopify === order.id ? 'Publiceren...' : 'Shopify'}</span>
                            <span className="md:hidden">Shop</span>
                          </button>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      {order.status === 'failed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            retryOrder(order.id);
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-1.5 md:py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors flex-1 font-medium text-xs md:text-sm"
                          title="Opnieuw proberen"
                        >
                          <RefreshCw className="h-4 w-4 flex-shrink-0" />
                          <span>Opnieuw Proberen</span>
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          disabled
                          className="flex items-center justify-center gap-2 px-3 py-1.5 md:py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed flex-1 font-medium text-xs md:text-sm"
                          title="Verwerking bezig..."
                        >
                          <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
                          <span>Verwerken...</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOrder(order.id);
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 md:py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs md:text-sm"
                        title="Verwijder bestelling"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Verwijder</span>
                      </button>
                    </div>
                  </div>
                </div>

                {selectedOrder?.id === order.id && order.generated_content && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 text-base md:text-lg">Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Doelgroep:</span>
                          <p className="font-medium">{order.generation_params.targetAudience}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Toon:</span>
                          <p className="font-medium">{order.generation_params.toneOfVoice}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Hoofdstukken:</span>
                          <p className="font-medium">{order.generated_content.chapters.length}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Woorden:</span>
                          <p className="font-medium">{order.generated_content.wordCount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {order.generated_content.seo && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-base md:text-lg">
                          <BarChart3 className="h-5 w-5 text-green-600" />
                          SEO Metadata
                        </h4>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-3">
                          <div>
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Meta Title</span>
                            <p className="text-sm text-gray-800 mt-1">{order.generated_content.seo.metaTitle}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Meta Description</span>
                            <p className="text-sm text-gray-800 mt-1">{order.generated_content.seo.metaDescription}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">H1 Heading</span>
                            <p className="text-sm text-gray-800 mt-1">{order.generated_content.seo.h1}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Keywords</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {order.generated_content.seo.keywords.map((keyword, idx) => (
                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                          {order.generated_content.seo.geoKeywords && order.generated_content.seo.geoKeywords.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">GEO Keywords</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {order.generated_content.seo.geoKeywords.slice(0, 5).map((keyword, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(order.generated_content.structuredData || order.generated_content.seo.structuredData) && (
                            <div>
                              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Structured Data (JSON-LD)</span>
                              <div className="mt-2 bg-white rounded border border-green-200 p-2 max-h-40 overflow-y-auto">
                                <pre className="text-xs text-gray-700">
                                  {JSON.stringify(order.generated_content.structuredData || order.generated_content.seo.structuredData, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {order.assets_urls?.visuals && order.assets_urls.visuals.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-base md:text-lg">
                          <Image className="h-5 w-5" />
                          Gegenereerde Visuals ({order.assets_urls.visuals.length})
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                          {order.assets_urls.visuals.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative aspect-square overflow-hidden rounded-lg"
                            >
                              <img
                                src={url}
                                alt={`Visual ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                                <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.assets_urls?.socialAssets && order.assets_urls.socialAssets.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-base md:text-lg">
                          <Share2 className="h-5 w-5" />
                          Social Media Copy ({order.assets_urls.socialAssets.length})
                        </h4>
                        <div className="space-y-4">
                          {order.assets_urls.socialAssets.map((asset, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded uppercase">
                                  {asset.platform}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(asset.copy);
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                  Kopieer
                                </button>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{asset.copy}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-base md:text-lg">
                        <FileText className="h-5 w-5" />
                        Ebook Inhoud
                      </h4>
                      <div className="space-y-4 md:space-y-6">
                        {order.generated_content.chapters.map((chapter, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4 md:p-6">
                            <h5 className="text-lg font-semibold text-blue-600 mb-3">{chapter.title}</h5>
                            {(chapter.image || chapter.pexelsImage || chapter.uploadedImage) && (
                              <div className="mb-4 space-y-4">
                                {chapter.image && (
                                  <div className="relative group">
                                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium z-10">
                                      AI Gegenereerd
                                    </div>
                                    <img
                                      src={chapter.image.url}
                                      alt={chapter.title}
                                      className="w-full rounded-lg"
                                    />
                                    <button
                                      onClick={() => deleteChapterImage(order.id, idx)}
                                      disabled={deletingImage?.orderId === order.id && deletingImage?.chapterIndex === idx}
                                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed"
                                      title="Verwijder afbeelding"
                                    >
                                      {deletingImage?.orderId === order.id && deletingImage?.chapterIndex === idx ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">
                                      {chapter.image.photographer}
                                    </p>
                                  </div>
                                )}
                                {chapter.pexelsImage && (
                                  <div className="relative group">
                                    <div className="absolute top-2 left-2 bg-teal-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs font-medium z-10">
                                      Pexels Foto
                                    </div>
                                    <img
                                      src={chapter.pexelsImage.url}
                                      alt={chapter.title}
                                      className="w-full rounded-lg"
                                    />
                                    <button
                                      onClick={() => deleteChapterImage(order.id, idx, 'pexels')}
                                      disabled={deletingImage?.orderId === order.id && deletingImage?.chapterIndex === idx}
                                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed"
                                      title="Verwijder Pexels foto"
                                    >
                                      {deletingImage?.orderId === order.id && deletingImage?.chapterIndex === idx ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">
                                      Foto door{' '}
                                      <a
                                        href={chapter.pexelsImage.photographerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-teal-600 hover:underline"
                                      >
                                        {chapter.pexelsImage.photographer}
                                      </a>
                                      {' '}op Pexels
                                    </p>
                                  </div>
                                )}
                                {chapter.uploadedImage && (
                                  <div className="relative group">
                                    <div className="absolute top-2 left-2 bg-purple-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs font-medium z-10">
                                      Eigen Upload
                                    </div>
                                    <img
                                      src={chapter.uploadedImage.url}
                                      alt={chapter.title}
                                      className="w-full rounded-lg"
                                    />
                                    <button
                                      onClick={() => deleteChapterImage(order.id, idx, 'uploaded')}
                                      disabled={deletingImage?.orderId === order.id && deletingImage?.chapterIndex === idx}
                                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed"
                                      title="Verwijder eigen afbeelding"
                                    >
                                      {deletingImage?.orderId === order.id && deletingImage?.chapterIndex === idx ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mb-4 flex gap-2">
                              <button
                                onClick={() => handleImageUpload(order.id, idx)}
                                disabled={uploadingImage?.orderId === order.id && uploadingImage?.chapterIndex === idx}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              >
                                {uploadingImage?.orderId === order.id && uploadingImage?.chapterIndex === idx ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Uploaden...</span>
                                  </>
                                ) : (
                                  <>
                                    <PlusCircle className="h-4 w-4" />
                                    <span>Upload eigen afbeelding</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => openPexelsSearch(order.id, idx)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                              >
                                <Search className="h-4 w-4" />
                                <span>Zoek Pexels foto</span>
                              </button>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{chapter.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900">Genereer Promotional Emails</h2>
              </div>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setGeneratedEmails(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {!generatedEmails ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-900 text-sm">
                      Onze AI zal een reeks nurturing emails schrijven om jouw content piece te promoten.
                      Elke email heeft een specifiek doel en wordt op het juiste moment in de customer journey ingezet.
                    </p>
                  </div>

                  {savedEmailHistory.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Eerdere Email Generaties</h3>
                      {savedEmailHistory.map((history) => (
                        <div key={history.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-600">
                              Gegenereerd op: {new Date(history.created_at).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {history.emails.length} email{history.emails.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <button
                            onClick={() => setGeneratedEmails(history.emails)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Bekijk deze emails
                          </button>
                        </div>
                      ))}
                      <div className="border-t border-gray-300 pt-4"></div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="numberOfEmails" className="block text-sm font-medium text-gray-900 mb-2">
                      Hoeveel nurturing emails wil je genereren? *
                    </label>
                    <select
                      id="numberOfEmails"
                      value={numberOfEmails}
                      onChange={(e) => setNumberOfEmails(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all outline-none"
                    >
                      <option value={1}>1 email - Enkele aankondiging</option>
                      <option value={2}>2 emails - Aankondiging + Follow-up</option>
                      <option value={3}>3 emails - Basis nurturing sequence</option>
                      <option value={4}>4 emails - Uitgebreide sequence</option>
                      <option value={5}>5 emails - Volledige nurturing campagne</option>
                      <option value={6}>6 emails - Intensieve campagne</option>
                      <option value={7}>7 emails - Maximum impact campagne</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-2">
                      Aanbevolen: 3-5 emails voor een effectieve nurturing sequence
                    </p>
                  </div>

                  <button
                    onClick={generatePromotionalEmails}
                    disabled={generatingEmails}
                    className="w-full bg-orange-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {generatingEmails ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Emails genereren...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Genereer {numberOfEmails} Email{numberOfEmails !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-900 font-semibold">
                        {generatedEmails.length} promotional emails succesvol gegenereerd!
                      </p>
                      <p className="text-green-800 text-sm mt-1">
                        Klik op de kopieer-knop om elke email naar je clipboard te kopiëren.
                      </p>
                    </div>
                  </div>

                  {generatedEmails.map((email, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full text-sm font-bold">
                              {index + 1}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900">
                              {email.subject}
                            </h3>
                          </div>
                          <div className="flex gap-3 text-sm text-gray-600 ml-11">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                              {email.sendTiming}
                            </span>
                            <span className="text-gray-500">
                              {email.purpose}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => copyEmailToClipboard(email, index)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            copiedIndex === index
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {copiedIndex === index ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Gekopieerd!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Kopieer
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 ml-11">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {email.body}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setGeneratedEmails(null)}
                      className="flex-1 px-6 py-3 border-2 border-orange-600 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all"
                    >
                      Genereer Opnieuw
                    </button>
                    <button
                      onClick={() => {
                        setShowEmailModal(false);
                        setGeneratedEmails(null);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition-all"
                    >
                      Sluiten
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPexelsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Search className="w-6 h-6 text-teal-600" />
                <h2 className="text-2xl font-bold text-gray-900">Zoek Pexels Foto</h2>
              </div>
              <button
                onClick={() => {
                  setShowPexelsModal(false);
                  setPexelsResults([]);
                  setPexelsSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pexelsSearchQuery}
                    onChange={(e) => setPexelsSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePexelsSearch()}
                    placeholder="Zoek naar foto's..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <button
                    onClick={handlePexelsSearch}
                    disabled={searchingPexels || !pexelsSearchQuery.trim()}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {searchingPexels ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Zoeken...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        <span>Zoeken</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {pexelsResults.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {pexelsResults.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => addPexelsImageToChapter(photo)}
                      disabled={addingPexelsImage}
                      className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-gray-100">
                        <img
                          src={photo.src.medium}
                          alt={`Photo by ${photo.photographer}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3">
                          <PlusCircle className="h-6 w-6 text-teal-600" />
                        </div>
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 truncate">
                          door {photo.photographer}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {pexelsResults.length === 0 && !searchingPexels && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Zoek naar foto's op Pexels</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Gratis hoogwaardige foto's zonder copyright
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showInfographicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Genereer Infographic</h2>
              <button
                onClick={() => {
                  setShowInfographicModal(false);
                  setGeneratedInfographic(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {!generatedInfographic ? (
                <>
                  <p className="text-gray-700 mb-6">
                    Kies een stijl voor uw infographic. De AI extraheert automatisch de belangrijkste punten uit uw content.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { value: 'modern', name: 'Modern', description: 'Strak minimalistisch ontwerp met boldtypografie' },
                      { value: 'minimal', name: 'Minimaal', description: 'Ultra-minimal zwart-wit design' },
                      { value: 'colorful', name: 'Kleurrijk', description: 'Levendige kleuren en speelse elementen' },
                      { value: 'professional', name: 'Professioneel', description: 'Corporate stijl met datavizualisaties' }
                    ].map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => setInfographicStyle(style.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          infographicStyle === style.value
                            ? 'border-purple-600 ring-2 ring-purple-600 ring-offset-2 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-600'
                        }`}
                      >
                        <div className="font-medium text-base text-gray-900 mb-1">{style.name}</div>
                        <div className="text-sm text-gray-600">{style.description}</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={generateInfographic}
                    disabled={generatingInfographic}
                    className="w-full bg-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {generatingInfographic ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Bezig met genereren...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Genereer Infographic
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <img
                      src={generatedInfographic}
                      alt="Generated infographic"
                      className="w-full rounded-lg shadow-lg"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={downloadInfographic}
                      className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Infographic
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedInfographic(null);
                      }}
                      className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      Genereer opnieuw
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
