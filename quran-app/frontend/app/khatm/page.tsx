'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Plus, 
  ChevronRight, 
  MoreHorizontal,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Settings,
  Target
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { khatmApi, Khatm, KhatmSession } from '@/lib/api';
import useQuranStore from '@/lib/store';
import { AuthModal } from '@/components/auth/AuthModal';

interface KhatmWithSession extends Khatm {
  todaySession?: KhatmSession;
}

export default function KhatmPage() {
  const { isAuthenticated, token } = useAuth();
  const { t } = useTranslation();
  const { theme } = useQuranStore();
  const router = useRouter();
  
  const [khatms, setKhatms] = useState<KhatmWithSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    loadKhatms();
  }, [isAuthenticated, token]);

  const loadKhatms = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await khatmApi.getKhatms(token);
      
      // Load today's session for each active khatm
      const khatmsWithSessions = await Promise.all(
        data.map(async (khatm) => {
          if (khatm.is_active) {
            try {
              const todaySession = await khatmApi.getTodaySession(khatm.id, token);
              if ('id' in todaySession) {
                return { ...khatm, todaySession };
              }
            } catch (err) {
              console.error('Error loading today session:', err);
            }
          }
          return khatm;
        })
      );
      
      setKhatms(khatmsWithSessions);
    } catch (err) {
      setError('Failed to load Khatm schedules');
      console.error('Error loading khatms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKhatm = async (khatmId: number) => {
    if (!token || !confirm(t.deleteKhatmConfirm || 'Are you sure you want to delete this Khatm?')) {
      return;
    }
    
    try {
      await khatmApi.deleteKhatm(khatmId, token);
      setKhatms(khatms.filter(k => k.id !== khatmId));
    } catch (err) {
      console.error('Error deleting khatm:', err);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => router.push('/')} />
      </div>
    );
  }

  const activeKhatms = khatms.filter(k => k.is_active);
  const completedKhatms = khatms.filter(k => k.is_completed);

  return (
    <div className={`min-h-screen flex flex-col ${
      theme === 'dark' ? 'bg-gray-900' : theme === 'sepia' ? 'bg-amber-50' : 'bg-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {t.khatm || 'Khatm'}
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {t.khatmSubtitle || 'Complete the Quran on your schedule'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">{t.newKhatm || 'New Khatm'}</span>
          </button>
        </div>

        {/* Today's Sessions */}
        {activeKhatms.some(k => k.todaySession) && (
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {t.todaySession || "Today's Session"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeKhatms
                .filter(k => k.todaySession)
                .map(khatm => (
                  <div
                    key={khatm.id}
                    className={`rounded-xl border p-6 transition-all hover:shadow-lg ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`font-semibold mb-1 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {khatm.title}
                        </h3>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {t.session || 'Session'} #{khatm.todaySession!.session_number}
                        </p>
                      </div>
                      {getStatusIcon(khatm.todaySession!.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className={`flex items-center gap-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Clock className="h-4 w-4" />
                        {khatm.todaySession!.scheduled_time}
                      </div>
                      <div className={`flex items-center gap-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <BookOpen className="h-4 w-4" />
                        {khatm.todaySession!.verse_count} {t.verses}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className={`text-sm mb-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {khatm.todaySession!.start_surah} {khatm.todaySession!.start_verse_in_surah} 
                        {' → '}
                        {khatm.todaySession!.end_surah} {khatm.todaySession!.end_verse_in_surah}
                      </p>
                    </div>

                    <Link
                      href={`/khatm/${khatm.id}/session/${khatm.todaySession!.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      {khatm.reading_mode === 'read_listen' 
                        ? (t.readAndListen || 'Read & Listen')
                        : (t.startReading || 'Start Reading')
                      }
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Active Khatms */}
        {activeKhatms.length > 0 && (
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {t.activeKhatms || 'Active Khatms'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {activeKhatms.map(khatm => (
                <div
                  key={khatm.id}
                  className={`rounded-xl border p-6 transition-all hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className={`font-semibold text-lg mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {khatm.title}
                      </h3>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {khatm.completed_sessions} / {khatm.total_sessions} {t.sessionsCompleted}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteKhatm(khatm.id)}
                      className={`p-2 rounded-full transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                          : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className={`flex justify-between text-sm mb-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span>{t.progress}</span>
                      <span>{Math.round(khatm.progress_percentage)}%</span>
                    </div>
                    <div className={`h-2 rounded-full ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(khatm.progress_percentage)}`}
                        style={{ width: `${khatm.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className={`text-center p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <p className={`text-lg font-semibold ${
                        theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                      }`}>
                        {khatm.completed_sessions}
                      </p>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t.completed}
                      </p>
                    </div>
                    <div className={`text-center p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <p className={`text-lg font-semibold ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {khatm.total_sessions - khatm.completed_sessions}
                      </p>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t.remaining}
                      </p>
                    </div>
                    <div className={`text-center p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <p className={`text-lg font-semibold ${
                        theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        {Math.round(khatm.verses_percentage)}%
                      </p>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t.verses}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/khatm/${khatm.id}`}
                    className={`flex items-center justify-center gap-2 w-full py-2 border rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t.viewCalendar || 'View Calendar'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && activeKhatms.length === 0 && (
          <div className={`text-center py-16 rounded-xl ${
            theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
          }`}>
            <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className={`text-xl font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {t.noKhatm || 'No Khatm Yet'}
            </h3>
            <p className="mb-6 max-w-md mx-auto">
              {t.khatmDescription || 'Start a Khatm to read the Quran on a schedule that works for you. Set your pace and track your progress.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              {t.startKhatm || 'Start Your Khatm'}
            </button>
          </div>
        )}

        {/* Completed Khatms */}
        {completedKhatms.length > 0 && (
          <div className="mt-12">
            <h2 className={`text-xl font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {t.completedKhatms || 'Completed Khatms'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedKhatms.map(khatm => (
                <div
                  key={khatm.id}
                  className={`rounded-xl border p-6 opacity-75 ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    <h3 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {khatm.title}
                    </h3>
                  </div>
                  <p className={`text-sm mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {khatm.total_sessions} {t.sessions} • {khatm.total_verses} {t.verses}
                  </p>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {new Date(khatm.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Khatm Modal */}
      {showCreateModal && (
        <CreateKhatmModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadKhatms}
        />
      )}
    </div>
  );
}

// Create Khatm Modal Component
interface CreateKhatmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateKhatmModal({ isOpen, onClose, onSuccess }: CreateKhatmModalProps) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { theme } = useQuranStore();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    frequencyType: 'daily' as 'daily' | 'weekly' | 'custom',
    readingDays: [] as string[],
    readingTime: '19:00',
    readingMode: 'read_listen' as 'read_only' | 'read_listen',
    enableAudioBreak: true,
    reminderMinutesBefore: 30,
    enableMissedDayNotifications: true,
  });

  const daysOfWeek = [
    { key: 'sun', label: t.sun || 'Sun' },
    { key: 'mon', label: t.mon || 'Mon' },
    { key: 'tue', label: t.tue || 'Tue' },
    { key: 'wed', label: t.wed || 'Wed' },
    { key: 'thu', label: t.thu || 'Thu' },
    { key: 'fri', label: t.fri || 'Fri' },
    { key: 'sat', label: t.sat || 'Sat' },
  ];

  const handleToggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      readingDays: prev.readingDays.includes(day)
        ? prev.readingDays.filter(d => d !== day)
        : [...prev.readingDays, day]
    }));
  };

  const handleSubmit = async () => {
    if (!token) return;
    
    setIsSubmitting(true);
    
    try {
      await khatmApi.createKhatm({
        title: formData.title,
        description: formData.description,
        start_date: new Date(formData.startDate).toISOString(),
        end_date: new Date(formData.endDate).toISOString(),
        frequency_type: formData.frequencyType,
        reading_days: formData.readingDays,
        reading_time: formData.readingTime,
        reading_mode: formData.readingMode,
        enable_audio_break: formData.enableAudioBreak,
        reminder_minutes_before: formData.reminderMinutesBefore,
        enable_missed_day_notifications: formData.enableMissedDayNotifications,
      }, token);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating khatm:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-2xl font-bold mb-6 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {t.createNewKhatm || 'Create New Khatm'}
        </h2>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t.title || 'Title'} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t.khatmTitlePlaceholder || 'e.g., Ramadan Khatm 2024'}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t.description || 'Description'} ({t.optional || 'optional'})
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.startDate || 'Start Date'} *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.endDate || 'End Date'} *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.title || !formData.startDate || !formData.endDate}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.next || 'Next'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t.frequency || 'Frequency'} *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'daily', label: t.daily || 'Daily' },
                  { key: 'weekly', label: t.weekly || 'Weekly' },
                  { key: 'custom', label: t.custom || 'Custom' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFormData({ ...formData, frequencyType: key as any })}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.frequencyType === key
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {(formData.frequencyType === 'weekly' || formData.frequencyType === 'custom') && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.selectDays || 'Select Days'} *
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleToggleDay(key)}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        formData.readingDays.includes(key)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t.readingTime || 'Reading Time'} *
              </label>
              <input
                type="time"
                value={formData.readingTime}
                onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className={`flex-1 py-3 border rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.back || 'Back'}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={
                  (formData.frequencyType !== 'daily' && formData.readingDays.length === 0)
                }
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {t.next || 'Next'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t.readingMode || 'Reading Mode'} *
              </label>
              <div className="space-y-3">
                <button
                  onClick={() => setFormData({ ...formData, readingMode: 'read_only' })}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    formData.readingMode === 'read_only'
                      ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20'
                      : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className={`h-5 w-5 ${
                      formData.readingMode === 'read_only' ? 'text-emerald-600' : ''
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t.readOnly || 'Read Only'}
                      </p>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t.readOnlyDesc || 'Read the Quran page by page without audio'}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, readingMode: 'read_listen' })}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    formData.readingMode === 'read_listen'
                      ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20'
                      : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <BookOpen className={`h-5 w-5 ${
                        formData.readingMode === 'read_listen' ? 'text-emerald-600' : ''
                      }`} />
                      <span className="text-gray-400">+</span>
                      <svg className={`h-5 w-5 ${
                        formData.readingMode === 'read_listen' ? 'text-emerald-600' : ''
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t.readAndListen || 'Read & Listen'}
                      </p>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t.readAndListenDesc || 'Listen to recitation with time to repeat each verse'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {formData.readingMode === 'read_listen' && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="audioBreak"
                  checked={formData.enableAudioBreak}
                  onChange={(e) => setFormData({ ...formData, enableAudioBreak: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="audioBreak" className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.enableAudioBreak || 'Pause after each verse to repeat'}
                </label>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t.remindBefore || 'Remind me before'}
              </label>
              <select
                value={formData.reminderMinutesBefore}
                onChange={(e) => setFormData({ ...formData, reminderMinutesBefore: parseInt(e.target.value) })}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={15}>15 {t.minutes || 'minutes'}</option>
                <option value={30}>30 {t.minutes || 'minutes'}</option>
                <option value={60}>1 {t.hour || 'hour'}</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className={`flex-1 py-3 border rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.back || 'Back'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.creating || 'Creating...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    {t.createKhatm || 'Create Khatm'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
