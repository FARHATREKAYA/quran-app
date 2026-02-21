'use client';

import { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/AuthContext';
import { verseInteractionsApi } from '@/lib/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseId: number;
  verseNumber: number;
  surahName: string;
}

const reportTypes = [
  { value: 'translation_error', label: 'Translation Error' },
  { value: 'audio_error', label: 'Audio Error' },
  { value: 'tafsir_error', label: 'Tafsir/Explanation Error' },
  { value: 'other', label: 'Other Issue' },
];

export function ReportModal({ isOpen, onClose, verseId, verseNumber, surahName }: ReportModalProps) {
  const { theme } = useQuranStore();
  const { t } = useTranslation();
  const { token } = useAuth();
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReportType('');
      setDescription('');
      setIsSubmitted(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reportType || !description.trim()) return;

    setIsLoading(true);
    try {
      await verseInteractionsApi.createReport(verseId, reportType, description, token);
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full max-w-lg rounded-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t.reportIssue || 'Report Issue'}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {surahName} - {t.verse} {verseNumber}
              </p>
            </div>
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

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h4 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t.reportSubmitted || 'Report Submitted'}
              </h4>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t.reportSubmittedMessage || 'Thank you for helping us improve!'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Type */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.issueType || 'Issue Type'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {reportTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setReportType(type.value)}
                      className={`p-3 rounded-lg border text-sm transition-colors ${
                        reportType === type.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : theme === 'dark'
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.description || 'Description'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.reportPlaceholder || 'Please describe the issue in detail...'}
                  rows={5}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t.reportMinChars || 'Minimum 10 characters required'}
                </p>
              </div>

              {/* Validation Messages */}
              {(!reportType || description.length < 10) && (
                <div className={`text-sm ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} flex items-center gap-2`}>
                  <AlertTriangle className="h-4 w-4" />
                  {!reportType && description.length < 10 
                    ? 'Please select an issue type and enter at least 10 characters'
                    : !reportType 
                    ? 'Please select an issue type'
                    : 'Please enter at least 10 characters'}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !reportType || description.length < 10}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
                  !reportType || description.length < 10
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.submitting || 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {t.submitReport || 'Submit Report'}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}