'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/ThemeProvider';
import {
  Calendar,
  Trophy,
  Target,
  Moon,
  Sun,
  ArrowLeft,
  Clock,
  Award,
  Sparkles,
  Medal,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Bet {
  id: string;
  playerName: string;
  prediction: number;
  isWontComeBet: boolean;
  winnings: number;
  difference: number | null;
  createdAt: string;
}

interface Game {
  id: string;
  actualTime: number | null;
  didntCome: boolean;
  gameType: string;
  playedAt: string;
  bets: Bet[];
  totalBets: number;
  winner: string | null;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchGameHistory();
    }
  }, [status, router]);

  const fetchGameHistory = async () => {
    try {
      const response = await fetch('/api/games/history');
      const data = await response.json();
      setGames(data.games);
    } catch (error) {
      console.error('Failed to fetch game history:', error);
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleGameExpansion = (gameId: string) => {
    setExpandedGameId(expandedGameId === gameId ? null : gameId);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Medal className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    return <span className="text-sm font-bold text-gray-600 dark:text-gray-400">#{index + 1}</span>;
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-900 dark:text-white text-2xl">Loading...</p>
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
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-purple-600 dark:text-purple-400" />
                    Game History
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {games.length} games played • Click to expand
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

        {/* Games List */}
        <div className="space-y-4">
          {games.length > 0 ? (
            games.map((game) => {
              const isExpanded = expandedGameId === game.id;
              const topBets = game.bets.slice(0, 3);

              return (
                <div
                  key={game.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                >
                  {/* Game Summary (Always Visible) */}
                  <button
                    onClick={() => toggleGameExpansion(game.id)}
                    className="w-full p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <div className="text-left">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatDate(game.playedAt)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {game.gameType === 'trip' ? 'Trip Mode' : 'Normal Game'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Result */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Result:</span>
                        {game.didntCome ? (
                          <span className="text-base font-bold text-red-600 dark:text-red-400">
                            Didn't come
                          </span>
                        ) : (
                          <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                            {formatTime(game.actualTime || 0)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {game.totalBets} {game.totalBets === 1 ? 'bet' : 'bets'}
                        </span>
                      </div>
                    </div>

                    {/* Winner Preview */}
                    {game.winner && (
                      <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                        <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          Winner: <span className="font-bold">{game.winner}</span>
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {/* Full Date */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatFullDate(game.playedAt)}
                        </p>
                      </div>

                      {/* All Bets */}
                      <div className="p-4 divide-y divide-gray-200 dark:divide-gray-700">
                        <div className="pb-3 mb-3">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            All Bets & Results
                          </h3>
                        </div>

                        {game.bets.length > 0 ? (
                          <div className="space-y-3 pt-3">
                            {game.bets.map((bet, index) => (
                              <div
                                key={bet.id}
                                className={`p-3 rounded-xl transition-colors ${
                                  bet.winnings > 0
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 flex justify-center">
                                      {getRankIcon(index)}
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                      {bet.playerName}
                                      {session?.user?.name === bet.playerName && (
                                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                          You
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <p
                                    className={`text-lg font-black ${
                                      bet.winnings > 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    +{bet.winnings} pts
                                  </p>
                                </div>

                                <div className="flex items-center justify-between text-sm ml-8">
                                  <div className="flex items-center gap-2">
                                    {bet.isWontComeBet ? (
                                      <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Won't Come
                                      </span>
                                    ) : (
                                      <>
                                        <span className="text-gray-600 dark:text-gray-400">
                                          Bet:
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {formatTime(bet.prediction)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {bet.difference !== null && !bet.isWontComeBet && (
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <Target className="w-3 h-3" />
                                      <span>
                                        {bet.difference === 0
                                          ? 'Perfect!'
                                          : `±${bet.difference} min`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-gray-600 dark:text-gray-400">No bets placed</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No games yet
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Game history will appear here once games are completed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
