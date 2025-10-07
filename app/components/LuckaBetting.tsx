"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";

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
  const { theme, toggleTheme } = useTheme();
  const [myBet, setMyBet] = useState<Bet | null>(null);
  const [prediction, setPrediction] = useState(0);
  const [betAmount, setBetAmount] = useState(50);
  const [actualTime, setActualTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);

  // Check if betting is open (midnight to 8:20 AM)
  const isBettingOpen = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours >= 0 && (hours < 8 || (hours === 8 && minutes < 20));
  };

  const [bettingOpen, setBettingOpen] = useState(isBettingOpen());

  // Update betting status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setBettingOpen(isBettingOpen());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (session?.user?.playerName) {
      const player = players.find((p) => p.name === session.user.playerName);
      if (player) {
        setMyPlayer(player);
      }
    } else if (session?.user?.name && !myPlayer) {
      createPlayerForUser();
    }
  }, [session, players, myPlayer]);

  const createPlayerForUser = async () => {
    if (!session?.user?.name) return;

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: session.user.name }),
      });

      const player = await response.json();
      setMyPlayer(player);
      fetchPlayers();
    } catch (error) {
      console.error("Failed to create player:", error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch("/api/players");
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error("Failed to fetch players:", error);
    }
  };

  const placeBet = () => {
    if (!myPlayer) {
      alert("Please wait, setting up your player profile...");
      return;
    }

    if (!bettingOpen) {
      alert(
        "Betting is closed! You can only place bets between midnight and 8:20 AM.",
      );
      return;
    }

    if (betAmount > myPlayer.points) {
      alert(`You only have ${myPlayer.points} points!`);
      return;
    }

    setMyBet({
      playerName: myPlayer.name,
      prediction,
      betAmount,
    });
  };

  const removeBet = () => {
    setMyBet(null);
  };

  const revealResults = async () => {
    if (actualTime === null) {
      alert("Please enter the actual time first");
      return;
    }

    if (!myBet) {
      alert("No bets placed yet");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualTime, bets: [myBet] }),
      });

      const data = await response.json();
      setResults(data.results);
      setShowResults(true);
      await fetchPlayers();
    } catch (error) {
      console.error("Failed to process game:", error);
      alert("Failed to process game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "On time";
    if (minutes < 0) return `${Math.abs(minutes)} min early`;
    return `${minutes} min late`;
  };

  const resetGame = () => {
    setMyBet(null);
    setActualTime(null);
    setShowResults(false);
    setResults([]);
    setPrediction(0);
    setBetAmount(50);
    fetchPlayers();
  };

  const getTimeUntilBettingOpens = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours >= 8) {
      const hoursUntilMidnight = 24 - hours;
      return `${hoursUntilMidnight} hours`;
    }
    return "Soon";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8 px-3 md:px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 md:mb-8">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                <span className="text-4xl">⏰</span>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Lucka's Arrival
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    Will she be on time?
                  </p>
                </div>
              </div>
            </div>

            {/* User Info Card */}
            {session && (
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-lg text-white font-semibold">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-semibold text-sm">
                        {session.user.name}
                      </p>
                      {myPlayer && (
                        <p className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {myPlayer.points} pts
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleTheme}
                    className="w-10 h-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors shadow-sm"
                    title="Toggle theme"
                  >
                    {theme === 'light' ? '🌙' : '☀️'}
                  </button>
                  {session?.user.role === "admin" && (
                    <button
                      onClick={() => router.push("/admin")}
                      className="w-10 h-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors shadow-sm"
                      title="Admin"
                    >
                      ⚙️
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/players")}
                    className="w-10 h-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors shadow-sm"
                    title="TV Mode"
                  >
                    📺
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-10 h-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors shadow-sm"
                    title="Sign Out"
                  >
                    🚪
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Betting Status Banner */}
          <div className="mb-4">
            {bettingOpen ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800 shadow-sm">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🟢</span>
                  <p className="text-green-700 dark:text-green-400 text-base md:text-lg font-semibold">
                    Betting is OPEN until 8:20 AM
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800 shadow-sm">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔴</span>
                    <p className="text-red-700 dark:text-red-400 text-base md:text-lg font-semibold">
                      Betting is CLOSED
                    </p>
                  </div>
                  <p className="text-red-600 dark:text-red-500 text-sm">
                    Opens at midnight (in {getTimeUntilBettingOpens()})
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold text-white transition-colors shadow-sm"
            >
              <span className="text-xl">{showLeaderboard ? "🎲" : "🏆"}</span>
              <span>{showLeaderboard ? "Hide" : "Show"} Leaderboard</span>
            </button>
          </div>
        </header>

        {showLeaderboard && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
              <span className="text-3xl">🏆</span>
              Leaderboard
            </h2>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`rounded-xl p-4 md:p-5 transition-colors ${
                    player.id === myPlayer?.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600"
                      : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold ${
                        index === 0 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                        index === 1 ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300" :
                        index === 2 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" :
                        "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-lg"
                      }`}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-bold text-lg md:text-xl flex items-center gap-2">
                          {player.name}
                          {player.id === myPlayer?.id && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">You</span>
                          )}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-3">
                          <span>✅ {player.gamesWon}</span>
                          <span>❌ {player.gamesLost}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {player.points}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">points</p>
                    </div>
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-2">🎮</p>
                  <p className="text-gray-600 dark:text-gray-400">No players yet. Be the first!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!showResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Left side - Place your bet */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center text-2xl">
                  🎯
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Place Your Bet
                </h2>
              </div>

              {!myPlayer ? (
                <div className="text-center py-12">
                  <div className="animate-spin text-5xl mb-4">⚙️</div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Setting up your profile...
                  </p>
                </div>
              ) : myBet ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-3xl">✅</span>
                      <h3 className="text-green-700 dark:text-green-400 font-bold text-xl">
                        Bet Placed!
                      </h3>
                    </div>
                    <div className="space-y-3 bg-white dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Player</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{myBet.playerName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Prediction</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{formatTime(myBet.prediction)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Bet Amount</span>
                        <span className="text-gray-900 dark:text-white font-bold">{myBet.betAmount} pts</span>
                      </div>
                    </div>
                    <button
                      onClick={removeBet}
                      className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <span>❌</span>
                      <span>Remove Bet</span>
                    </button>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
                    <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                      {bettingOpen
                        ? "⏳ Waiting for Lucka to arrive..."
                        : "🔒 Betting closed. Waiting for results..."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {!bettingOpen && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                      <p className="text-red-700 dark:text-red-400 text-sm">
                        🔒 Betting is closed! Come back between midnight and 8:20 AM.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-sm">
                      Your Prediction
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <input
                        type="range"
                        min="-30"
                        max="120"
                        value={prediction}
                        onChange={(e) => setPrediction(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        disabled={!bettingOpen}
                      />
                      <div className="mt-4 text-center">
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                          {formatTime(prediction)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-sm">
                      Bet Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) =>
                          setBetAmount(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-4 py-4 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-lg font-semibold"
                        placeholder="Enter amount"
                        min="10"
                        max={myPlayer.points}
                        disabled={!bettingOpen}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                        / {myPlayer.points} pts
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={placeBet}
                    disabled={!bettingOpen || betAmount > myPlayer.points}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-bold rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="text-2xl">🎲</span>
                    <span>Place Bet</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right side - Admin reveal results */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-600 dark:bg-orange-500 rounded-xl flex items-center justify-center text-2xl">
                  🎊
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Reveal Results
                </h2>
              </div>

              {session?.user?.role === "admin" ? (
                <div className="space-y-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
                    <p className="text-yellow-700 dark:text-yellow-400 text-sm flex items-center justify-center gap-2">
                      <span>👑</span>
                      <span>Admin only: Enter actual time to reveal results</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-sm">
                      Actual Arrival Time
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <input
                        type="range"
                        min="-30"
                        max="120"
                        value={actualTime ?? 0}
                        onChange={(e) => setActualTime(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                      <div className="mt-4 text-center">
                        <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                          {actualTime !== null ? formatTime(actualTime) : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={revealResults}
                    disabled={loading || !myBet}
                    className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-bold rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin text-2xl">⏳</span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">🎊</span>
                        <span>Reveal Results</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 animate-bounce">⏳</div>
                  <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                    Waiting for results...
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Admin will reveal when Lucka arrives!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl px-6 py-4 mb-4">
                <span className="text-4xl">🎊</span>
                <div className="text-left">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Lucka arrived</p>
                  <p className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {formatTime(actualTime!)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-5 md:p-6 transition-colors ${
                    result.netChange > 0
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                          result.netChange > 0 ? "bg-green-200 dark:bg-green-800" : "bg-red-200 dark:bg-red-800"
                        }`}>
                          {result.netChange > 0 ? "🎉" : "😢"}
                        </div>
                        <p className="text-gray-900 dark:text-white font-bold text-xl md:text-2xl">
                          {result.playerName}
                        </p>
                      </div>
                      <div className="space-y-1 ml-13">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Predicted: <span className="font-semibold text-gray-900 dark:text-white">{formatTime(result.prediction)}</span>
                          <span className="text-gray-500 dark:text-gray-500"> (off by {Math.abs(result.difference)} min)</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Bet: <span className="font-semibold text-gray-900 dark:text-white">{result.betAmount} pts</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      {result.error ? (
                        <p className="text-red-600 dark:text-red-400 text-lg">
                          {result.error}
                        </p>
                      ) : (
                        <>
                          <p
                            className={`text-3xl md:text-4xl font-bold mb-1 ${
                              result.netChange > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {result.netChange > 0 ? "+" : ""}
                            {result.netChange}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                            Won: {result.winnings} pts
                          </p>
                          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-3 py-1 border border-gray-200 dark:border-gray-600">
                            <span className="text-blue-600 dark:text-blue-400 text-lg font-bold">
                              {result.newPoints}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">pts</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={resetGame}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🔄</span>
              <span>New Game</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
