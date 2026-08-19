import { useState, useEffect, useRef } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CreditCard as Edit2, Trash2, Eye, EyeOff, Loader2, Sparkles, Search, Image as ImageIcon, Link, Linkedin, RefreshCw } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  author_email: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_description: string | null;
  tags: string[];
  related_blog_ids: string[];
  linkedin_post_id: string | null;
  linkedin_post_url: string | null;
  linkedin_published_at: string | null;
  ai_model: string | null;
  views_count: number;
}

interface ScheduledPost {
  id: string;
  blog_id: string;
  post_text: string;
  scheduled_for: string;
  status: 'pending' | 'published' | 'failed';
  error_message: string | null;
  blogs?: Blog;
}

interface BlogForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  photographer_name: string;
  photographer_url: string;
  meta_description: string;
  tags: string;
  status: 'draft' | 'published';
  related_blog_ids: string[];
  ai_model: string;
}

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
  };
  photographer: string;
  photographer_url: string;
}

export default function BlogAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [generating, setGenerating] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedBlogForLink, setSelectedBlogForLink] = useState<string>('');
  const [formData, setFormData] = useState<BlogForm>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    photographer_name: '',
    photographer_url: '',
    meta_description: '',
    tags: '',
    status: 'draft',
    related_blog_ids: [],
    ai_model: '',
  });

  const [generateForm, setGenerateForm] = useState({
    topic: '',
    keywords: '',
    tone: 'professional',
    length: 'medium',
    model: 'claude-opus-4-5-20251101',
  });

  const [showPexelsSearch, setShowPexelsSearch] = useState(false);
  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsResults, setPexelsResults] = useState<PexelsPhoto[]>([]);
  const [searchingPexels, setSearchingPexels] = useState(false);

  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [selectedBlogForLinkedIn, setSelectedBlogForLinkedIn] = useState<Blog | null>(null);
  const [linkedInPostText, setLinkedInPostText] = useState('');
  const [generatingLinkedInPost, setGeneratingLinkedInPost] = useState(false);
  const [publishingToLinkedIn, setPublishingToLinkedIn] = useState(false);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  useEffect(() => {
    if (user?.email !== 'stein@fishdigital.be') {
      navigate('/');
      return;
    }
    fetchBlogs();
    fetchScheduledPosts();
  }, [user, navigate]);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_linkedin_posts')
        .select('*, blogs(*)')
        .in('status', ['pending', 'failed'])
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setScheduledPosts(data || []);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    }
  };

  const handleGenerateBlog = async () => {
    if (!generateForm.topic.trim()) {
      alert('Voer een onderwerp in');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-blog`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(generateForm),
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          console.error('Blog generation error (non-JSON response):', errorText);
          throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
        }
        const errorMsg = errorData.error || `Failed to generate blog (${response.status})`;
        console.error('Blog generation error:', errorData);
        console.error('Error details:', errorData.details);
        throw new Error(errorMsg);
      }

      const data = await response.json();

      setFormData({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featured_image_url: '',
        photographer_name: '',
        photographer_url: '',
        meta_description: data.metaDescription || '',
        tags: data.suggestedTags?.join(', ') || '',
        status: 'draft',
        related_blog_ids: [],
        ai_model: data.aiModel || '',
      });

      setGenerateForm({ topic: '', keywords: '', tone: 'professional', length: 'medium', model: 'claude-opus-4-5-20251101' });
      alert('Blog succesvol gegenereerd! Controleer en bewerk indien nodig.');
    } catch (error) {
      console.error('Error generating blog:', error);
      const errorMsg = error instanceof Error ? error.message : 'Fout bij het genereren van blog';
      alert(`Fout bij het genereren van blog:\n\n${errorMsg}\n\nControleer de console voor meer details.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const blogData = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt,
      content: formData.content,
      featured_image_url: formData.featured_image_url || null,
      photographer_name: formData.photographer_name || null,
      photographer_url: formData.photographer_url || null,
      author_email: user?.email || '',
      status: formData.status,
      published_at: formData.status === 'published' ? new Date().toISOString() : null,
      meta_description: formData.meta_description || null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      related_blog_ids: formData.related_blog_ids || [],
      ai_model: formData.ai_model || null,
    };

    try {
      if (editingBlog) {
        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('id', editingBlog.id);

        if (error) throw error;
        alert('Blog bijgewerkt!');
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert([blogData]);

        if (error) throw error;
        alert('Blog aangemaakt!');
      }

      setShowForm(false);
      setEditingBlog(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image_url: '',
        photographer_name: '',
        photographer_url: '',
        meta_description: '',
        tags: '',
        status: 'draft',
        related_blog_ids: [],
        ai_model: '',
      });
      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Fout bij het opslaan van blog');
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      featured_image_url: blog.featured_image_url || '',
      photographer_name: (blog as any).photographer_name || '',
      photographer_url: (blog as any).photographer_url || '',
      meta_description: blog.meta_description || '',
      tags: blog.tags.join(', '),
      status: blog.status,
      related_blog_ids: blog.related_blog_ids || [],
      ai_model: blog.ai_model || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze blog wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Fout bij het verwijderen van blog');
    }
  };

  const toggleStatus = async (blog: Blog) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('blogs')
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null
        })
        .eq('id', blog.id);

      if (error) throw error;
      fetchBlogs();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fout bij het wijzigen van status');
    }
  };

  const handlePexelsSearch = async () => {
    if (!pexelsQuery.trim()) {
      return;
    }

    setSearchingPexels(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/search-pexels?query=${encodeURIComponent(pexelsQuery)}&per_page=12`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search Pexels');
      }

      const data = await response.json();
      setPexelsResults(data.photos || []);
    } catch (error) {
      console.error('Error searching Pexels:', error);
      alert('Fout bij het zoeken naar afbeeldingen');
    } finally {
      setSearchingPexels(false);
    }
  };

  const selectPexelsImage = (photo: PexelsPhoto) => {
    setFormData({
      ...formData,
      featured_image_url: photo.src.large,
      photographer_name: photo.photographer,
      photographer_url: photo.photographer_url
    });
    setShowPexelsSearch(false);
    setPexelsResults([]);
    setPexelsQuery('');
  };

  const insertBlogLink = () => {
    if (!selectedBlogForLink) return;

    const selectedBlog = blogs.find(b => b.id === selectedBlogForLink);
    if (!selectedBlog) return;

    const linkHtml = `<a href="/blog/${selectedBlog.slug}" class="text-blue-600 hover:underline">${selectedBlog.title}</a>`;
    const textarea = contentTextareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      const newContent = currentContent.substring(0, start) + linkHtml + currentContent.substring(end);

      setFormData({ ...formData, content: newContent });

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + linkHtml.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    setSelectedBlogForLink('');
  };

  const handleGenerateLinkedInPost = async (blog: Blog) => {
    setSelectedBlogForLinkedIn(blog);
    setShowLinkedInModal(true);
    setGeneratingLinkedInPost(true);
    setLinkedInPostText('');

    try {
      const blogUrl = `${window.location.origin}/blog/${blog.slug}`;
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-linkedin-post`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blogTitle: blog.title,
            blogExcerpt: blog.excerpt,
            blogUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate LinkedIn post');
      }

      const data = await response.json();
      setLinkedInPostText(data.post);
    } catch (error) {
      console.error('Error generating LinkedIn post:', error);
      alert('Fout bij het genereren van LinkedIn post');
      setShowLinkedInModal(false);
    } finally {
      setGeneratingLinkedInPost(false);
    }
  };

  const handlePublishToLinkedIn = async () => {
    if (!selectedBlogForLinkedIn || !linkedInPostText.trim()) {
      alert('Geen post tekst beschikbaar');
      return;
    }

    if (publishMode === 'schedule' && !scheduledDateTime) {
      alert('Selecteer een datum en tijd');
      return;
    }

    setPublishingToLinkedIn(true);
    try {
      const blogUrl = `${window.location.origin}/blog/${selectedBlogForLinkedIn.slug}`;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      if (publishMode === 'schedule') {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          throw new Error('Not authenticated');
        }

        const { error } = await supabase
          .from('scheduled_linkedin_posts')
          .insert({
            blog_id: selectedBlogForLinkedIn.id,
            user_id: currentUser.id,
            post_text: linkedInPostText,
            scheduled_for: new Date(scheduledDateTime).toISOString(),
            status: 'pending',
          });

        if (error) throw error;
        alert('LinkedIn post succesvol ingepland!');
        fetchScheduledPosts();
      } else {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/publish-to-linkedin`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              blogId: selectedBlogForLinkedIn.id,
              postText: linkedInPostText,
              blogUrl,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to publish to LinkedIn');
        }

        const data = await response.json();
        alert(`Succesvol gepubliceerd naar LinkedIn!\n\nBekijk de post: ${data.postUrl}`);
        fetchBlogs();
      }

      setShowLinkedInModal(false);
      setSelectedBlogForLinkedIn(null);
      setLinkedInPostText('');
      setPublishMode('now');
      setScheduledDateTime('');
    } catch (error: any) {
      console.error('Error publishing to LinkedIn:', error);
      alert(`Fout bij het publiceren naar LinkedIn: ${error.message}`);
    } finally {
      setPublishingToLinkedIn(false);
    }
  };

  const handleRetryScheduledPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_linkedin_posts')
        .update({ status: 'pending', error_message: null })
        .eq('id', postId);

      if (error) throw error;
      alert('Post wordt opnieuw geprobeerd');
      fetchScheduledPosts();
    } catch (error) {
      console.error('Error retrying scheduled post:', error);
      alert('Fout bij het opnieuw proberen');
    }
  };

  const handleCancelScheduledPost = async (postId: string) => {
    if (!confirm('Weet je zeker dat je deze geplande post wilt annuleren?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_linkedin_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      fetchScheduledPosts();
    } catch (error) {
      console.error('Error canceling scheduled post:', error);
      alert('Fout bij het annuleren');
    }
  };

  if (user?.email !== 'stein@fishdigital.be') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Blog Beheer</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingBlog(null);
              setFormData({
                title: '',
                slug: '',
                excerpt: '',
                content: '',
                featured_image_url: '',
                photographer_name: '',
                photographer_url: '',
                meta_description: '',
                tags: '',
                status: 'draft',
                related_blog_ids: [],
                ai_model: '',
              });
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Nieuwe Blog
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingBlog ? 'Blog Bewerken' : 'Nieuwe Blog'}
            </h2>

            {!editingBlog && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6 border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-900">AI Blog Generator</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Onderwerp *
                    </label>
                    <input
                      type="text"
                      value={generateForm.topic}
                      onChange={(e) => setGenerateForm({ ...generateForm, topic: e.target.value })}
                      placeholder="Bijv: De voordelen van AI in e-commerce"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords (optioneel)
                    </label>
                    <input
                      type="text"
                      value={generateForm.keywords}
                      onChange={(e) => setGenerateForm({ ...generateForm, keywords: e.target.value })}
                      placeholder="Bijv: AI, e-commerce, automatisering"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Toon
                    </label>
                    <select
                      value={generateForm.tone}
                      onChange={(e) => setGenerateForm({ ...generateForm, tone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="professional">Professioneel</option>
                      <option value="casual">Casual</option>
                      <option value="educational">Educatief</option>
                      <option value="inspirational">Inspirerend</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lengte
                    </label>
                    <select
                      value={generateForm.length}
                      onChange={(e) => setGenerateForm({ ...generateForm, length: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="short">Kort (500-700 woorden)</option>
                      <option value="medium">Gemiddeld (1000-1500 woorden)</option>
                      <option value="long">Lang (2000-3000 woorden)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Model
                    </label>
                    <select
                      value={generateForm.model}
                      onChange={(e) => setGenerateForm({ ...generateForm, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="gpt-4o-mini">ChatGPT (GPT-4o-mini)</option>
                      <option value="gpt-4o">ChatGPT (GPT-4o)</option>
                      <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                      <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                      <option value="claude-opus-4-5-20251101">Claude Opus 4.5</option>
                      <option value="claude-opus-4-1-20250805">Claude Opus 4.1</option>
                      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                      <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateBlog}
                  disabled={generating || !generateForm.topic.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Blog genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Genereer Blog met AI
                    </>
                  )}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titel *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({
                        ...formData,
                        title,
                        slug: title
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '')
                          .substring(0, 100)
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt (korte samenvatting) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content (HTML) *
                </label>
                <textarea
                  ref={contentTextareaRef}
                  required
                  rows={15}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Interne Blog Link Invoegen</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedBlogForLink}
                      onChange={(e) => setSelectedBlogForLink(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecteer een blog om te linken...</option>
                      {blogs
                        .filter(blog => blog.id !== editingBlog?.id && blog.status === 'published')
                        .map(blog => (
                          <option key={blog.id} value={blog.id}>
                            {blog.title}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={insertBlogLink}
                      disabled={!selectedBlogForLink}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Link className="w-4 h-4" />
                      Voeg Link Toe
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Plaats cursor in de content waar je de link wilt invoegen, selecteer een blog en klik op "Voeg Link Toe"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.featured_image_url}
                      onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPexelsSearch(!showPexelsSearch)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Zoek
                    </button>
                  </div>
                  {formData.featured_image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.featured_image_url}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {formData.photographer_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          Foto door{' '}
                          <a
                            href={formData.photographer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {formData.photographer_name}
                          </a>
                          {' '}op Pexels
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (komma gescheiden)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="AI, e-commerce, tips"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {showPexelsSearch && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Zoek Pexels Afbeeldingen</h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={pexelsQuery}
                      onChange={(e) => setPexelsQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handlePexelsSearch()}
                      placeholder="Zoek naar afbeeldingen..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handlePexelsSearch}
                      disabled={searchingPexels || !pexelsQuery.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {searchingPexels ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Zoek
                    </button>
                  </div>
                  {pexelsResults.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {pexelsResults.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => selectPexelsImage(photo)}
                          className="cursor-pointer group relative overflow-hidden rounded-lg border-2 border-transparent hover:border-blue-500 transition-all"
                        >
                          <img
                            src={photo.src.medium}
                            alt={`Photo by ${photo.photographer}`}
                            className="w-full h-32 object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-end p-2">
                            <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              {photo.photographer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description (SEO)
                </label>
                <textarea
                  rows={2}
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Max 160 karakters"
                  maxLength={160}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.meta_description.length}/160 karakters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Concept</option>
                  <option value="published">Gepubliceerd</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gerelateerde Blogs (Interlinking)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {blogs
                    .filter(blog => blog.id !== editingBlog?.id)
                    .map(blog => (
                      <label key={blog.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.related_blog_ids.includes(blog.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                related_blog_ids: [...formData.related_blog_ids, blog.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                related_blog_ids: formData.related_blog_ids.filter(id => id !== blog.id)
                              });
                            }
                          }}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                          <div className="text-xs text-gray-500">/blog/{blog.slug}</div>
                        </div>
                      </label>
                    ))}
                  {blogs.filter(blog => blog.id !== editingBlog?.id).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Geen andere blogs beschikbaar
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.related_blog_ids.length} blog(s) geselecteerd
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingBlog ? 'Bijwerken' : 'Opslaan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBlog(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {scheduledPosts.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Linkedin className="w-6 h-6 text-blue-600" />
              Geplande LinkedIn Posts ({scheduledPosts.length})
            </h2>
            <div className="space-y-3">
              {scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {post.blogs?.title || 'Blog verwijderd'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {post.post_text}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          Gepland voor: {new Date(post.scheduled_for).toLocaleString('nl-NL')}
                        </span>
                        {post.status === 'failed' && (
                          <span className="flex items-center gap-1 text-red-600">
                            Mislukt: {post.error_message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.status === 'failed' && (
                        <button
                          onClick={() => handleRetryScheduledPost(post.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Opnieuw proberen"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelScheduledPost(post.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Annuleren"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">Nog geen blogs aangemaakt</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LinkedIn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                      <div className="text-sm text-gray-500">/blog/{blog.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          blog.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {blog.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Eye className="w-4 h-4 text-gray-400" />
                        {blog.views_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {blog.ai_model ? (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                          {blog.ai_model}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Handmatig</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {blog.linkedin_post_id ? (
                        <a
                          href={blog.linkedin_post_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                        >
                          <Linkedin className="w-4 h-4" />
                          Geplaatst
                        </a>
                      ) : (
                        <button
                          onClick={() => handleGenerateLinkedInPost(blog)}
                          disabled={blog.status !== 'published'}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          title={blog.status !== 'published' ? 'Publiceer blog eerst' : 'Genereer LinkedIn post'}
                        >
                          <Linkedin className="w-4 h-4" />
                          Deel
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(blog.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(blog)}
                          className="text-blue-600 hover:text-blue-900"
                          title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {blog.status === 'published' ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(blog)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showLinkedInModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Deel naar LinkedIn</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowLinkedInModal(false);
                      setSelectedBlogForLinkedIn(null);
                      setLinkedInPostText('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {selectedBlogForLinkedIn && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-1">{selectedBlogForLinkedIn.title}</h3>
                    <p className="text-sm text-gray-600">{selectedBlogForLinkedIn.excerpt}</p>
                  </div>
                )}

                {generatingLinkedInPost ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-600">LinkedIn post genereren met AI...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Post Tekst
                      </label>
                      <textarea
                        value={linkedInPostText}
                        onChange={(e) => setLinkedInPostText(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bewerk de LinkedIn post hier..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {linkedInPostText.length} karakters
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publicatie Timing
                      </label>
                      <div className="flex gap-4 mb-3">
                        <button
                          onClick={() => setPublishMode('now')}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            publishMode === 'now'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Nu publiceren
                        </button>
                        <button
                          onClick={() => setPublishMode('schedule')}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            publishMode === 'schedule'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Inplannen
                        </button>
                      </div>

                      {publishMode === 'schedule' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Datum en tijd
                          </label>
                          <input
                            type="datetime-local"
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handlePublishToLinkedIn}
                        disabled={publishingToLinkedIn || !linkedInPostText.trim()}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                      >
                        {publishingToLinkedIn ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {publishMode === 'schedule' ? 'Inplannen...' : 'Publiceren...'}
                          </>
                        ) : (
                          <>
                            <Linkedin className="w-5 h-5" />
                            {publishMode === 'schedule' ? 'Post inplannen' : 'Publiceer naar LinkedIn'}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowLinkedInModal(false);
                          setSelectedBlogForLinkedIn(null);
                          setLinkedInPostText('');
                          setPublishMode('now');
                          setScheduledDateTime('');
                        }}
                        disabled={publishingToLinkedIn}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                      >
                        Annuleren
                      </button>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Let op:</strong> Zorg dat je LinkedIn integratie correct is ingesteld in de instellingen voordat je publiceert.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
