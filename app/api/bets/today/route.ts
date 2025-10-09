import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

// GET: Fetch today's bets for all users
// Normal users see only who bet (no times until results are revealed)
// After results are revealed, everyone can see all details
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Get today's betting session range
    // Betting window: 6 PM to 8:20 AM next day
    // Show bets from current session until next session starts at 6 PM
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const hours = now.getHours();

    let searchStart: Date;
    if (hours < 18) {
      // Before 6 PM - show bets from yesterday 6 PM (current/recent betting session)
      searchStart = new Date(startOfToday);
      searchStart.setDate(searchStart.getDate() - 1);
      searchStart.setHours(18, 0, 0, 0);
    } else {
      // After 6 PM - show bets from today 6 PM (new betting session)
      searchStart = new Date(startOfToday);
      searchStart.setHours(18, 0, 0, 0);
    }

    // Find today's game to check if results have been revealed
    const game = await prisma.game.findFirst({
      where: {
        playedAt: {
          gte: searchStart,
        },
      },
    });

    // Check if results have been revealed (actualTime is set or didntCome is true)
    const resultsRevealed = game && (game.actualTime !== null || game.didntCome);

    // Find all bets for today
    const bets = await prisma.bet.findMany({
      where: {
        createdAt: {
          gte: searchStart,
        },
      },
      include: {
        player: {
          select: {
            name: true,
            points: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // If results are revealed OR includeDetails is true (for admin), return full details
    if (resultsRevealed || includeDetails) {
      return NextResponse.json({
        bets: bets.map((bet) => ({
          id: bet.id,
          player: bet.player,
          prediction: bet.prediction,
          isWontComeBet: bet.isWontComeBet,
          winnings: bet.winnings,
          createdAt: bet.createdAt,
        })),
        resultsRevealed,
        game: game ? {
          actualTime: game.actualTime,
          didntCome: game.didntCome,
        } : null,
      });
    }

    // For normal users before results are revealed, only show who bet
    return NextResponse.json({
      bets: bets.map((bet) => ({
        id: bet.id,
        player: {
          name: bet.player.name,
          points: bet.player.points,
        },
        createdAt: bet.createdAt,
        // Don't include prediction or isWontComeBet
      })),
      resultsRevealed: false,
      game: null,
    });
  } catch (error) {
    console.error('Fetch today\'s bets error:', error);
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}
