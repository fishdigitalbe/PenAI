import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Tag, ArrowLeft, Loader2, Share2 } from 'lucide-react';
import { SEOHead, ArticleStructuredData } from '../components/SEOHead';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string | null;
  photographer_name?: string | null;
  photographer_url?: string | null;
  author_email: string;
  published_at: string;
  tags: string[];
  meta_description: string | null;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBlog(data);
        fetchRelatedBlogs(data.tags, data.id);
        trackBlogView(data.id);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackBlogView = async (blogId: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/track-blog-view`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ blogId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
      }
    } catch (error) {
      // Silently fail - tracking is not critical
    }
  };

  const fetchRelatedBlogs = async (tags: string[], currentId: string) => {
    if (tags.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, featured_image_url, published_at, tags')
        .eq('status', 'published')
        .neq('id', currentId)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      const blogsWithMatchingTags = data?.filter((b) =>
        b.tags.some((tag) => tags.includes(tag))
      );

      setRelatedBlogs(blogsWithMatchingTags || data || []);
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min leestijd`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog niet gevonden</h1>
          <p className="text-gray-600 mb-8">
            Sorry, de blog die je zoekt bestaat niet of is niet meer beschikbaar.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar blog overzicht
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link gekopieerd naar klembord!');
    }
  };

  const currentUrl = `${window.location.origin}/blog/${blog.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={blog.title}
        description={blog.meta_description || blog.excerpt}
        image={blog.featured_image_url || undefined}
        url={currentUrl}
        type="article"
        publishedTime={blog.published_at}
        modifiedTime={blog.published_at}
        author={blog.author_email}
        tags={blog.tags}
      />
      <ArticleStructuredData
        title={blog.title}
        description={blog.meta_description || blog.excerpt}
        image={blog.featured_image_url || undefined}
        url={currentUrl}
        datePublished={blog.published_at}
        dateModified={blog.published_at}
        author={blog.author_email}
        tags={blog.tags}
      />
      <Navigation />

      <article className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Blog', href: '/blog' },
            { label: blog.title }
          ]}
        />

        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar blog overzicht
        </Link>

        <header className="mb-12">
          {blog.featured_image_url && (
            <div className="mb-8">
              <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg">
                <img
                  src={blog.featured_image_url}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {blog.photographer_name && (
                <p className="text-xs text-gray-500 mt-2 text-right">
                  Foto door{' '}
                  <a
                    href={blog.photographer_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {blog.photographer_name}
                  </a>
                  {' '}op Pexels
                </p>
              )}
            </div>
          )}

          {blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">{formatDate(blog.published_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">{getReadingTime(blog.content)}</span>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delen</span>
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-8 lg:p-12">
          <div
            className="blog-content prose prose-lg max-w-none"
            style={{
              color: '#1f2937',
              fontSize: '1.125rem',
              lineHeight: '1.75',
            }}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
      </article>

      {relatedBlogs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Gerelateerde artikelen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedBlogs.map((relatedBlog) => (
              <Link
                key={relatedBlog.id}
                to={`/blog/${relatedBlog.slug}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
              >
                {relatedBlog.featured_image_url ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={relatedBlog.featured_image_url}
                      alt={relatedBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-white text-6xl font-bold opacity-20">
                      {relatedBlog.title.charAt(0)}
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {relatedBlog.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {relatedBlog.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
