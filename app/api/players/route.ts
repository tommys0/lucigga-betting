import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force Node.js runtime for Prisma compatibility
export const runtime = "nodejs";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        user: true,
      },
      orderBy: { points: 'desc' },
    });

    // Filter out admin users from the leaderboard
    const nonAdminPlayers = players.filter(
      player => !player.user || player.user.role !== 'admin'
    );

    return NextResponse.json(nonAdminPlayers);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 },
    );
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
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 },
    );
  }
}
