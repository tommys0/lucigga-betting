'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/ThemeProvider';
import {
  Users,
  Trophy,
  Target,
  Moon,
  Sun,
  ArrowLeft,
  Medal,
  ChevronRight,
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  points: number;
  gamesWon: number;
  gamesLost: number;
  totalBet: number;
  createdAt: string;
}

export default function PlayersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPlayers();
    }
  }, [status, router]);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWinRate = (player: Player) => {
    const totalGames = player.gamesWon + player.gamesLost;
    if (totalGames === 0) return 0;
    return Math.round((player.gamesWon / totalGames) * 100);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Medal className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-orange-600 dark:text-orange-400" />;
    return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{index + 1}</span>;
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
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
                    All Players
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {players.length} players • Click to view profile
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

        {/* Top 3 Podium */}
        {players.length >= 3 && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-yellow-50 via-gray-50 to-orange-50 dark:from-yellow-900/20 dark:via-gray-800 dark:to-orange-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                Top 3 Players
              </h2>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {players.slice(0, 3).map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => router.push(`/players/${encodeURIComponent(player.name)}`)}
                    className={`text-center p-4 rounded-xl transition-all hover:scale-105 ${
                      index === 0
                        ? 'bg-yellow-100 dark:bg-yellow-900/40 border-2 border-yellow-400'
                        : index === 1
                          ? 'bg-gray-200 dark:bg-gray-600 border-2 border-gray-400'
                          : 'bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-400'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {getRankIcon(index)}
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {player.name}
                    </p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {player.points}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">points</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* All Players List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              All Players
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {players.map((player, index) => (
              <button
                key={player.id}
                onClick={() => router.push(`/players/${encodeURIComponent(player.name)}`)}
                className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank */}
                  <div className="w-12 flex justify-center">
                    {getRankIcon(index)}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {player.name}
                      </p>
                      {session?.user?.name === player.name && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {player.gamesWon}W - {player.gamesLost}L
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {calculateWinRate(player)}% win rate
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {player.points}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">pts</p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {players.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              No players yet
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Be the first to join!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
