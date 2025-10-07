import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: { points: 'desc' },
    });
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Failed to fetch players', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    // Check if player exists
    let player = await prisma.player.findUnique({
      where: { name },
    });

    // If not, create new player
    if (!player) {
      player = await prisma.player.create({
        data: { name },
      });
    }

    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}
