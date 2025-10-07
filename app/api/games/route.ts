import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

function calculatePoints(prediction: number, actualTime: number): number {
  const difference = Math.abs(prediction - actualTime);
  // Points = 10 - minutes off, minimum 0, maximum 10
  return Math.max(0, 10 - difference);
}

export async function POST(request: Request) {
  try {
    const { actualTime } = await request.json();

    // Get today's date range
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const hours = now.getHours();
    const minutes = now.getMinutes();

    let searchStart: Date;
    if (hours < 8 || (hours === 8 && minutes < 20)) {
      searchStart = new Date(startOfToday);
      searchStart.setDate(searchStart.getDate() - 1);
      searchStart.setHours(18, 0, 0, 0);
    } else {
      searchStart = new Date(startOfToday);
      searchStart.setHours(18, 0, 0, 0);
    }

    // Find or create today's game
    let game = await prisma.game.findFirst({
      where: {
        playedAt: {
          gte: searchStart,
        },
      },
    });

    if (!game) {
      game = await prisma.game.create({
        data: {
          actualTime,
        },
      });
    } else {
      // Update game with actual time
      game = await prisma.game.update({
        where: { id: game.id },
        data: { actualTime },
      });
    }

    // Find all bets for this game
    const bets = await prisma.bet.findMany({
      where: {
        gameId: game.id,
      },
      include: {
        player: true,
      },
    });

    // Process each bet
    const results = await Promise.all(
      bets.map(async (bet) => {
        // Calculate points earned (new system: 10 - minutes off)
        const pointsEarned = calculatePoints(bet.prediction, actualTime);
        const netChange = pointsEarned; // Always positive or zero

        // Update bet record with winnings
        await prisma.bet.update({
          where: { id: bet.id },
          data: {
            winnings: pointsEarned,
          },
        });

        // Update player stats - points can only increase
        const updatedPlayer = await prisma.player.update({
          where: { id: bet.player.id },
          data: {
            points: bet.player.points + pointsEarned,
            gamesWon: pointsEarned > 0 ? bet.player.gamesWon + 1 : bet.player.gamesWon,
            gamesLost: pointsEarned === 0 ? bet.player.gamesLost + 1 : bet.player.gamesLost,
            totalBet: bet.player.totalBet + bet.betAmount,
          },
        });

        return {
          playerName: bet.player.name,
          prediction: bet.prediction,
          betAmount: bet.betAmount,
          winnings: pointsEarned,
          netChange,
          newPoints: updatedPlayer.points,
          difference: Math.abs(bet.prediction - actualTime),
        };
      })
    );

    return NextResponse.json({
      gameId: game.id,
      actualTime,
      results: results.sort((a, b) => (b.winnings || 0) - (a.winnings || 0)),
    });
  } catch (error) {
    console.error('Game processing error:', error);
    return NextResponse.json({ error: 'Failed to process game' }, { status: 500 });
  }
}
