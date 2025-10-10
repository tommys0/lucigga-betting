'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/ThemeProvider';
import {
  TrendingUp,
  Trophy,
  Target,
  Moon,
  Sun,
  ArrowLeft,
  Clock,
  Users,
  BarChart3,
  Award,
  TrendingDown,
  Activity,
  Percent,
} from 'lucide-react';

interface GlobalStats {
  totalGames: number;
  totalBets: number;
  totalPlayers: number;
  averageActualTime: number | null;
  averagePrediction: number | null;
  didntComeCount: number;
  didntComePercentage: number;
  mostAccuratePlayer: {
    name: string;
    averageAccuracy: number;
    totalBets: number;
  } | null;
  mostCommonPrediction: number | null;
  predictionDistribution: Array<{
    label: string;
    count: number;
  }>;
  actualTimeDistribution: Array<{
    label: string;
    count: number;
  }>;
  averagePointsPerGame: number;
}

export default function GlobalStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchGlobalStats();
    }
  }, [status, router]);

  const fetchGlobalStats = async () => {
    try {
      const response = await fetch('/api/stats/global');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '0 min (On time)';
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const timeStr = secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins} min`;
    if (seconds < 0) return `${timeStr} early`;
    return `${timeStr} late`;
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-900 dark:text-white text-2xl">Loading...</p>
      </div>
    );
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8 px-3 md:px-6">
        <div className="max-w-7xl mx-auto">
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
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400" />
                    Global Statistics
                  </h1>
                </div>
              </div>
            </div>
          </header>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              No data yet
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Global statistics will appear once games are completed
            </p>
          </div>
        </div>
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
                    <Activity className="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400" />
                    Global Statistics
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aggregated data across all games
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
              {stats.totalGames}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Bets</p>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.totalBets}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Players</p>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.totalPlayers}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Points/Game</p>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.averagePointsPerGame}
            </p>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Average Actual Time */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Average Arrival Time
              </h3>
            </div>
            {stats.averageActualTime !== null ? (
              <div>
                <p className="text-4xl font-black text-orange-600 dark:text-orange-400 mb-2">
                  {formatTime(stats.averageActualTime)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  On average, Lucka is{' '}
                  {stats.averageActualTime > 0
                    ? `${Math.round(stats.averageActualTime)} minutes late`
                    : stats.averageActualTime < 0
                      ? `${Math.round(Math.abs(stats.averageActualTime))} minutes early`
                      : 'exactly on time'}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No data available</p>
            )}
          </div>

          {/* Average Prediction */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Average Player Guess
              </h3>
            </div>
            {stats.averagePrediction !== null ? (
              <div>
                <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-2">
                  {formatTime(stats.averagePrediction)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Players predict she'll be{' '}
                  {stats.averagePrediction > 0
                    ? `${Math.round(stats.averagePrediction)} minutes late`
                    : stats.averagePrediction < 0
                      ? `${Math.round(Math.abs(stats.averagePrediction))} minutes early`
                      : 'exactly on time'}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No data available</p>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Didn't Come Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Didn't Come
              </h3>
            </div>
            <p className="text-3xl font-black text-red-600 dark:text-red-400 mb-1">
              {stats.didntComePercentage}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.didntComeCount} out of {stats.totalGames} games
            </p>
          </div>

          {/* Most Common Prediction */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Most Common Guess
              </h3>
            </div>
            {stats.mostCommonPrediction !== null ? (
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
                {formatTime(stats.mostCommonPrediction)}
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">N/A</p>
            )}
          </div>

          {/* Most Accurate Player */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Most Accurate
              </h3>
            </div>
            {stats.mostAccuratePlayer ? (
              <div>
                <p className="text-xl font-black text-yellow-600 dark:text-yellow-400 mb-1">
                  {stats.mostAccuratePlayer.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ±{stats.mostAccuratePlayer.averageAccuracy} min avg
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {stats.mostAccuratePlayer.totalBets} bets
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">Not enough data</p>
            )}
          </div>
        </div>

        {/* Distributions */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Prediction Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Player Predictions Distribution
              </h3>
            </div>
            <div className="space-y-3">
              {stats.predictionDistribution.map((range, index) => {
                const maxCount = Math.max(...stats.predictionDistribution.map((r) => r.count));
                const percentage = (range.count / maxCount) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{range.label}</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {range.count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actual Time Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Actual Arrival Distribution
              </h3>
            </div>
            <div className="space-y-3">
              {stats.actualTimeDistribution.map((range, index) => {
                const maxCount = Math.max(...stats.actualTimeDistribution.map((r) => r.count));
                const percentage = (range.count / maxCount) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{range.label}</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {range.count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
