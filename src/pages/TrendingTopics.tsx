import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Search, Bookmark, BookmarkCheck, Sparkles, ArrowRight, Filter } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

interface TrendingTopic {
  id: string;
  category: string;
  topic: string;
  description: string;
  keywords: string[];
  trend_score: number;
  saved: boolean;
}

export default function TrendingTopics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedTopics, setSavedTopics] = useState<Set<string>>(new Set());

  const categories = [
    'Technology',
    'Marketing',
    'Business',
    'Health',
    'Sustainability',
    'Education',
    'Finance'
  ];

  useEffect(() => {
    loadTrendingTopics();
    if (user) {
      loadSavedTopics();
    }
  }, [user]);

  useEffect(() => {
    filterTopics();
  }, [topics, searchQuery, selectedCategory, savedTopics]);

  const loadTrendingTopics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiUrl = `${SUPABASE_URL}/functions/v1/generate-trending-topics`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error from API:', data.error);
        setError(data.error || 'Er is een fout opgetreden bij het laden van trending topics');
        setTopics([]);
        return;
      }

      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error loading trending topics:', error);
      setError('Er is een fout opgetreden bij het laden van trending topics');
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedTopics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_trending_topics')
        .select('topic_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedTopics(new Set(data.map(item => item.topic_id)));
    } catch (error) {
      console.error('Error loading saved topics:', error);
    }
  };

  const filterTopics = () => {
    let filtered = [...topics];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(topic => topic.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(topic =>
        topic.topic.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    filtered = filtered.map(topic => ({
      ...topic,
      saved: savedTopics.has(topic.id)
    }));

    setFilteredTopics(filtered);
  };

  const toggleSaveTopic = async (topicId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (savedTopics.has(topicId)) {
        const { error } = await supabase
          .from('saved_trending_topics')
          .delete()
          .eq('user_id', user.id)
          .eq('topic_id', topicId);

        if (error) throw error;

        setSavedTopics(prev => {
          const next = new Set(prev);
          next.delete(topicId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('saved_trending_topics')
          .insert({
            user_id: user.id,
            topic_id: topicId
          });

        if (error) throw error;

        setSavedTopics(prev => new Set(prev).add(topicId));
      }
    } catch (error) {
      console.error('Error toggling saved topic:', error);
    }
  };

  const handleUseTopic = (topic: TrendingTopic) => {
    navigate('/content-strategy-planner', {
      state: {
        prefilledTopic: topic.topic,
        prefilledKeywords: topic.keywords.join(', ')
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Trending Topics</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ontdek de meest actuele onderwerpen voor jouw content strategie
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-800 font-semibold">Fout bij laden</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={loadTrendingTopics}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Opnieuw proberen
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek topics, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Alle categorieën</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Sparkles className="w-4 h-4" />
            <span>
              {filteredTopics.length} trending topics gevonden
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Trending topics laden...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {topic.category}
                  </span>
                  <button
                    onClick={() => toggleSaveTopic(topic.id)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {topic.saved ? (
                      <BookmarkCheck className="w-5 h-5 fill-current text-blue-600" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {topic.topic}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {topic.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {topic.keywords.slice(0, 3).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {topic.trend_score}% trending
                    </span>
                  </div>
                  <button
                    onClick={() => handleUseTopic(topic)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Gebruik
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredTopics.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Geen topics gevonden
            </h3>
            <p className="text-gray-600">
              Probeer een andere zoekopdracht of filter
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
