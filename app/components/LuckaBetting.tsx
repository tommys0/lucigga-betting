"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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

  // Check if betting is open (midnight to 8 AM)
  const isBettingOpen = () => {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 0 && hours < 8;
  };

  const [bettingOpen, setBettingOpen] = useState(isBettingOpen());

  // Update betting status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setBettingOpen(isBettingOpen());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    // Auto-fetch or create player for logged-in user
    if (session?.user?.playerName) {
      const player = players.find((p) => p.name === session.user.playerName);
      if (player) {
        setMyPlayer(player);
      }
    } else if (session?.user?.name && !myPlayer) {
      // If user doesn't have a linked player, create one (only if not already created)
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
      fetchPlayers(); // Refresh the list
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

    if (!bettingOpen && session?.user?.role !== "admin") {
      alert(
        "Betting is closed! You can only place bets between midnight and 8:00 AM.",
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
      await fetchPlayers(); // Refresh player data
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
                  {myPlayer && (
                    <p className="text-yellow-400 text-sm md:text-base">
                      💰 {myPlayer.points} points
                    </p>
                  )}
                  {session.user.role === "admin" && (
                    <p className="text-yellow-400 text-xs md:text-sm">
                      🔐 Admin
                    </p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-center">
                {session?.user.role === "admin" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
                  >
                    ⚙️ Admin
                  </button>
                )}
                <button
                  onClick={() => router.push("/players")}
                  className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                >
                  📺 TV
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Betting Status Banner */}
          <div className="text-center mb-4">
            {bettingOpen ? (
              <div className="bg-green-500/20 border-2 border-green-400 rounded-lg p-3">
                <p className="text-green-200 text-base md:text-lg font-bold">
                  ✅ Betting is OPEN (until 8:00 AM)
                </p>
              </div>
            ) : (
              <div className="bg-red-500/20 border-2 border-red-400 rounded-lg p-3">
                <p className="text-red-200 text-base md:text-lg font-bold">
                  ❌ Betting is CLOSED (opens at midnight)
                </p>
                <p className="text-red-300 text-sm mt-1">
                  Next betting window opens in {getTimeUntilBettingOpens()}
                </p>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="px-4 py-2 md:px-6 md:py-2 text-sm md:text-base bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition"
            >
              {showLeaderboard ? "🎲 Hide" : "🏆 Show"} Leaderboard
            </button>
          </div>
        </header>

        {showLeaderboard && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              🏆 Leaderboard
            </h2>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg flex justify-between items-center ${
                    player.id === myPlayer?.id
                      ? "bg-yellow-500/30 border-2 border-yellow-400"
                      : "bg-white/20"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-yellow-400">
                      {index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
                    </span>
                    <div>
                      <p className="text-white font-bold text-xl">
                        {player.name} {player.id === myPlayer?.id && "(You)"}
                      </p>
                      <p className="text-purple-200 text-sm">
                        W: {player.gamesWon} | L: {player.gamesLost}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-400">
                      {player.points} pts
                    </p>
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-purple-200 text-center py-8">
                  No players yet. Be the first!
                </p>
              )}
            </div>
          </div>
        )}

        {!showResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Left side - Place your bet */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 shadow-2xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
                📝 Your Bet
              </h2>

              {!myPlayer ? (
                <div className="text-center py-8">
                  <p className="text-yellow-200 text-lg">
                    Setting up your player profile...
                  </p>
                </div>
              ) : myBet ? (
                <div className="space-y-4">
                  <div className="bg-green-500/20 border-2 border-green-400 rounded-lg p-4">
                    <h3 className="text-green-200 font-bold text-lg mb-3">
                      ✅ Bet Placed!
                    </h3>
                    <div className="space-y-2 text-white">
                      <p>
                        <strong>Player:</strong> {myBet.playerName}
                      </p>
                      <p>
                        <strong>Prediction:</strong>{" "}
                        {formatTime(myBet.prediction)}
                      </p>
                      <p>
                        <strong>Bet Amount:</strong> {myBet.betAmount} points
                      </p>
                    </div>
                    <button
                      onClick={removeBet}
                      className="w-full mt-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition"
                    >
                      ❌ Remove Bet
                    </button>
                  </div>
                  <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg p-4">
                    <p className="text-yellow-200 text-sm text-center">
                      {bettingOpen
                        ? "Waiting for Lucka to arrive... Admin will reveal results."
                        : "Betting closed. Waiting for results..."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!bettingOpen && session?.user?.role !== "admin" && (
                    <div className="bg-red-500/20 border-2 border-red-400 rounded-lg p-4">
                      <p className="text-red-200 text-center">
                        ⏰ Betting is closed! Come back between midnight and
                        8:00 AM.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Your Prediction
                    </label>
                    <input
                      type="range"
                      min="-30"
                      max="120"
                      value={prediction}
                      onChange={(e) => setPrediction(parseInt(e.target.value))}
                      className="w-full"
                      disabled={!bettingOpen && session?.user?.role !== "admin"}
                    />
                    <p className="text-yellow-400 text-center text-lg md:text-xl font-bold mt-2">
                      {formatTime(prediction)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Bet Amount (Available: {myPlayer.points} pts)
                    </label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) =>
                        setBetAmount(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg bg-white/20 text-white border-2 border-white/30 focus:border-yellow-400 focus:outline-none text-base md:text-lg"
                      min="10"
                      max={myPlayer.points}
                      disabled={!bettingOpen && session?.user?.role !== "admin"}
                    />
                  </div>

                  <button
                    onClick={placeBet}
                    disabled={
                      (!bettingOpen && session?.user?.role !== "admin") ||
                      betAmount > myPlayer.points
                    }
                    className="w-full py-3 md:py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg text-base md:text-xl transition"
                  >
                    🎲 Place Bet
                  </button>
                </div>
              )}
            </div>

            {/* Right side - Admin reveal results */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 shadow-2xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
                🎯 Reveal Results
              </h2>

              {session?.user?.role === "admin" ? (
                <div className="space-y-4">
                  <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg p-4">
                    <p className="text-yellow-200 text-sm text-center">
                      👑 Admin only: Enter actual time to reveal results
                    </p>
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Actual Time
                    </label>
                    <input
                      type="range"
                      min="-30"
                      max="120"
                      value={actualTime ?? 0}
                      onChange={(e) => setActualTime(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-yellow-400 text-center text-lg md:text-xl font-bold mt-2">
                      {actualTime !== null ? formatTime(actualTime) : "Not set"}
                    </p>
                  </div>

                  <button
                    onClick={revealResults}
                    disabled={loading || !myBet}
                    className="w-full py-3 md:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg text-base md:text-xl transition"
                  >
                    {loading ? "⏳ Processing..." : "🎊 Reveal Results"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-purple-200 text-lg">
                    Waiting for admin to reveal results...
                  </p>
                  <p className="text-purple-300 text-sm mt-2">
                    Results will appear here when Lucka arrives!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-8 shadow-2xl">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-8 text-center">
              🎊 Results: Lucka was {formatTime(actualTime!)}
            </h2>

            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 md:p-6 rounded-lg ${
                    result.netChange > 0
                      ? "bg-green-500/20 border-2 border-green-400"
                      : "bg-red-500/20 border-2 border-red-400"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <div>
                      <p className="text-white font-bold text-lg md:text-2xl">
                        {result.playerName}
                      </p>
                      <p className="text-purple-200 text-sm md:text-base">
                        Predicted: {formatTime(result.prediction)} (off by{" "}
                        {Math.abs(result.difference)} min)
                      </p>
                      <p className="text-purple-200 text-sm md:text-base">
                        Bet: {result.betAmount} pts
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      {result.error ? (
                        <p className="text-red-300 text-base md:text-lg">
                          {result.error}
                        </p>
                      ) : (
                        <>
                          <p
                            className={`text-xl md:text-3xl font-bold ${result.netChange > 0 ? "text-green-300" : "text-red-300"}`}
                          >
                            {result.netChange > 0 ? "+" : ""}
                            {result.netChange} pts
                          </p>
                          <p className="text-purple-200 text-sm md:text-base">
                            Won: {result.winnings} pts
                          </p>
                          <p className="text-yellow-400 text-base md:text-lg font-bold">
                            New Total: {result.newPoints} pts
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={resetGame}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg text-base md:text-xl transition"
            >
              🔄 New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
