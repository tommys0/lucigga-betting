"use client";

import { useState, useEffect } from "react";

interface Player {
  id: string;
  name: string;
  points: number;
  gamesWon: number;
  gamesLost: number;
}

export default function PlayersLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players");
      const data = await res.json();
      setPlayers(data);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Failed to fetch players", e);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // ensures client-only rendering for Date

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case 1:
        return "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300";
      case 2:
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Players Leaderboard
          </h1>
          {mounted && lastUpdate && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </header>

        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400">
              No players yet.
            </p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">
              Be the first to place a bet!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`flex justify-between items-center p-4 md:p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors ${player.id === players[0]?.id ? "border-2 border-blue-500" : ""} ${getRankStyle(index)}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold`}
                  >
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : `#${index + 1}`}
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-bold text-lg md:text-xl">
                      {player.name}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm flex gap-2">
                      <span>✅ {player.gamesWon}</span>
                      <span>❌ {player.gamesLost}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {player.points}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    points
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
