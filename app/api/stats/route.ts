import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

// GET: Fetch player's betting history and statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('playerName');

    if (!playerName) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    // Find player
    const player = await prisma.player.findUnique({
      where: { name: playerName },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get all bets with game results
    const bets = await prisma.bet.findMany({
      where: {
        playerId: player.id,
      },
      include: {
        game: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter only completed games (where actualTime is not null or didntCome is true)
    const completedBets = bets.filter(bet =>
      bet.game.actualTime !== null || bet.game.didntCome === true
    );

    // Calculate statistics
    const totalGames = completedBets.length;
    const gamesWon = completedBets.filter(bet => bet.winnings > 0).length;
    const gamesLost = completedBets.filter(bet => bet.winnings === 0).length;
    const totalPointsEarned = completedBets.reduce((sum, bet) => sum + bet.winnings, 0);

    // Calculate average accuracy (for non-didntCome games)
    const normalBets = completedBets.filter(bet =>
      !bet.isWontComeBet && !bet.game.didntCome && bet.game.actualTime !== null
    );
    const totalDifference = normalBets.reduce((sum, bet) => {
      return sum + Math.abs(bet.prediction - (bet.game.actualTime || 0));
    }, 0);
    const avgAccuracy = normalBets.length > 0 ? totalDifference / normalBets.length : 0;

    // Find best prediction (closest to actual time)
    let bestPrediction = null;
    let bestDifference = Infinity;
    normalBets.forEach(bet => {
      const diff = Math.abs(bet.prediction - (bet.game.actualTime || 0));
      if (diff < bestDifference) {
        bestDifference = diff;
        bestPrediction = {
          prediction: bet.prediction,
          actualTime: bet.game.actualTime,
          difference: diff,
          date: bet.createdAt,
          winnings: bet.winnings,
        };
      }
    });

    // Calculate win rate
    const winRate = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0;

    // Get recent performance (last 10 games)
    const recentGames = completedBets.slice(0, 10).map(bet => ({
      id: bet.id,
      prediction: bet.prediction,
      actualTime: bet.game.actualTime,
      didntCome: bet.game.didntCome,
      isWontComeBet: bet.isWontComeBet,
      winnings: bet.winnings,
      difference: bet.game.didntCome ? null : Math.abs(bet.prediction - (bet.game.actualTime || 0)),
      date: bet.createdAt,
      gameDate: bet.game.playedAt,
    }));

    // Get monthly performance
    const monthlyStats = completedBets.reduce((acc, bet) => {
      const month = new Date(bet.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!acc[month]) {
        acc[month] = { games: 0, points: 0, wins: 0 };
      }
      acc[month].games++;
      acc[month].points += bet.winnings;
      if (bet.winnings > 0) acc[month].wins++;
      return acc;
    }, {} as Record<string, { games: number; points: number; wins: number }>);

    const monthlyPerformance = Object.entries(monthlyStats)
      .map(([month, stats]) => ({
        month,
        games: stats.games,
        points: stats.points,
        wins: stats.wins,
        winRate: (stats.wins / stats.games) * 100,
      }))
      .reverse();

    return NextResponse.json({
      player: {
        name: player.name,
        points: player.points,
        gamesWon: player.gamesWon,
        gamesLost: player.gamesLost,
      },
      stats: {
        totalGames,
        gamesWon,
        gamesLost,
        winRate,
        totalPointsEarned,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        bestPrediction,
        currentStreak: calculateStreak(completedBets),
      },
      recentGames,
      monthlyPerformance,
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

function calculateStreak(bets: any[]): { type: 'win' | 'loss' | 'none'; count: number } {
  if (bets.length === 0) return { type: 'none', count: 0 };

  let streak = 0;
  const firstBetWon = bets[0].winnings > 0;
  const streakType = firstBetWon ? 'win' : 'loss';

  for (const bet of bets) {
    const won = bet.winnings > 0;
    if ((streakType === 'win' && won) || (streakType === 'loss' && !won)) {
      streak++;
    } else {
      break;
    }
  }

  return { type: streakType, count: streak };
}
