import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Tag, ArrowRight, Loader2, Sparkles } from 'lucide-react';
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

const FEATURED_CATEGORIES = [
  {
    id: 'ai-content',
    name: 'AI & Content Creatie',
    description: 'Ontdek hoe AI jouw content creatie transformeert',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'e-commerce',
    name: 'E-commerce & Online Verkoop',
    description: 'Tips voor meer conversie en omzet',
    icon: ArrowRight,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'marketing',
    name: 'Marketing & SEO',
    description: 'Verhoog je online zichtbaarheid',
    icon: Tag,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'tutorials',
    name: 'Handleidingen & Tips',
    description: 'Praktische stap-voor-stap handleidingen',
    icon: Calendar,
    color: 'from-orange-500 to-red-500'
  }
];

export default function Blog() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, content, featured_image_url, author_email, published_at, tags')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const tagCounts = blogs.flatMap((blog) => blog.tags).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  const filteredBlogs = selectedTag
    ? blogs.filter((blog) => blog.tags.includes(selectedTag))
    : blogs;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Blog - AI, E-commerce & Content Creatie"
        description="Ontdek de laatste inzichten, tips en trends over AI, e-commerce en content creatie. Leer hoe je AI kunt inzetten voor jouw online business."
        type="website"
      />
      <Navigation />

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Ontdek de laatste inzichten, tips en trends over AI, e-commerce en content creatie
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Blog' }]} />
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Categorieën</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_CATEGORIES.filter(category => (tagCounts[category.id] || 0) > 0).map((category) => {
              const Icon = category.icon;
              const categoryCount = tagCounts[category.id] || 0;

              return (
                <Link
                  key={category.id}
                  to={`/blog/category/${category.id}`}
                  className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className="w-8 h-8 text-gray-700 group-hover:text-blue-600 transition-colors" />
                      <span className="text-sm font-medium text-gray-500">
                        {categoryCount} {categoryCount === 1 ? 'artikel' : 'artikelen'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {category.description}
                    </p>
                    <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                      Bekijk artikelen
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {selectedTag ? `Artikelen: ${selectedTag}` : 'Alle artikelen'}
          </h2>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Alle artikelen ({blogs.length})
              </button>
              {allTags.map((tag) => {
                const category = FEATURED_CATEGORIES.find(cat => cat.id === tag);
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTag === tag
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {category?.name || tag} ({tagCounts[tag]})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              {selectedTag
                ? `Geen blogs gevonden met tag "${selectedTag}"`
                : 'Nog geen blogs gepubliceerd'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
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
                  <div className="aspect-video w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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
                      {blog.tags.slice(0, 3).map((tag) => {
                        const category = FEATURED_CATEGORIES.find(cat => cat.id === tag);
                        return (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            <Tag className="w-3 h-3" />
                            {category?.name || tag}
                          </span>
                        );
                      })}
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
        )}
      </div>

      <Footer />
    </div>
  );
}
