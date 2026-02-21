'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  MessageSquare,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { adminApi, AdminComment } from '@/lib/api';
import useQuranStore from '@/lib/store';

export default function AdminCommentsPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const { theme } = useQuranStore();
  const router = useRouter();
  
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (user && !user.is_admin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (token && user?.is_admin) {
      loadComments();
    }
  }, [token, user, filter]);

  const loadComments = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let data;
      if (filter === 'pending') {
        data = await adminApi.getPendingComments(token);
      } else {
        data = await adminApi.getAllComments(token, filter === 'approved');
      }
      setComments(data);
    } catch (err: any) {
      setError('Failed to load comments');
      console.error('Error loading comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (commentId: number, action: 'approve' | 'decline' | 'delete') => {
    if (!token) return;
    
    if (action === 'delete' && !confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      await adminApi.moderateComment(commentId, action, token);
      loadComments();
    } catch (err) {
      console.error('Error moderating comment:', err);
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-white';
      case 'sepia':
        return 'bg-[#f4ecd8] text-gray-900';
      case 'light':
      default:
        return 'bg-gray-50 text-gray-900';
    }
  };

  const getCardClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-800 border-gray-700';
      case 'sepia':
        return 'bg-[#fefcf5] border-amber-200';
      case 'light':
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (!isAuthenticated || (user && !user.is_admin)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}>
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p>Access denied</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getThemeClasses()}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin"
              className={`inline-flex items-center gap-2 text-sm mb-4 transition-colors ${
                theme === 'dark' ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-emerald-600" />
              <h1 className="text-3xl font-bold">Comment Moderation</h1>
            </div>
          </div>
          <button
            onClick={loadComments}
            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className={`flex gap-2 mb-6 p-1 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-emerald-600 text-white'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
          </div>
        )}

        {/* Comments List */}
        {!isLoading && (
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className={`text-center py-12 rounded-xl border ${getCardClasses()}`}>
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No comments found</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-6 rounded-xl border ${getCardClasses()}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`font-semibold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {comment.username}
                        </span>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          comment.is_approved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {comment.is_approved ? 'Approved' : 'Pending'}
                        </span>
                        {!comment.is_public && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            Private
                          </span>
                        )}
                      </div>
                      <p className={`mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {comment.content}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        On: {comment.verse_info}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!comment.is_approved && (
                        <button
                          onClick={() => handleModerate(comment.id, 'approve')}
                          className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      {comment.is_approved && (
                        <button
                          onClick={() => handleModerate(comment.id, 'decline')}
                          className="p-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                          title="Decline"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleModerate(comment.id, 'delete')}
                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
