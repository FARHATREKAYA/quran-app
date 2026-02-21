'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Flag,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { adminApi, AdminReport } from '@/lib/api';
import useQuranStore from '@/lib/store';

export default function AdminReportsPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const { theme } = useQuranStore();
  const router = useRouter();
  
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

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
      loadReports();
    }
  }, [token, user, filter]);

  const loadReports = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let data;
      if (filter === 'pending') {
        data = await adminApi.getPendingReports(token);
      } else {
        data = await adminApi.getAllReports(token, filter === 'resolved' ? 'resolved' : undefined);
      }
      setReports(data);
    } catch (err: any) {
      setError('Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReport = async (reportId: number, status: string, adminNotes: string) => {
    if (!token) return;
    
    try {
      await adminApi.updateReport(reportId, status, adminNotes, token);
      loadReports();
    } catch (err) {
      console.error('Error updating report:', err);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'reviewed':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
              <Flag className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl font-bold">Report Management</h1>
            </div>
          </div>
          <button
            onClick={loadReports}
            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className={`flex gap-2 mb-6 p-1 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {(['pending', 'all', 'resolved'] as const).map((f) => (
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

        {/* Reports List */}
        {!isLoading && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className={`text-center py-12 rounded-xl border ${getCardClasses()}`}>
                <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No reports found</p>
              </div>
            ) : (
              reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  theme={theme}
                  getCardClasses={getCardClasses}
                  getStatusColor={getStatusColor}
                  onUpdate={handleUpdateReport}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ReportCardProps {
  report: AdminReport;
  theme: string;
  getCardClasses: () => string;
  getStatusColor: (status: string) => string;
  onUpdate: (reportId: number, status: string, adminNotes: string) => void;
}

function ReportCard({ report, theme, getCardClasses, getStatusColor, onUpdate }: ReportCardProps) {
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = () => {
    onUpdate(report.id, 'resolved', adminNotes);
    setIsEditing(false);
  };

  const reportTypeLabels: Record<string, string> = {
    translation_error: 'Translation Error',
    audio_error: 'Audio Error',
    tafsir_error: 'Tafsir Error',
    other: 'Other Issue',
  };

  return (
    <div className={`p-6 rounded-xl border ${getCardClasses()}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`font-semibold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {report.username}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
              {report.status}
            </span>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(report.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="font-medium">Type:</span> {reportTypeLabels[report.report_type] || report.report_type}
          </p>
          <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="font-medium">Verse:</span> {report.verse_info}
          </p>
        </div>
      </div>

      <div className={`p-4 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
          {report.description}
        </p>
      </div>

      {/* Admin Notes */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Admin Notes
        </label>
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300'
              }`}
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Save & Resolve
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {report.admin_notes || 'No admin notes yet'}
            </p>
            {report.status === 'pending' && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {report.status === 'pending' && !isEditing && (
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate(report.id, 'resolved', adminNotes)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Resolve
          </button>
          <button
            onClick={() => onUpdate(report.id, 'rejected', adminNotes)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
