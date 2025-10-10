import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

// GET: Fetch the current active game
export async function GET() {
  try {
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

    // Find the current incomplete game first, otherwise get the most recent game
    let game = await prisma.game.findFirst({
      where: {
        playedAt: {
          gte: searchStart,
        },
        OR: [
          { actualTime: null },
          { actualTime: 0 },
        ],
      },
      orderBy: {
        playedAt: 'desc',
      },
    });

    // If no incomplete game, get the most recent completed game for this session
    if (!game) {
      game = await prisma.game.findFirst({
        where: {
          playedAt: {
            gte: searchStart,
          },
        },
        orderBy: {
          playedAt: 'desc',
        },
      });
    }

    return NextResponse.json({
      game: game ? {
        id: game.id,
        gameType: game.gameType,
        actualTime: game.actualTime,
        didntCome: game.didntCome,
      } : null,
    });
  } catch (error) {
    console.error('Fetch current game error:', error);
    return NextResponse.json({ error: 'Failed to fetch current game' }, { status: 500 });
  }
}

// POST: Create a new game (admin only - for trip mode)
export async function POST(request: Request) {
  try {
    const { gameType } = await request.json();

    if (!gameType || (gameType !== 'normal' && gameType !== 'trip')) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    // Check if there's already an active game for this session
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const hours = now.getHours();

    let searchStart: Date;
    if (hours < 18) {
      searchStart = new Date(startOfToday);
      searchStart.setDate(searchStart.getDate() - 1);
      searchStart.setHours(18, 0, 0, 0);
    } else {
      searchStart = new Date(startOfToday);
      searchStart.setHours(18, 0, 0, 0);
    }

    // Check for incomplete games first
    const existingGame = await prisma.game.findFirst({
      where: {
        playedAt: {
          gte: searchStart,
        },
        OR: [
          { actualTime: null },
          { actualTime: 0 },
        ],
      },
    });

    if (existingGame) {
      return NextResponse.json({ error: 'An incomplete game already exists for this session' }, { status: 400 });
    }

    // Create new game
    const game = await prisma.game.create({
      data: {
        actualTime: 0,
        gameType: gameType,
      },
    });

    return NextResponse.json({
      success: true,
      game: {
        id: game.id,
        gameType: game.gameType,
      },
    });
  } catch (error) {
    console.error('Create game error:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
