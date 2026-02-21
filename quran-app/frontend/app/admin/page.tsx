'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  MessageSquare,
  Flag,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { adminApi, AdminStats } from '@/lib/api';
import useQuranStore from '@/lib/store';

export default function AdminDashboardPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const { theme } = useQuranStore();
  const router = useRouter();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    // Check admin status from user object
    if (user && !user.is_admin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (token && user?.is_admin) {
      loadStats();
    }
  }, [token, user]);

  const loadStats = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await adminApi.getStats(token);
      setStats(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to load admin statistics');
      }
      console.error('Error loading stats:', err);
    } finally {
      setIsLoading(false);
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage comments, reports, and monitor platform activity
          </p>
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

        {/* Stats Grid */}
        {!isLoading && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Pending Comments */}
              <Link href="/admin/comments">
                <div className={`p-6 rounded-xl border ${getCardClasses()} hover:shadow-lg transition-shadow cursor-pointer`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    {stats.pending_comments > 0 && (
                      <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                        {stats.pending_comments}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Pending Comments</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Awaiting approval
                  </p>
                </div>
              </Link>

              {/* Pending Reports */}
              <Link href="/admin/reports">
                <div className={`p-6 rounded-xl border ${getCardClasses()} hover:shadow-lg transition-shadow cursor-pointer`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'}`}>
                      <Flag className="h-6 w-6 text-red-600" />
                    </div>
                    {stats.pending_reports > 0 && (
                      <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                        {stats.pending_reports}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Pending Reports</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Need review
                  </p>
                </div>
              </Link>

              {/* Total Users */}
              <Link href="/admin/users">
                <div className={`p-6 rounded-xl border ${getCardClasses()} hover:shadow-lg transition-shadow cursor-pointer`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    {stats.blocked_users > 0 && (
                      <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full">
                        {stats.blocked_users} blocked
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Total Users</h3>
                  <p className="text-2xl font-bold text-emerald-600">{stats.total_users}</p>
                </div>
              </Link>

              {/* Total Comments */}
              <div className={`p-6 rounded-xl border ${getCardClasses()}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'}`}>
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1">Total Comments</h3>
                <p className="text-2xl font-bold text-emerald-600">{stats.total_comments}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`p-6 rounded-xl border ${getCardClasses()} mb-8`}>
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/admin/comments"
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span>Moderate Comments</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>

                <Link
                  href="/admin/reports"
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span>Review Reports</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>

                <Link
                  href="/admin/users"
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Manage Users</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className={`p-6 rounded-xl border ${getCardClasses()}`}>
              <h2 className="text-xl font-bold mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Total Reports</span>
                  <span className="font-semibold">{stats.total_reports}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pending Items</span>
                  <span className="font-semibold text-red-600">
                    {stats.pending_comments + stats.pending_reports}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
