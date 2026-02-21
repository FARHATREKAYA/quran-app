'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { adminApi, AdminUser } from '@/lib/api';
import { 
  Shield, 
  ArrowLeft, 
  Users, 
  Search,
  Ban,
  CheckCircle,
  Trash2,
  RefreshCw,
  AlertCircle,
  UserX,
  UserCheck
} from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin/users');
      return;
    }
    
    if (user && !user.is_admin) {
      router.push('/');
      return;
    }

    if (token && user?.is_admin) {
      fetchUsers();
    }
  }, [isAuthenticated, user, token, router]);

  const fetchUsers = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params: { search?: string; is_active?: boolean } = {};
      if (searchQuery) params.search = searchQuery;
      if (filter === 'active') params.is_active = true;
      if (filter === 'blocked') params.is_active = false;
      
      const data = await adminApi.getUsers(token, params);
      setUsers(data);
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: number) => {
    if (!token || !confirm('Are you sure you want to block this user? They will not be able to log in.')) return;
    
    try {
      setActionInProgress(userId);
      await adminApi.blockUser(userId, token);
      await fetchUsers();
    } catch (err) {
      setError('Failed to block user. Please try again.');
      console.error('Error blocking user:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnblockUser = async (userId: number) => {
    if (!token) return;
    
    try {
      setActionInProgress(userId);
      await adminApi.unblockUser(userId, token);
      await fetchUsers();
    } catch (err) {
      setError('Failed to unblock user. Please try again.');
      console.error('Error unblocking user:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!token || !confirm(`WARNING: This will permanently delete user "${username}" and all their data (comments, reports, etc.). This action cannot be undone. Are you sure?`)) return;
    
    try {
      setActionInProgress(userId);
      await adminApi.deleteUser(userId, token);
      await fetchUsers();
    } catch (err) {
      setError('Failed to delete user. Please try again.');
      console.error('Error deleting user:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAuthenticated || (user && !user.is_admin)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as 'all' | 'active' | 'blocked');
              fetchUsers();
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Users className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No users found</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {searchQuery ? 'Try adjusting your search criteria' : 'No users in the system yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {userData.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {userData.username}
                            </div>
                            {userData.email && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {userData.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userData.is_admin ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Admin
                          </span>
                        ) : userData.is_guest ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Guest
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userData.is_active ? (
                          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                            <Ban className="h-4 w-4" />
                            Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(userData.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(userData.last_login)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!userData.is_admin && (
                          <div className="flex items-center justify-end gap-2">
                            {userData.is_active ? (
                              <button
                                onClick={() => handleBlockUser(userData.id)}
                                disabled={actionInProgress === userData.id}
                                className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                title="Block User"
                              >
                                {actionInProgress === userData.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserX className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnblockUser(userData.id)}
                                disabled={actionInProgress === userData.id}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Unblock User"
                              >
                                {actionInProgress === userData.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(userData.id, userData.username)}
                              disabled={actionInProgress === userData.id}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete User"
                            >
                              {actionInProgress === userData.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
