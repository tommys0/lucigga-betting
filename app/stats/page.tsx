'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/ThemeProvider';
import {
  BarChart3,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Moon,
  Sun,
  ArrowLeft,
  Flame,
  History,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';

interface StatsData {
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

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    if (!session?.user?.name) return;

    try {
      const playerName = session.user.playerName || session.user.name;
      const response = await fetch(`/api/stats?playerName=${encodeURIComponent(playerName)}`);
      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "On time";
    if (minutes < 0) return `${Math.abs(minutes)} min early`;
    return `${minutes} min late`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-900 dark:text-white text-2xl">Loading...</p>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-900 dark:text-white text-2xl">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8 px-3 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-10 h-10 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
                    Your Statistics
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {statsData.player.name} • {statsData.player.points} points
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {/* Total Games */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Games</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {statsData.stats.totalGames}
            </p>
          </div>

          {/* Win Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Win Rate</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {Math.round(statsData.stats.winRate)}%
            </p>
          </div>

          {/* Total Points Earned */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Points Earned</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
              +{statsData.stats.totalPointsEarned}
            </p>
          </div>

          {/* Avg Accuracy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Accuracy</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
              ±{statsData.stats.avgAccuracy} min
            </p>
          </div>
        </div>

        {/* Current Streak & Best Prediction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Current Streak */}
          {statsData.stats.currentStreak.count > 0 && (
            <div className={`rounded-2xl p-6 border ${
              statsData.stats.currentStreak.type === 'win'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <Flame className={`w-8 h-8 ${
                  statsData.stats.currentStreak.type === 'win'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <div>
                  <h3 className={`text-lg font-bold ${
                    statsData.stats.currentStreak.type === 'win'
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    Current Streak
                  </h3>
                  <p className={`text-sm ${
                    statsData.stats.currentStreak.type === 'win'
                      ? 'text-green-600 dark:text-green-300'
                      : 'text-red-600 dark:text-red-300'
                  }`}>
                    {statsData.stats.currentStreak.count} {statsData.stats.currentStreak.type === 'win' ? 'wins' : 'losses'} in a row
                  </p>
                </div>
              </div>
              <p className={`text-4xl font-black ${
                statsData.stats.currentStreak.type === 'win'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {statsData.stats.currentStreak.count}
              </p>
            </div>
          )}

          {/* Best Prediction */}
          {statsData.stats.bestPrediction && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                    Best Prediction
                  </h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">
                    {formatDate(statsData.stats.bestPrediction.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-yellow-600 dark:text-yellow-400">
                  {statsData.stats.bestPrediction.difference === 0 ? 'Perfect!' : `±${statsData.stats.bestPrediction.difference} min`}
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                  (+{statsData.stats.bestPrediction.winnings} pts)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Games */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Recent Games
          </h2>
          {statsData.recentGames.length > 0 ? (
            <div className="space-y-3">
              {statsData.recentGames.map((game) => (
                <div
                  key={game.id}
                  className={`rounded-xl p-4 border ${
                    game.winnings > 0
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {game.winnings > 0 ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(game.gameDate)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Your Bet:</p>
                          {game.isWontComeBet ? (
                            <p className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Won't Come
                            </p>
                          ) : (
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatTime(game.prediction)}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Actual:</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {game.didntCome ? "Didn't come" : formatTime(game.actualTime || 0)}
                          </p>
                        </div>
                      </div>
                      {!game.isWontComeBet && game.difference !== null && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Accuracy: ±{game.difference} min
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${
                        game.winnings > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        +{game.winnings}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No games played yet
            </p>
          )}
        </div>

        {/* Monthly Performance */}
        {statsData.monthlyPerformance.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Monthly Performance
            </h2>
            <div className="space-y-3">
              {statsData.monthlyPerformance.map((month) => (
                <div
                  key={month.month}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">{month.month}</h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {month.games} games
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Wins</p>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {month.wins}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Win Rate</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(month.winRate)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Points</p>
                      <p className="font-bold text-purple-600 dark:text-purple-400">
                        +{month.points}
                      </p>
                    </div>
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
