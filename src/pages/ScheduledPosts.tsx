import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Loader2, Calendar, Send, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { SUPABASE_URL } from '../config';

interface ScheduledPost {
  id: string;
  blog_id: string;
  post_text: string;
  scheduled_for: string;
  status: 'pending' | 'published' | 'failed';
  published_at: string | null;
  error_message: string | null;
  blogs: {
    title: string;
    slug: string;
  };
}

export default function ScheduledPosts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchScheduledPosts();
  }, [user]);

  const fetchScheduledPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_linkedin_posts')
        .select(`
          *,
          blogs (
            title,
            slug
          )
        `)
        .eq('user_id', user?.id)
        .order('scheduled_for', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching scheduled posts:', error);
      alert('Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
  };

  const publishNow = async (postId: string, isRetry: boolean = false) => {
    const message = isRetry
      ? 'Wil je deze post opnieuw proberen te publiceren op LinkedIn?'
      : 'Wil je deze post nu direct publiceren op LinkedIn?';

    if (!confirm(message)) {
      return;
    }

    setPublishing(postId);
    try {
      if (isRetry) {
        const { error: resetError } = await supabase
          .from('scheduled_linkedin_posts')
          .update({
            status: 'pending',
            error_message: null
          })
          .eq('id', postId);

        if (resetError) throw resetError;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/process-scheduled-linkedin-posts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ post_id: postId }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.results?.[0]?.error || result.error || 'Failed to publish post';
        throw new Error(errorMsg);
      }

      alert('Post succesvol gepubliceerd!');
      fetchScheduledPosts();
    } catch (error: any) {
      console.error('Error publishing post:', error);
      alert(`Fout bij publiceren: ${error.message}`);
      fetchScheduledPosts();
    } finally {
      setPublishing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Gepubliceerd';
      case 'failed':
        return 'Mislukt';
      default:
        return 'Gepland';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Geplande LinkedIn Posts
          </h1>
          <p className="text-gray-600">
            Bekijk en beheer je geplande LinkedIn posts
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Geen geplande posts
            </h3>
            <p className="text-gray-600">
              Je hebt nog geen LinkedIn posts gepland
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(post.status)}
                      <span className="font-semibold text-gray-900">
                        {getStatusText(post.status)}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">
                        {formatDate(post.scheduled_for)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.blogs.title}
                    </h3>

                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">
                        {post.post_text}
                      </p>
                    </div>

                    {post.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-900">
                              Foutmelding:
                            </p>
                            <p className="text-sm text-red-700">
                              {post.error_message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {post.published_at && (
                      <p className="text-sm text-gray-500">
                        Gepubliceerd op {formatDate(post.published_at)}
                      </p>
                    )}
                  </div>

                  {(post.status === 'pending' || post.status === 'failed') && (
                    <button
                      onClick={() => publishNow(post.id, post.status === 'failed')}
                      disabled={publishing === post.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                        post.status === 'failed'
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {publishing === post.id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Publiceren...
                        </>
                      ) : post.status === 'failed' ? (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          Opnieuw proberen
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Nu publiceren
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
