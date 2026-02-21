'use client';

import { useState, useEffect } from 'react';
import { X, Send, Edit2, Trash2, Lock, Globe } from 'lucide-react';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/AuthContext';
import { verseInteractionsApi, VerseComment } from '@/lib/api';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseId: number;
  verseNumber: number;
  surahName: string;
}

export function CommentsModal({ isOpen, onClose, verseId, verseNumber, surahName }: CommentsModalProps) {
  const { theme } = useQuranStore();
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<VerseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [editingComment, setEditingComment] = useState<VerseComment | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      loadComments();
    }
  }, [isOpen, verseId, token]);

  const loadComments = async () => {
    if (!token) return;
    try {
      const data = await verseInteractionsApi.getVerseComments(verseId, token);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newComment.trim()) return;

    setIsLoading(true);
    try {
      if (editingComment) {
        await verseInteractionsApi.updateComment(verseId, editingComment.id, newComment, token);
        setEditingComment(null);
      } else {
        await verseInteractionsApi.createComment(verseId, newComment, isPublic, token);
      }
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!token || !confirm(t.deleteCommentConfirm || 'Delete this comment?')) return;

    try {
      await verseInteractionsApi.deleteComment(verseId, commentId, token);
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const startEdit = (comment: VerseComment) => {
    setEditingComment(comment);
    setNewComment(comment.content);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl flex flex-col ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t.comments || 'Comments'}
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {surahName} - {t.verse} {verseNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {comments.length === 0 ? (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t.noComments || 'No comments yet. Be the first to comment!'}
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {comment.username}
                    </span>
                    {!comment.is_public && (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => startEdit(comment)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <div className={`p-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  isPublic
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Globe className="h-4 w-4" />
                {t.public || 'Public'}
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  !isPublic
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Lock className="h-4 w-4" />
                {t.private || 'Private'}
              </button>
            </div>
            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t.addComment || 'Add a comment...'}
                className={`flex-1 px-4 py-2 rounded-lg border resize-none h-20 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <button
                type="submit"
                disabled={isLoading || !newComment.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}