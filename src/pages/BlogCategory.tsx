import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Tag, ArrowRight, Loader2 } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  author_email: string;
  published_at: string;
  tags: string[];
}

const CATEGORY_INFO: Record<string, { name: string; description: string; metaDescription: string }> = {
  'ai-content': {
    name: 'AI & Content Creatie',
    description: 'Ontdek hoe AI jouw content creatie naar een hoger niveau tilt. Van geautomatiseerde blog posts tot intelligente e-books.',
    metaDescription: 'Leer alles over AI-gestuurde content creatie. Tips, tools en strategieën voor het maken van hoogwaardige content met kunstmatige intelligentie.'
  },
  'e-commerce': {
    name: 'E-commerce & Online Verkoop',
    description: 'Praktische tips en strategieën om jouw online verkoop te verhogen. Van product content tot conversie optimalisatie.',
    metaDescription: 'E-commerce tips en strategieën voor meer online verkoop. Leer hoe je jouw webshop optimaliseert en meer klanten converteert.'
  },
  'marketing': {
    name: 'Marketing & SEO',
    description: 'Verhoog je online zichtbaarheid met slimme marketing strategieën en SEO best practices.',
    metaDescription: 'Praktische marketing en SEO tips om jouw online zichtbaarheid te vergroten. Van content marketing tot technische SEO.'
  },
  'tutorials': {
    name: 'Handleidingen & Tips',
    description: 'Stap-voor-stap handleidingen en praktische tips om direct mee aan de slag te gaan.',
    metaDescription: 'Concrete handleidingen en praktische tips voor content creatie, online marketing en e-commerce. Direct toepasbaar.'
  }
};

export default function BlogCategory() {
  const { category } = useParams<{ category: string }>();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryInfo = category ? CATEGORY_INFO[category] : null;

  useEffect(() => {
    if (category && categoryInfo) {
      fetchBlogsByCategory(category);
    } else {
      setLoading(false);
    }
  }, [category]);

  const fetchBlogsByCategory = async (cat: string) => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, content, featured_image_url, author_email, published_at, tags')
        .eq('status', 'published')
        .contains('tags', [cat])
        .order('published_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
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
    return `${minutes} min`;
  };

  if (!category || !categoryInfo) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={`${categoryInfo.name} - Blog`}
        description={categoryInfo.metaDescription}
        type="website"
      />
      <Navigation />

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{categoryInfo.name}</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            {categoryInfo.description}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Blog', href: '/blog' },
            { label: categoryInfo.name }
          ]}
        />
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              Nog geen artikelen in deze categorie
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              Terug naar alle artikelen
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-gray-600">
                {blogs.length} {blogs.length === 1 ? 'artikel' : 'artikelen'} gevonden
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  to={`/blog/${blog.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
                >
                  {blog.featured_image_url ? (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={blog.featured_image_url}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <div className="text-white text-6xl font-bold opacity-20">
                        {blog.title.charAt(0)}
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(blog.published_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getReadingTime(blog.content)}
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {blog.title}
                    </h2>

                    <p className="text-gray-600 mb-4 line-clamp-3">{blog.excerpt}</p>

                    {blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            <Tag className="w-3 h-3" />
                            {CATEGORY_INFO[tag]?.name || tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                      Lees meer
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-medium"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Bekijk alle categorieën
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
