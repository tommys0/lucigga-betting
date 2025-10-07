import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total stats
    const totalUsers = await prisma.user.count();
    const totalPlayers = await prisma.player.count();
    const totalGames = await prisma.game.count();

    // Get today's games
    const todayGames = await prisma.game.findMany({
      where: {
        playedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        bets: {
          include: {
            player: true,
          },
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
    });

    // Get all players with their linked users
    const players = await prisma.player.findMany({
      include: {
        user: {
          select: {
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        points: 'desc',
      },
    });

    // Get active players today (players who have placed bets today)
    const activePlayers = await prisma.player.findMany({
      where: {
        bets: {
          some: {
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        bets: {
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Get recent activity (last 10 bets)
    const recentBets = await prisma.bet.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        player: true,
        game: true,
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPlayers,
        totalGames,
        activePlayersToday: activePlayers.length,
      },
      todayGames,
      activePlayers,
      players,
      recentBets,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
