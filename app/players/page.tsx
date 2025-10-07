'use client';

import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  points: number;
  gamesWon: number;
  gamesLost: number;
}

export default function PlayersLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getPositionEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-8xl font-bold text-white mb-4 animate-pulse">
            🏆 LEADERBOARD 🏆
          </h1>
          <p className="text-3xl text-purple-200 mb-2">How Late Will Lucka Be?</p>
          <p className="text-xl text-purple-300">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </header>

        {players.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl text-white">No players yet...</p>
            <p className="text-2xl text-purple-200 mt-4">Be the first to place a bet!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`bg-white/20 backdrop-blur-lg rounded-2xl p-8 shadow-2xl transform transition-all hover:scale-105 ${
                  index === 0 ? 'border-4 border-yellow-400' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="text-6xl font-bold text-yellow-400">
                      {getPositionEmoji(index)}
                    </span>
                    <div>
                      <h2 className="text-5xl font-bold text-white">{player.name}</h2>
                      <p className="text-2xl text-purple-200 mt-2">
                        W: <span className="font-bold text-green-400">{player.gamesWon}</span>
                        {' '} | {' '}
                        L: <span className="font-bold text-red-400">{player.gamesLost}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-7xl font-bold text-yellow-400">{player.points}</p>
                    <p className="text-3xl text-purple-200">points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="text-center mt-12 text-purple-300 text-xl">
          <p>🎮 Auto-refreshing every 5 seconds</p>
        </footer>
      </div>
    </div>
  );
}
