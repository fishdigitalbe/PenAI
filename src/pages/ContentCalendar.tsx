import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit2, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  platform: string;
  status: string;
  scheduled_date: string;
  published_date?: string;
  content_body?: string;
  tags: string[];
  color: string;
}

export default function ContentCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'social',
    platform: 'linkedin',
    status: 'draft',
    scheduled_date: '',
    content_body: '',
    tags: '',
    color: '#3B82F6',
  });

  const platforms = [
    { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
    { id: 'facebook', label: 'Facebook', color: '#1877F2' },
    { id: 'instagram', label: 'Instagram', color: '#E4405F' },
    { id: 'twitter', label: 'Twitter/X', color: '#1DA1F2' },
    { id: 'email', label: 'Email', color: '#EA4335' },
    { id: 'blog', label: 'Blog', color: '#10B981' },
    { id: 'youtube', label: 'YouTube', color: '#FF0000' },
    { id: 'other', label: 'Anders', color: '#6B7280' },
  ];

  const statuses = [
    { id: 'draft', label: 'Concept', color: 'gray' },
    { id: 'scheduled', label: 'Gepland', color: 'blue' },
    { id: 'published', label: 'Gepubliceerd', color: 'green' },
    { id: 'cancelled', label: 'Geannuleerd', color: 'red' },
  ];

  useEffect(() => {
    if (user) {
      fetchContentItems();
    }
  }, [user, currentDate]);

  const fetchContentItems = async () => {
    setIsLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .gte('scheduled_date', startOfMonth.toISOString())
        .lte('scheduled_date', endOfMonth.toISOString())
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setContentItems(data || []);
    } catch (error) {
      console.error('Error fetching content items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getItemsForDate = (date: Date) => {
    return contentItems.filter(item => {
      const itemDate = new Date(item.scheduled_date);
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const openAddModal = (date?: Date) => {
    setEditingItem(null);
    setSelectedDate(date || new Date());
    const dateStr = (date || new Date()).toISOString().split('T')[0];
    setFormData({
      title: '',
      description: '',
      content_type: 'social',
      platform: 'linkedin',
      status: 'draft',
      scheduled_date: dateStr,
      content_body: '',
      tags: '',
      color: '#3B82F6',
    });
    setShowModal(true);
  };

  const openEditModal = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      content_type: item.content_type,
      platform: item.platform,
      status: item.status,
      scheduled_date: item.scheduled_date.split('T')[0],
      content_body: item.content_body || '',
      tags: item.tags.join(', '),
      color: item.color,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dataToSave = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        content_type: formData.content_type,
        platform: formData.platform,
        status: formData.status,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        content_body: formData.content_body,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        color: formData.color,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('content_calendar')
          .update(dataToSave)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('content_calendar')
          .insert(dataToSave);
        if (error) throw error;
      }

      setShowModal(false);
      fetchContentItems();
    } catch (error) {
      console.error('Error saving content item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchContentItems();
    } catch (error) {
      console.error('Error deleting content item:', error);
    }
  };

  const monthYear = currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentDate);
  const weekDays = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Content Kalender</h1>
              </div>
              <p className="text-lg text-gray-600">
                Plan en organiseer al je content op één plek
              </p>
            </div>
            <button
              onClick={() => openAddModal()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nieuwe Content
            </button>
          </div>

          <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">{monthYear}</h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {weekDays.map(day => (
                <div key={day} className="bg-gray-50 px-2 py-3 text-center">
                  <span className="text-sm font-semibold text-gray-700">{day}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="bg-gray-50 min-h-32"></div>;
                }

                const items = getItemsForDate(date);
                const isToday =
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={date.toISOString()}
                    className="bg-white min-h-32 p-2 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openAddModal(date)}
                  >
                    <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-purple-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {items.slice(0, 3).map(item => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(item);
                          }}
                          style={{ borderLeftColor: item.color }}
                          className="text-xs p-1.5 bg-gray-50 rounded border-l-2 hover:bg-gray-100 transition-colors truncate"
                        >
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-gray-500 text-xs">{item.platform}</div>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1.5">
                          +{items.length - 3} meer
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingItem ? 'Content Bewerken' : 'Nieuwe Content'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Titel van je content"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Beschrijving
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors resize-none"
                  placeholder="Korte beschrijving of notities"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Platform *
                  </label>
                  <select
                    required
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  >
                    {platforms.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Geplande Datum *
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content_body}
                  onChange={(e) => setFormData({ ...formData, content_body: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors resize-none"
                  placeholder="De content die je wilt plaatsen..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags (komma gescheiden)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="marketing, social media, product launch"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kleur Label
                </label>
                <div className="flex gap-3">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      style={{ backgroundColor: color }}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        formData.color === color ? 'ring-4 ring-offset-2 ring-gray-300' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(editingItem.id);
                      setShowModal(false);
                    }}
                    className="px-6 py-3 bg-red-50 text-red-700 rounded-xl font-semibold hover:bg-red-100 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Verwijderen
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all ml-auto"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {editingItem ? 'Opslaan' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
