import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

function calculateWinnings(prediction: number, actualTime: number, betAmount: number): number {
  const difference = Math.abs(prediction - actualTime);

  if (difference === 0) {
    return betAmount * 10;
  } else if (difference === 1) {
    return betAmount * 5;
  } else if (difference === 2) {
    return betAmount * 3;
  } else if (difference === 3) {
    return betAmount * 2;
  } else if (difference <= 5) {
    return Math.floor(betAmount * 1.5);
  }
  return 0;
}

export async function POST(request: Request) {
  try {
    const { actualTime, bets } = await request.json();

    // Create the game
    const game = await prisma.game.create({
      data: {
        actualTime,
      },
    });

    // Process each bet
    const results = await Promise.all(
      bets.map(async (bet: { playerName: string; prediction: number; betAmount: number }) => {
        // Get or create player
        let player = await prisma.player.findUnique({
          where: { name: bet.playerName },
        });

        if (!player) {
          player = await prisma.player.create({
            data: { name: bet.playerName },
          });
        }

        // Calculate winnings
        const winnings = calculateWinnings(bet.prediction, actualTime, bet.betAmount);
        const netChange = winnings > 0 ? winnings : -bet.betAmount;

        // Check if player has enough points
        if (player.points < bet.betAmount) {
          return {
            playerName: bet.playerName,
            error: 'Insufficient points',
            currentPoints: player.points,
          };
        }

        // Create bet record
        const betRecord = await prisma.bet.create({
          data: {
            playerId: player.id,
            gameId: game.id,
            prediction: bet.prediction,
            betAmount: bet.betAmount,
            winnings,
          },
        });

        // Update player stats
        const updatedPlayer = await prisma.player.update({
          where: { id: player.id },
          data: {
            points: player.points + netChange,
            gamesWon: winnings > 0 ? player.gamesWon + 1 : player.gamesWon,
            gamesLost: winnings === 0 ? player.gamesLost + 1 : player.gamesLost,
            totalBet: player.totalBet + bet.betAmount,
          },
        });

        return {
          playerName: bet.playerName,
          prediction: bet.prediction,
          betAmount: bet.betAmount,
          winnings,
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
