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
    const { actualTime, didntCome } = await request.json();

    // Get today's betting session range
    // Betting window: 6 PM to 8:20 AM next day
    // Show bets from current session until next session starts at 6 PM
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const hours = now.getHours();

    let searchStart: Date;
    if (hours < 18) {
      // Before 6 PM - current session from yesterday 6 PM
      searchStart = new Date(startOfToday);
      searchStart.setDate(searchStart.getDate() - 1);
      searchStart.setHours(18, 0, 0, 0);
    } else {
      // After 6 PM - new session from today 6 PM
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
          actualTime: didntCome ? null : actualTime,
          didntCome: didntCome || false,
        },
      });
    } else {
      // Update game with actual time or didntCome status
      game = await prisma.game.update({
        where: { id: game.id },
        data: {
          actualTime: didntCome ? null : actualTime,
          didntCome: didntCome || false,
        },
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
        let pointsEarned = 0;

        // If she didn't come
        if (didntCome) {
          // Special bonus for correct "won't come" bets
          pointsEarned = bet.isWontComeBet ? 15 : 0;
        } else {
          // Normal time-based prediction
          if (bet.isWontComeBet) {
            // They bet she won't come but she did - no points
            pointsEarned = 0;
          } else {
            // Calculate points earned (new system: 10 - minutes off)
            pointsEarned = calculatePoints(bet.prediction, actualTime!);
          }
        }

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
          difference: didntCome ? 0 : Math.abs(bet.prediction - actualTime!),
          isWontComeBet: bet.isWontComeBet,
        };
      })
    );

    return NextResponse.json({
      gameId: game.id,
      actualTime: didntCome ? null : actualTime,
      didntCome: didntCome || false,
      results: results.sort((a, b) => (b.winnings || 0) - (a.winnings || 0)),
    });
  } catch (error) {
    console.error('Game processing error:', error);
    return NextResponse.json({ error: 'Failed to process game' }, { status: 500 });
  }
}
