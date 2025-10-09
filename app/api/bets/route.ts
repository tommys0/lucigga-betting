import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

// GET: Fetch today's bet for the current player
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
      return NextResponse.json({ bet: null });
    }

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

    // Find the most recent bet for this player
    const bet = await prisma.bet.findFirst({
      where: {
        playerId: player.id,
        createdAt: {
          gte: searchStart,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        game: true,
      },
    });

    if (!bet) {
      return NextResponse.json({ bet: null });
    }

    return NextResponse.json({
      bet: {
        playerName: player.name,
        prediction: bet.prediction,
        betAmount: bet.betAmount,
        isWontComeBet: bet.isWontComeBet,
      },
    });
  } catch (error) {
    console.error('Fetch bet error:', error);
    return NextResponse.json({ error: 'Failed to fetch bet' }, { status: 500 });
  }
}

// POST: Save a new bet
export async function POST(request: Request) {
  try {
    const { playerName, prediction, betAmount, isWontComeBet } = await request.json();

    // Find or create player
    let player = await prisma.player.findUnique({
      where: { name: playerName },
    });

    if (!player) {
      player = await prisma.player.create({
        data: { name: playerName },
      });
    }

    // Get today's betting session range
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

    // Find or create today's game (with actualTime = 0 as placeholder)
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
          actualTime: 0, // Placeholder - will be updated when admin reveals
        },
      });
    }

    // Check if player already has a bet for this game
    const existingBet = await prisma.bet.findFirst({
      where: {
        playerId: player.id,
        gameId: game.id,
      },
    });

    if (existingBet) {
      // Update existing bet
      const updatedBet = await prisma.bet.update({
        where: { id: existingBet.id },
        data: {
          prediction,
          betAmount,
          isWontComeBet: isWontComeBet || false,
        },
      });

      return NextResponse.json({
        success: true,
        bet: {
          playerName: player.name,
          prediction: updatedBet.prediction,
          betAmount: updatedBet.betAmount,
          isWontComeBet: updatedBet.isWontComeBet,
        },
      });
    }

    // Create new bet
    const bet = await prisma.bet.create({
      data: {
        playerId: player.id,
        gameId: game.id,
        prediction,
        betAmount,
        isWontComeBet: isWontComeBet || false,
        winnings: 0,
      },
    });

    return NextResponse.json({
      success: true,
      bet: {
        playerName: player.name,
        prediction: bet.prediction,
        betAmount: bet.betAmount,
        isWontComeBet: bet.isWontComeBet,
      },
    });
  } catch (error) {
    console.error('Save bet error:', error);
    return NextResponse.json({ error: 'Failed to save bet' }, { status: 500 });
  }
}

// DELETE: Remove a bet
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('playerName');

    if (!playerName) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    // Check if betting is open (6 PM to 8:20 AM next day)
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isBettingOpen = hours >= 18 || hours < 8 || (hours === 8 && minutes < 20);

    if (!isBettingOpen) {
      return NextResponse.json({ error: 'Betting is closed. Cannot remove bet after 8:20 AM.' }, { status: 403 });
    }

    // Find player
    const player = await prisma.player.findUnique({
      where: { name: playerName },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get today's betting session range
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

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

    // Find and delete today's bet
    const bet = await prisma.bet.findFirst({
      where: {
        playerId: player.id,
        createdAt: {
          gte: searchStart,
        },
      },
    });

    if (!bet) {
      return NextResponse.json({ error: 'No bet found' }, { status: 404 });
    }

    await prisma.bet.delete({
      where: { id: bet.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete bet error:', error);
    return NextResponse.json({ error: 'Failed to delete bet' }, { status: 500 });
  }
}
