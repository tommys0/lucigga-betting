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

    // Get today's betting session range
    // Betting window: 6 PM to 8:20 AM next day
    // Show bets from current session until next session starts at 6 PM
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const hours = now.getHours();
    const minutes = now.getMinutes();

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

    // For all-time stats
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

    // Get today's betting session bets
    const todaysBets = await prisma.bet.findMany({
      where: {
        createdAt: {
          gte: searchStart,
        },
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        game: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate today's betting stats
    const bettingOpen = hours >= 18 || hours < 8 || (hours === 8 && minutes < 20);
    let avgPrediction = 0;
    if (todaysBets.length > 0) {
      avgPrediction = todaysBets.reduce((sum, bet) => sum + bet.prediction, 0) / todaysBets.length;
    }

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
      todaysBets,
      bettingStatus: {
        isOpen: bettingOpen,
        totalBets: todaysBets.length,
        avgPrediction: Math.round(avgPrediction),
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
