'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '../../components/ThemeProvider';
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  Flame,
  Moon,
  Sun,
  ArrowLeft,
  User,
  BarChart3,
} from 'lucide-react';

interface PlayerStats {
  player: {
    name: string;
    points: number;
    gamesWon: number;
    gamesLost: number;
  };
  stats: {
    totalGames: number;
    gamesWon: number;
    gamesLost: number;
    winRate: number;
    totalPointsEarned: number;
    avgAccuracy: number;
    bestPrediction: {
      prediction: number;
      actualTime: number;
      difference: number;
      date: string;
      winnings: number;
    } | null;
    currentStreak: {
      type: 'win' | 'loss' | 'none';
      count: number;
    };
  };
  recentGames: Array<{
    id: string;
    prediction: number;
    actualTime: number | null;
    didntCome: boolean;
    isWontComeBet: boolean;
    winnings: number;
    difference: number | null;
    date: string;
    gameDate: string;
  }>;
  monthlyPerformance: Array<{
    month: string;
    games: number;
    points: number;
    wins: number;
    winRate: number;
  }>;
}

export default function PlayerProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const playerName = decodeURIComponent(params.name as string);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router, playerName]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/stats?playerName=${encodeURIComponent(playerName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch player statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Failed to load player statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-900 dark:text-white text-2xl">Loading...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-xl mb-4">
            {error || 'Player not found'}
          </p>
          <button
            onClick={() => router.push('/players')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Players
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.name === playerName;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8 px-3 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/players')}
                  className="w-10 h-10 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
                    {playerName}
                    {isOwnProfile && (
                      <span className="text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.stats.totalGames} games played • {stats.player.points} points
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="w-10 h-10 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Games</p>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.stats.totalGames}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
            </div>
            <p className="text-2xl font-black text-green-600 dark:text-green-400">
              {Math.round(stats.stats.winRate)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.stats.gamesWon}W - {stats.stats.gamesLost}L
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
            </div>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {stats.stats.totalPointsEarned}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Accuracy</p>
            </div>
            <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
              ±{stats.stats.avgAccuracy}s
            </p>
          </div>
        </div>

        {/* Current Streak & Best Prediction */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Current Streak */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Current Streak
              </h3>
            </div>
            {stats.stats.currentStreak.type !== 'none' ? (
              <div className="flex items-center gap-3">
                <p className={`text-4xl font-black ${
                  stats.stats.currentStreak.type === 'win'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {stats.stats.currentStreak.count}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {stats.stats.currentStreak.type === 'win' ? 'wins' : 'losses'} in a row
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No games played yet</p>
            )}
          </div>

          {/* Best Prediction */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Best Prediction
              </h3>
            </div>
            {stats.stats.bestPrediction ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-2xl font-black text-gray-900 dark:text-white">
                    {formatTime(stats.stats.bestPrediction.prediction)}
                  </p>
                  <span className="text-gray-400">→</span>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {formatTime(stats.stats.bestPrediction.actualTime)}
                  </p>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-semibold mb-1">
                  Only {stats.stats.bestPrediction.difference}s off! +{stats.stats.bestPrediction.winnings} pts
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(stats.stats.bestPrediction.date)}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No predictions yet</p>
            )}
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Recent Games
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentGames.length > 0 ? (
              stats.recentGames.map((game) => (
                <div key={game.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {game.didntCome ? (
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {game.isWontComeBet ? "Won't come" : formatTime(game.prediction)}
                          </p>
                          <span className="text-gray-400">→</span>
                          <p className="text-lg font-bold text-red-600 dark:text-red-400">
                            Didn't come
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatTime(game.prediction)}
                          </p>
                          <span className="text-gray-400">→</span>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatTime(game.actualTime || 0)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${
                        game.winnings > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {game.winnings > 0 ? '+' : ''}{game.winnings} pts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(game.gameDate)}
                      </span>
                      {game.difference !== null && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {game.difference}s off
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No games played yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Performance */}
        {stats.monthlyPerformance.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Monthly Performance
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.monthlyPerformance.map((month) => (
                <div key={month.month} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900 dark:text-white">{month.month}</p>
                    <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                      {month.points} pts
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{month.games} games</span>
                    <span>{month.wins}W - {month.games - month.wins}L</span>
                    <span className="font-semibold">{Math.round(month.winRate)}% win rate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
