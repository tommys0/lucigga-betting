import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

// GET: Fetch all completed games with their bets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    // Fetch all games that have been completed (actualTime is set or didntCome is true)
    const gamesQuery = {
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
                points: true,
              },
            },
          },
          orderBy: {
            winnings: 'desc' as const,
          },
        },
      },
      orderBy: {
        playedAt: 'desc' as const,
      },
      ...(limit ? { take: parseInt(limit) } : {}),
    };

    const games = await prisma.game.findMany(gamesQuery);

    // Format the response
    const formattedGames = games.map((game) => ({
      id: game.id,
      actualTime: game.actualTime,
      didntCome: game.didntCome,
      gameType: game.gameType,
      playedAt: game.playedAt,
      bets: game.bets.map((bet) => ({
        id: bet.id,
        playerName: bet.player.name,
        prediction: bet.prediction,
        isWontComeBet: bet.isWontComeBet,
        winnings: bet.winnings,
        difference: game.didntCome
          ? null
          : Math.abs(bet.prediction - (game.actualTime || 0)),
        createdAt: bet.createdAt,
      })),
      totalBets: game.bets.length,
      winner: game.bets.length > 0 && game.bets[0].winnings > 0
        ? game.bets[0].player.name
        : null,
    }));

    return NextResponse.json({ games: formattedGames });
  } catch (error) {
    console.error('Fetch game history error:', error);
    return NextResponse.json({ error: 'Failed to fetch game history' }, { status: 500 });
  }
}
