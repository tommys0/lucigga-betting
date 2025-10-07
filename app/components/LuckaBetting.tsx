'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Bet {
  playerName: string;
  prediction: number;
  betAmount: number;
}

interface Player {
  id: string;
  name: string;
  points: number;
  gamesWon: number;
  gamesLost: number;
}

interface GameResult {
  playerName: string;
  prediction: number;
  betAmount: number;
  winnings: number;
  netChange: number;
  newPoints: number;
  difference: number;
  error?: string;
  currentPoints?: number;
}

export default function LuckaBetting() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bets, setBets] = useState<Bet[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [prediction, setPrediction] = useState(0);
  const [betAmount, setBetAmount] = useState(50);
  const [actualTime, setActualTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  };

  const getPlayerPoints = (name: string) => {
    const player = players.find(p => p.name === name);
    return player?.points ?? 1000; // Default 1000 for new players
  };

  const addBet = () => {
    if (!playerName.trim()) {
      alert('Please enter a player name');
      return;
    }
    const points = getPlayerPoints(playerName.trim());
    if (betAmount > points) {
      alert(`${playerName.trim()} only has ${points} points!`);
      return;
    }
    setBets([...bets, { playerName: playerName.trim(), prediction, betAmount }]);
    setPlayerName('');
    setPrediction(0);
    setBetAmount(50);
  };

  const removeBet = (index: number) => {
    setBets(bets.filter((_, i) => i !== index));
  };

  const handlePaste = () => {
    const lines = pasteInput.trim().split('\n');
    const newBets: Bet[] = [];

    lines.forEach(line => {
      const match = line.match(/([^:]+):\s*(-?\d+)\s*,\s*(\d+)/);
      if (match) {
        const [, name, pred, amount] = match;
        newBets.push({
          playerName: name.trim(),
          prediction: parseInt(pred),
          betAmount: parseInt(amount),
        });
      }
    });

    if (newBets.length > 0) {
      setBets([...bets, ...newBets]);
      setPasteInput('');
    } else {
      alert('Invalid format. Use: Name: minutes, amount (one per line)');
    }
  };

  const revealResults = async () => {
    if (actualTime === null) {
      alert('Please enter the actual time first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualTime, bets }),
      });

      const data = await response.json();
      setResults(data.results);
      setShowResults(true);
      await fetchPlayers(); // Refresh player data
    } catch (error) {
      console.error('Failed to process game:', error);
      alert('Failed to process game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return 'On time';
    if (minutes < 0) return `${Math.abs(minutes)} min early`;
    return `${minutes} min late`;
  };

  const resetGame = () => {
    setBets([]);
    setActualTime(null);
    setShowResults(false);
    setResults([]);
    fetchPlayers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 py-4 md:py-12 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 md:mb-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-6xl font-bold text-white mb-2 md:mb-4">
                ⏰ How Late Will Lucka Be? ⏰
              </h1>
              <p className="text-purple-200 text-base md:text-xl">
                Place your bets on Lucka's punctuality!
              </p>
            </div>
            <div className="flex flex-col gap-2 items-center md:items-end">
              {session && (
                <div className="text-center md:text-right mb-2">
                  <p className="text-white text-base md:text-lg">
                    👤 <span className="font-bold">{session.user.name}</span>
                  </p>
                  {session.user.role === 'admin' && (
                    <p className="text-yellow-400 text-xs md:text-sm">🔐 Admin</p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-center">
                {session?.user.role === 'admin' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
                  >
                    ⚙️ Admin
                  </button>
                )}
                <button
                  onClick={() => router.push('/players')}
                  className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                >
                  📺 TV
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="px-4 py-2 md:px-6 md:py-2 text-sm md:text-base bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition"
            >
              {showLeaderboard ? '🎲 Hide' : '🏆 Show'} Leaderboard
            </button>
          </div>
        </header>

        {showLeaderboard && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">🏆 Leaderboard</h2>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="bg-white/20 p-4 rounded-lg flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-yellow-400">#{index + 1}</span>
                    <div>
                      <p className="text-white font-bold text-xl">{player.name}</p>
                      <p className="text-purple-200 text-sm">
                        W: {player.gamesWon} | L: {player.gamesLost}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-400">{player.points} pts</p>
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-purple-200 text-center py-8">No players yet. Be the first!</p>
              )}
            </div>
          </div>
        )}

        {!showResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Left side - Add bets */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 shadow-2xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">📝 Place Bets</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white mb-2">Player Name</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addBet()}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-purple-200 border-2 border-white/30"
                    placeholder="Enter your name"
                  />
                  {playerName && (
                    <p className="text-sm text-purple-200 mt-1">
                      Current points: {getPlayerPoints(playerName)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white mb-2">
                    Prediction: <span className="font-bold text-yellow-400">{formatTime(prediction)}</span>
                  </label>
                  <input
                    type="range"
                    value={prediction}
                    onChange={(e) => setPrediction(parseInt(e.target.value))}
                    min="-15"
                    max="30"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-purple-200 mt-1">
                    <span>15 min early</span>
                    <span>On time</span>
                    <span>30 min late</span>
                  </div>
                </div>

                <div>
                  <label className="block text-white mb-2">Bet Amount: {betAmount} points</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 text-white border-2 border-white/30"
                    min="1"
                  />
                </div>

                <button
                  onClick={addBet}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg text-lg transition"
                >
                  ✅ Add Bet
                </button>
              </div>

              <div className="border-t border-white/30 pt-6">
                <h3 className="text-lg font-bold text-white mb-3">📋 Paste Multiple Bets</h3>
                <p className="text-sm text-purple-200 mb-2">Format: Name: minutes, amount</p>
                <p className="text-xs text-purple-300 mb-3">Example: Tommy: -5, 100</p>
                <textarea
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-purple-200 border-2 border-white/30 h-32"
                  placeholder="Tommy: -5, 100&#10;Sarah: 10, 50&#10;Mike: 0, 75"
                />
                <button
                  onClick={handlePaste}
                  className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                >
                  📥 Import Bets
                </button>
              </div>
            </div>

            {/* Right side - Current bets */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">
                🎲 Current Bets ({bets.length})
              </h2>

              {bets.length === 0 ? (
                <p className="text-purple-200 text-center py-12">No bets yet. Add one to get started!</p>
              ) : (
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {bets.map((bet, index) => (
                    <div
                      key={index}
                      className="bg-white/20 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="text-white font-bold">{bet.playerName}</p>
                        <p className="text-purple-200 text-sm">
                          {formatTime(bet.prediction)} • {bet.betAmount} pts
                        </p>
                      </div>
                      <button
                        onClick={() => removeBet(index)}
                        className="text-red-400 hover:text-red-300 font-bold text-xl"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {bets.length > 0 && (
                <div className="border-t border-white/30 pt-6 space-y-4">
                  <div>
                    <label className="block text-white mb-2 text-lg font-bold">
                      ⏱️ Actual Time: <span className="text-yellow-400">{actualTime !== null ? formatTime(actualTime) : 'Not set'}</span>
                    </label>
                    <input
                      type="number"
                      value={actualTime ?? ''}
                      onChange={(e) => setActualTime(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-3 rounded-lg bg-white/20 text-white border-2 border-white/30"
                      placeholder="Enter minutes (-15 to 30)"
                      min="-15"
                      max="30"
                    />
                    <p className="text-xs text-purple-200 mt-1">
                      Negative = early, Positive = late, 0 = on time
                    </p>
                  </div>

                  <button
                    onClick={revealResults}
                    disabled={actualTime === null || loading}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg text-xl transition"
                  >
                    {loading ? '⏳ Processing...' : '🎊 REVEAL RESULTS!'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              🎉 RESULTS 🎉
            </h2>

            <div className="bg-yellow-400 p-6 rounded-lg mb-8">
              <p className="text-center text-2xl font-bold text-gray-900">
                Lucka was: {formatTime(actualTime!)}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg ${
                    result.error
                      ? 'bg-gray-500/30 border-2 border-gray-400'
                      : result.winnings > 0
                      ? 'bg-green-500/30 border-2 border-green-400'
                      : 'bg-red-500/20 border-2 border-red-400'
                  }`}
                >
                  {result.error ? (
                    <div>
                      <p className="text-white font-bold text-xl">{result.playerName}</p>
                      <p className="text-red-300">❌ {result.error}</p>
                      <p className="text-purple-200 text-sm">Current points: {result.currentPoints}</p>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-bold text-xl">{result.playerName}</p>
                        <p className="text-purple-200">
                          Predicted: {formatTime(result.prediction)} • Bet: {result.betAmount} pts
                        </p>
                        <p className="text-sm text-purple-200">
                          Off by: {result.difference} minutes
                        </p>
                        <p className="text-sm font-bold text-yellow-400">
                          New balance: {result.newPoints} pts
                        </p>
                      </div>
                      <div className="text-right">
                        {result.winnings > 0 ? (
                          <p className="text-3xl font-bold text-green-300">
                            +{result.winnings} pts
                          </p>
                        ) : (
                          <p className="text-2xl font-bold text-red-300">
                            -{result.betAmount} pts
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white/20 p-6 rounded-lg mb-6">
              <h3 className="text-white font-bold text-xl mb-4">💰 Payout Rules:</h3>
              <ul className="text-purple-200 space-y-2">
                <li>🎯 Exact match: <span className="text-yellow-400 font-bold">10x</span></li>
                <li>🎲 1 minute off: <span className="text-yellow-400 font-bold">5x</span></li>
                <li>🎪 2 minutes off: <span className="text-yellow-400 font-bold">3x</span></li>
                <li>🎨 3 minutes off: <span className="text-yellow-400 font-bold">2x</span></li>
                <li>🎭 4-5 minutes off: <span className="text-yellow-400 font-bold">1.5x</span></li>
                <li>❌ More than 5 minutes off: <span className="text-red-400 font-bold">Loss</span></li>
              </ul>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg text-xl transition"
            >
              🔄 New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
