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

interface TodaysBet {
  id: string;
  prediction: number;
  createdAt: string;
  player: {
    name: string;
    points: number;
  };
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
  const [todaysBets, setTodaysBets] = useState<TodaysBet[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  // Check if betting is open (6 PM to 8:20 AM next day)
  const isBettingOpen = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Open from 6 PM (18:00) onwards OR before 8:20 AM
    return hours >= 18 || hours < 8 || (hours === 8 && minutes < 20);
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
      fetchTodaysBet(session.user.playerName);
    } else if (session?.user?.name && myPlayer) {
      fetchTodaysBet(session.user.name);
    }
  }, [session, myPlayer]);

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

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchTodaysBetsForAdmin();
      // Refresh every minute
      const interval = setInterval(() => {
        fetchTodaysBetsForAdmin();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const createPlayerForUser = async () => {
    if (!session?.user?.name) return;

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.user.name,
          username: session.user.name,
        }),
      });

      const player = await response.json();
      setMyPlayer(player);
      fetchPlayers();
    } catch (error) {
      console.error("Failed to create player:", error);
    }
  };

  /**
   * Fetch today's bets for admin overview
   * Displays current betting session status and all placed bets
   * Automatically refreshes every minute
   */
  const fetchTodaysBetsForAdmin = async () => {
    setLoadingAdminData(true);
    try {
      const response = await fetch("/api/admin/dashboard");
      const data = await response.json();
      if (data.todaysBets) {
        setTodaysBets(data.todaysBets);
      }
    } catch (error) {
      console.error("Failed to fetch today's bets:", error);
    } finally {
      setLoadingAdminData(false);
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

  const fetchTodaysBet = async (playerName: string) => {
    try {
      const response = await fetch(`/api/bets?playerName=${encodeURIComponent(playerName)}`);
      const data = await response.json();
      if (data.bet) {
        setMyBet(data.bet);
        setPrediction(data.bet.prediction);
      }
    } catch (error) {
      console.error("Failed to fetch bet:", error);
    }
  };

  const placeBet = async () => {
    if (!myPlayer) {
      alert("Please wait, setting up your player profile...");
      return;
    }

    if (!bettingOpen) {
      alert(
        "Betting is closed! You can only place bets between 6 PM and 8:20 AM.",
      );
      return;
    }

    try {
      const response = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: myPlayer.name,
          prediction,
          betAmount: 0, // Not used anymore, but kept for compatibility
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMyBet(data.bet);
      } else {
        alert("Failed to place bet. Please try again.");
      }
    } catch (error) {
      console.error("Failed to place bet:", error);
      alert("Failed to place bet. Please try again.");
    }
  };

  const removeBet = () => {
    setMyBet(null);
  };

  /**
   * Reveal game results and calculate points
   * Can only be called after betting window closes (8:20 AM)
   */
  const revealResults = async () => {
    if (actualTime === null) {
      alert("Please enter the actual time first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualTime }),
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
    // Betting opens at 6 PM (18:00) and closes at 8:20 AM
    if (hours >= 8 && hours < 18) {
      const hoursUntil6PM = 18 - hours;
      return `${hoursUntil6PM} hours`;
    }
    return "Soon";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8 px-3 md:px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 md:mb-8">
          {/* Top Bar */}
          {session && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left: User Info */}
                <div className="flex items-center gap-3 md:min-w-[200px]">
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

                {/* Center: App Title */}
                <div className="flex items-center gap-2 justify-center md:flex-1">
                  <span className="text-3xl">⏰</span>
                  <div className="text-center">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      Lucka's Arrival
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Will she be on time?
                    </p>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex gap-2 justify-center md:justify-end md:min-w-[200px]">
                  <button
                    onClick={() => setShowLeaderboard(!showLeaderboard)}
                    className="w-10 h-10 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-colors text-xl"
                    title="Toggle Leaderboard"
                  >
                    {showLeaderboard ? "🎲" : "🏆"}
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="w-10 h-10 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-colors text-xl"
                    title="Toggle theme"
                  >
                    {theme === "light" ? "🌙" : "☀️"}
                  </button>
                  {session?.user.role === "admin" && (
                    <button
                      onClick={() => router.push("/admin")}
                      className="w-10 h-10 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-colors text-xl"
                      title="Admin"
                    >
                      ⚙️
                    </button>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-10 h-10 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-colors text-xl"
                    title="Sign Out"
                  >
                    🚪
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Betting Status Banner */}
          <div className="mb-4">
            {bettingOpen ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800 shadow-sm">
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <span className="text-2xl md:text-3xl">🟢</span>
                  <p className="text-green-700 dark:text-green-400 text-base md:text-lg font-semibold md:font-bold text-center">
                    Betting is OPEN until 8:20 AM
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800 shadow-sm">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-2xl md:text-3xl">🔴</span>
                    <p className="text-red-700 dark:text-red-400 text-base md:text-lg font-semibold md:font-bold">
                      Betting is CLOSED
                    </p>
                  </div>
                  <p className="text-red-600 dark:text-red-500 text-sm">
                    Opens at 6 PM (in {getTimeUntilBettingOpens()})
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {showLeaderboard && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg mb-8 overflow-hidden">
            {/* Leaderboard Header */}
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 dark:from-yellow-600 dark:via-yellow-700 dark:to-orange-600 p-4 md:p-6 text-center">
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-1 md:mb-2">
                <span className="text-2xl md:text-4xl">🏆</span>
                <h2 className="text-2xl md:text-3xl font-bold md:font-black text-white drop-shadow-md">
                  LEADERBOARD
                </h2>
                <span className="text-2xl md:text-4xl">🏆</span>
              </div>
              <p className="text-white/90 text-xs md:text-sm font-medium">
                Top {players.length} Players
              </p>
            </div>

            {/* Leaderboard Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      W/L
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {players.map((player, index) => (
                    <tr
                      key={player.id}
                      className={`transition-colors ${
                        player.id === myPlayer?.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${
                            index === 0
                              ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-2 border-yellow-400"
                              : index === 1
                                ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-2 border-gray-400"
                                : index === 2
                                  ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-2 border-orange-400"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-base"
                          }`}
                        >
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                        </div>
                      </td>

                      {/* Player Name */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">
                              {player.name}
                            </p>
                            {player.id === myPlayer?.id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                You
                              </span>
                            )}
                            {/* Show W/L on mobile */}
                            <p className="sm:hidden text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {player.gamesWon}W - {player.gamesLost}L
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* W/L (hidden on mobile) */}
                      <td className="hidden sm:table-cell px-4 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">
                            {player.gamesWon}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold">
                            {player.gamesLost}
                          </span>
                        </div>
                      </td>

                      {/* Points */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex flex-col items-end">
                          <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">
                            {player.points}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            pts
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {players.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-5xl mb-3">🎮</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    No players yet
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Be the first to join the competition!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!showResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Left side - Place your bet */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="mb-5 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                    🎯
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    Place Your Bet
                  </h2>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 text-xs md:text-sm">
                    <span className="font-bold">📊 Point System:</span> Earn up to 10 points per round!
                    <span className="block mt-1">Formula: <span className="font-mono font-bold">10 - minutes off</span></span>
                  </p>
                </div>
              </div>

              {session?.user?.role === "admin" ? (
                // Admin Overview - Replaces betting form for admin users
                // Shows real-time betting session data instead of loading state
                <div className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">👑</span>
                      <h3 className="text-purple-700 dark:text-purple-400 font-bold text-lg">
                        Admin Overview
                      </h3>
                    </div>
                    <p className="text-purple-600 dark:text-purple-300 text-sm">
                      You're viewing as admin. Check today's betting session below.
                    </p>
                  </div>

                  {loadingAdminData ? (
                    <div className="text-center py-8">
                      <div className="animate-spin text-4xl mb-3">⏳</div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Loading betting data...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Betting Stats */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <p className="text-blue-600 dark:text-blue-400 text-2xl font-bold">
                              {todaysBets.length}
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 text-xs">
                              Total Bets
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-blue-600 dark:text-blue-400 text-2xl font-bold">
                              {bettingOpen ? "🟢" : "🔴"}
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 text-xs">
                              {bettingOpen ? "Open" : "Closed"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Today's Bets List */}
                      {todaysBets.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm mb-2">
                            📋 Today's Bets:
                          </p>
                          {todaysBets.map((bet) => (
                            <div
                              key={bet.id}
                              className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-gray-900 dark:text-white font-semibold text-sm">
                                    {bet.player.name}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    {new Date(bet.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-blue-600 dark:text-blue-400 font-bold text-base">
                                    {formatTime(bet.prediction)}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    {bet.player.points} pts
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <p className="text-4xl mb-2">📭</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            No bets placed yet today
                          </p>
                        </div>
                      )}

                      {/* Quick Link to Full Admin Dashboard */}
                      <button
                        onClick={() => router.push("/admin")}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <span className="text-xl">⚙️</span>
                        <span>Full Admin Dashboard</span>
                      </button>
                    </>
                  )}
                </div>
              ) : !myPlayer ? (
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
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          Your Bet
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">
                          {formatTime(myBet.prediction)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <p className="text-gray-600 dark:text-gray-400 text-xs text-center">
                          You'll earn points based on accuracy: <span className="font-mono font-bold text-gray-900 dark:text-white">10 - minutes off</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeBet}
                      className="w-full mt-4 py-3 md:py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold md:font-bold rounded-xl transition-colors flex items-center justify-center gap-2 md:gap-3 shadow-lg text-base md:text-lg min-h-[48px] md:min-h-[56px]"
                    >
                      <span className="text-xl md:text-2xl">❌</span>
                      <span>Change Bet</span>
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
                        🔒 Betting closed! Come back between 6 PM and 8:20 AM.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-sm md:text-base">
                      How late will she be?
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 md:p-5">
                      <input
                        type="range"
                        min="-30"
                        max="120"
                        value={prediction}
                        onChange={(e) =>
                          setPrediction(parseInt(e.target.value))
                        }
                        className="w-full h-2 md:h-3 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        disabled={!bettingOpen}
                      />
                      <div className="mt-4 md:mt-5 text-center">
                        <p className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400">
                          {formatTime(prediction)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <div className="text-center">
                      <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                        💡 Point Preview
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Exact</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">+10</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">±1 min</p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">+9</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">±5 min</p>
                          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">+5</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">±10 min</p>
                          <p className="text-base font-bold text-gray-600 dark:text-gray-400">+0</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={placeBet}
                    disabled={!bettingOpen}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-bold rounded-xl text-lg md:text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3 shadow-lg min-h-[56px]"
                  >
                    <span className="text-2xl md:text-3xl">🎯</span>
                    <span>Place Bet</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right side - Admin reveal results */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3 mb-5 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600 dark:bg-orange-500 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                  🎊
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Reveal Results
                </h2>
              </div>

              {session?.user?.role === "admin" ? (
                <div className="space-y-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
                    <p className="text-yellow-700 dark:text-yellow-400 text-sm flex items-center justify-center gap-2">
                      <span>👑</span>
                      <span>
                        Admin only: Enter actual time to award points
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-sm md:text-base">
                      Actual Arrival Time
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 md:p-5">
                      <input
                        type="range"
                        min="-30"
                        max="120"
                        value={actualTime ?? 0}
                        onChange={(e) =>
                          setActualTime(parseInt(e.target.value))
                        }
                        className="w-full h-2 md:h-3 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                      <div className="mt-4 md:mt-5 text-center">
                        <p className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400">
                          {actualTime !== null
                            ? formatTime(actualTime)
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Betting window restriction - prevents revealing results while bets are still open */}
                  {bettingOpen && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
                      <p className="text-yellow-700 dark:text-yellow-400 text-sm flex items-center justify-center gap-2">
                        <span>⏳</span>
                        <span>
                          Results can only be revealed after betting closes (8:20 AM)
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Reveal Results button - disabled during betting window and when no bets exist */}
                  <button
                    onClick={revealResults}
                    disabled={loading || bettingOpen || todaysBets.length === 0}
                    className="w-full py-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-bold rounded-xl text-lg md:text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3 shadow-lg min-h-[56px]"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin text-2xl md:text-3xl">⏳</span>
                        <span>Processing...</span>
                      </>
                    ) : bettingOpen ? (
                      <>
                        <span className="text-2xl md:text-3xl">🔒</span>
                        <span>Betting Still Open</span>
                      </>
                    ) : todaysBets.length === 0 ? (
                      <>
                        <span className="text-2xl md:text-3xl">📭</span>
                        <span>No Bets to Process</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl md:text-3xl">🎊</span>
                        <span>Reveal Results</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  {bettingOpen ? (
                    <>
                      <div className="text-6xl mb-4">📊</div>
                      <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                        No results yet
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Points will be awarded after Lucka arrives
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">🔒</div>
                      <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                        Betting is closed
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Come back between 6 PM and 8:20 AM to place your bet
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 md:gap-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl px-5 md:px-6 py-3 md:py-4 mb-4">
                <span className="text-3xl md:text-4xl">🎊</span>
                <div className="text-left">
                  <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                    Lucka arrived
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {formatTime(actualTime!)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-xl md:rounded-2xl p-4 md:p-5 transition-colors ${
                    result.netChange > 0
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <div
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-xl ${
                            result.netChange > 0
                              ? "bg-green-200 dark:bg-green-800"
                              : "bg-gray-200 dark:bg-gray-600"
                          }`}
                        >
                          {result.netChange > 0 ? "🎉" : "📊"}
                        </div>
                        <p className="text-gray-900 dark:text-white font-bold text-lg md:text-xl">
                          {result.playerName}
                        </p>
                      </div>
                      <div className="space-y-1 ml-10 md:ml-13">
                        <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                          Predicted:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatTime(result.prediction)}
                          </span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                          Accuracy:{" "}
                          <span className={`font-semibold ${
                            result.difference === 0
                              ? "text-green-600 dark:text-green-400"
                              : result.difference <= 2
                                ? "text-blue-600 dark:text-blue-400"
                                : result.difference <= 5
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-gray-600 dark:text-gray-400"
                          }`}>
                            {result.difference === 0 ? "Perfect! 🎯" : `Off by ${Math.abs(result.difference)} min`}
                          </span>
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
                            className={`text-2xl md:text-3xl font-bold mb-1 ${
                              result.netChange > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            +{result.netChange}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                            Points earned
                          </p>
                          <div className="inline-flex items-center gap-1 md:gap-2 bg-white dark:bg-gray-700 rounded-lg px-2 md:px-3 py-1 border border-gray-200 dark:border-gray-600">
                            <span className="text-blue-600 dark:text-blue-400 text-base md:text-lg font-bold">
                              {result.newPoints}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">
                              total pts
                            </span>
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
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl text-lg md:text-xl transition-colors flex items-center justify-center gap-2 md:gap-3 shadow-lg min-h-[56px]"
            >
              <span className="text-2xl md:text-3xl">🔄</span>
              <span>New Game</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
