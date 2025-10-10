import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

// GET: Fetch global statistics across all games and players
export async function GET() {
  try {
    // Get all completed games (where actualTime is not null or didntCome is true)
    const completedGames = await prisma.game.findMany({
      where: {
        OR: [
          { actualTime: { not: null } },
          { didntCome: true },
        ],
      },
      include: {
        bets: {
          include: {
            player: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
    });

    // Get all players
    const allPlayers = await prisma.player.findMany();

    // Calculate total games
    const totalGames = completedGames.length;

    if (totalGames === 0) {
      return NextResponse.json({
        totalGames: 0,
        averageActualTime: null,
        averagePrediction: null,
        totalBets: 0,
        didntComeCount: 0,
        didntComePercentage: 0,
        mostAccuratePlayer: null,
        totalPlayers: allPlayers.length,
        predictionDistribution: [],
        actualTimeDistribution: [],
      });
    }

    // Filter games where she actually came (not didntCome)
    const gamesWhereSheCame = completedGames.filter((game) => !game.didntCome);

    // Calculate average actual time (only for games where she came)
    const totalActualTime = gamesWhereSheCame.reduce(
      (sum, game) => sum + (game.actualTime || 0),
      0
    );
    const averageActualTime =
      gamesWhereSheCame.length > 0 ? totalActualTime / gamesWhereSheCame.length : null;

    // Count how many times she didn't come
    const didntComeCount = completedGames.filter((game) => game.didntCome).length;
    const didntComePercentage = (didntComeCount / totalGames) * 100;

    // Get all bets from completed games (excluding "won't come" bets)
    const allBets = completedGames.flatMap((game) => game.bets);
    const regularBets = allBets.filter((bet) => !bet.isWontComeBet);

    const totalBets = allBets.length;

    // Calculate average prediction (excluding "won't come" bets)
    const totalPrediction = regularBets.reduce((sum, bet) => sum + bet.prediction, 0);
    const averagePrediction = regularBets.length > 0 ? totalPrediction / regularBets.length : null;

    // Find most accurate player (best average accuracy)
    const playerAccuracyMap = new Map<
      string,
      { totalDifference: number; count: number; name: string }
    >();

    gamesWhereSheCame.forEach((game) => {
      game.bets.forEach((bet) => {
        if (!bet.isWontComeBet) {
          const difference = Math.abs(bet.prediction - (game.actualTime || 0));
          const existing = playerAccuracyMap.get(bet.player.name) || {
            totalDifference: 0,
            count: 0,
            name: bet.player.name,
          };
          playerAccuracyMap.set(bet.player.name, {
            totalDifference: existing.totalDifference + difference,
            count: existing.count + 1,
            name: bet.player.name,
          });
        }
      });
    });

    let mostAccuratePlayer = null;
    let bestAvgDifference = Infinity;

    playerAccuracyMap.forEach((data) => {
      const avgDifference = data.totalDifference / data.count;
      if (avgDifference < bestAvgDifference && data.count >= 3) {
        // Minimum 3 bets
        bestAvgDifference = avgDifference;
        mostAccuratePlayer = {
          name: data.name,
          averageAccuracy: Math.round(avgDifference * 10) / 10,
          totalBets: data.count,
        };
      }
    });

    // Prediction distribution (grouped by ranges)
    const predictionRanges = [
      { label: 'Early (< -10 min)', min: -Infinity, max: -10, count: 0 },
      { label: 'Slightly Early (-10 to 0)', min: -10, max: 0, count: 0 },
      { label: 'On Time (0 to 10)', min: 0, max: 10, count: 0 },
      { label: 'Late (10 to 30)', min: 10, max: 30, count: 0 },
      { label: 'Very Late (30 to 60)', min: 30, max: 60, count: 0 },
      { label: 'Extremely Late (> 60)', min: 60, max: Infinity, count: 0 },
    ];

    regularBets.forEach((bet) => {
      const range = predictionRanges.find((r) => bet.prediction >= r.min && bet.prediction < r.max);
      if (range) range.count++;
    });

    // Actual time distribution
    const actualTimeRanges = [
      { label: 'Early (< -10 min)', min: -Infinity, max: -10, count: 0 },
      { label: 'Slightly Early (-10 to 0)', min: -10, max: 0, count: 0 },
      { label: 'On Time (0 to 10)', min: 0, max: 10, count: 0 },
      { label: 'Late (10 to 30)', min: 10, max: 30, count: 0 },
      { label: 'Very Late (30 to 60)', min: 30, max: 60, count: 0 },
      { label: 'Extremely Late (> 60)', min: 60, max: Infinity, count: 0 },
    ];

    gamesWhereSheCame.forEach((game) => {
      const time = game.actualTime || 0;
      const range = actualTimeRanges.find((r) => time >= r.min && time < r.max);
      if (range) range.count++;
    });

    // Most common prediction
    const predictionFrequency = new Map<number, number>();
    regularBets.forEach((bet) => {
      const rounded = Math.round(bet.prediction / 5) * 5; // Round to nearest 5 minutes
      predictionFrequency.set(rounded, (predictionFrequency.get(rounded) || 0) + 1);
    });

    let mostCommonPrediction = null;
    let maxFrequency = 0;
    predictionFrequency.forEach((count, prediction) => {
      if (count > maxFrequency) {
        maxFrequency = count;
        mostCommonPrediction = prediction;
      }
    });

    // Calculate average points per game
    const totalPointsEarned = allPlayers.reduce((sum, player) => sum + player.points, 0);
    const averagePointsPerGame = totalGames > 0 ? totalPointsEarned / totalGames : 0;

    return NextResponse.json({
      totalGames,
      totalBets,
      totalPlayers: allPlayers.length,
      averageActualTime: averageActualTime !== null ? Math.round(averageActualTime * 10) / 10 : null,
      averagePrediction: averagePrediction !== null ? Math.round(averagePrediction * 10) / 10 : null,
      didntComeCount,
      didntComePercentage: Math.round(didntComePercentage * 10) / 10,
      mostAccuratePlayer,
      mostCommonPrediction,
      predictionDistribution: predictionRanges.filter((r) => r.count > 0),
      actualTimeDistribution: actualTimeRanges.filter((r) => r.count > 0),
      averagePointsPerGame: Math.round(averagePointsPerGame * 10) / 10,
    });
  } catch (error) {
    console.error('Fetch global stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch global statistics' }, { status: 500 });
  }
}
