'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from '../components/ThemeProvider';
import {
  Shield,
  Moon,
  Sun,
  BarChart3,
  Target,
  Users,
  Circle,
  ClipboardList,
  Dices,
  Trophy,
  Sparkles,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalUsers: number;
    totalPlayers: number;
    totalGames: number;
    activePlayersToday: number;
  };
  todayGames: any[];
  activePlayers: any[];
  players: any[];
  recentBets: any[];
  todaysBets: any[];
  bettingStatus: {
    isOpen: boolean;
    totalBets: number;
    avgPrediction: number;
  };
}

interface User {
  id: string;
  username: string;
  role: string;
  playerId: string | null;
  player: {
    name: string;
    points: number;
  } | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'todaysBets' | 'users'>('overview');

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    playerName: '',
  });

  const [passwordUpdate, setPasswordUpdate] = useState({
    userId: '',
    password: '',
  });
  const [creatingTripGame, setCreatingTripGame] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchDashboardData();
      fetchUsers();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setNewUser({ username: '', password: '', role: 'user', playerName: '' });
        setShowCreateForm(false);
        fetchUsers();
        fetchDashboardData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      alert('Failed to create user');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordUpdate),
      });

      if (response.ok) {
        setPasswordUpdate({ userId: '', password: '' });
        setShowPasswordForm(null);
        alert('Password updated successfully');
      } else {
        alert('Failed to update password');
      }
    } catch (error) {
      alert('Failed to update password');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
        fetchDashboardData();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "On time";
    if (minutes < 0) return `${Math.abs(minutes)} min early`;
    return `${minutes} min late`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCreateTripGame = async () => {
    if (!confirm('Create a new trip mode game? This allows betting anytime until results are revealed.')) {
      return;
    }

    setCreatingTripGame(true);
    try {
      const response = await fetch('/api/games/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'trip' }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Trip mode game created successfully! Betting is now open anytime.');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to create trip game');
      }
    } catch (error) {
      alert('Failed to create trip game');
    } finally {
      setCreatingTripGame(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-900 dark:text-white text-2xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 md:gap-3">
                <Shield className="w-6 h-6 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Monitor betting activity and manage users
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm md:text-base"
              >
                <span className="hidden md:inline">← Back</span>
                <span className="md:hidden">←</span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm md:text-base"
              >
                <span className="hidden md:inline">Sign Out</span>
                <span className="md:hidden">Exit</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 md:gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 md:px-6 py-3 font-semibold transition-colors whitespace-nowrap flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === 'overview'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('todaysBets')}
              className={`px-3 md:px-6 py-3 font-semibold transition-colors whitespace-nowrap flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === 'todaysBets'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Today's Bets</span>
              <span className="sm:hidden">Bets</span>
              {dashboardData && <span className="text-xs">({dashboardData.todaysBets.length})</span>}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 md:px-6 py-3 font-semibold transition-colors whitespace-nowrap flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === 'users'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
              <span className="text-xs">({users.length})</span>
            </button>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.stats.totalUsers}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Players</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.stats.totalPlayers}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Active Today</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {dashboardData.stats.activePlayersToday}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Games</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.stats.totalGames}
                </p>
              </div>
            </div>

            {/* Active Players Today */}
            {dashboardData.activePlayers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Active Players Today
                </h2>
                <div className="space-y-3">
                  {dashboardData.activePlayers.map((player) => (
                    <div
                      key={player.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {player.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {player.bets.length} bet{player.bets.length !== 1 ? 's' : ''} placed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {player.points} pts
                        </p>
                        {player.bets.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Last: {formatDate(player.bets[0].createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Bets */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Recent Bets
              </h2>
              {dashboardData.recentBets.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {bet.player.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Predicted: {formatTime(bet.prediction)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(bet.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600 dark:text-orange-400">
                            {bet.betAmount} pts
                          </p>
                          {bet.winnings > 0 && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Won: +{bet.winnings}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No bets placed yet
                </p>
              )}
            </div>

            {/* All Players */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                All Players
              </h2>
              <div className="space-y-2">
                {dashboardData.players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex justify-between items-center py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 dark:text-gray-400 font-mono text-sm w-8">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {player.name}
                          {player.user && player.user.role === 'admin' && (
                            <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          W: {player.gamesWon} | L: {player.gamesLost}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      {player.points} pts
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Today's Bets Tab */}
        {activeTab === 'todaysBets' && dashboardData && (
          <div className="space-y-6">
            {/* Betting Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Current Betting Session
                </h2>
                {dashboardData.bettingStatus.isOpen ? (
                  <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-bold flex items-center gap-2">
                    <Circle className="w-4 h-4 fill-green-500 text-green-500" />
                    OPEN
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-bold flex items-center gap-2">
                    <Circle className="w-4 h-4 fill-red-500 text-red-500" />
                    CLOSED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Bets</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.bettingStatus.totalBets}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Avg Prediction</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatTime(dashboardData.bettingStatus.avgPrediction)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Betting Window</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    6 PM - 10:25 AM (Tue/Fri)<br />
                    6 PM - 8:25 AM (Other)
                  </p>
                </div>
              </div>

              {/* Trip Mode Button */}
              <div className="mb-6">
                <button
                  onClick={handleCreateTripGame}
                  disabled={creatingTripGame}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-6 h-6" />
                  <span>{creatingTripGame ? 'Creating...' : 'Create Trip Mode Game'}</span>
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                  Trip mode allows betting anytime until results are revealed
                </p>
              </div>
            </div>

            {/* All Bets Today */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                All Predictions
              </h2>
              {dashboardData.todaysBets.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.todaysBets.map((bet: any) => (
                    <div
                      key={bet.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-gray-900 dark:text-white text-lg">
                              {bet.player.name}
                            </p>
                            {bet.player.user && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                                {bet.player.user.username}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Placed: {new Date(bet.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-black text-blue-600 dark:text-blue-400">
                            {formatTime(bet.prediction)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            prediction
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Dices className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No bets placed yet for this session
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Management
              </h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
              >
                {showCreateForm ? 'Cancel' : '+ Create User'}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateUser} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                      Username
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                      Player Name (optional)
                    </label>
                    <input
                      type="text"
                      value={newUser.playerName}
                      onChange={(e) => setNewUser({ ...newUser, playerName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Link to player"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Create User
                </button>
              </form>
            )}

            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="bg-gray-50 dark:bg-gray-700 p-5 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {user.username}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      {user.player && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Player: <span className="font-semibold">{user.player.name}</span> ({user.player.points} pts)
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowPasswordForm(user.id);
                          setPasswordUpdate({ userId: user.id, password: '' });
                        }}
                        className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Change Password
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {showPasswordForm === user.id && (
                    <form onSubmit={handleUpdatePassword} className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg space-y-3">
                      <input
                        type="password"
                        value={passwordUpdate.password}
                        onChange={(e) => setPasswordUpdate({ ...passwordUpdate, password: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        placeholder="New password"
                        required
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasswordForm(null)}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
