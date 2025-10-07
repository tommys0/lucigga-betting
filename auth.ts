import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
          include: { player: true },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.username,
          role: user.role,
          playerId: user.playerId,
          playerName: user.player?.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.playerId = user.playerId;
        token.playerName = user.playerName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.playerId = token.playerId as string | null;
        session.user.playerName = token.playerName as string | undefined;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth;

      // Public routes
      const publicRoutes = ['/login', '/register', '/players', '/api/players', '/api/register'];
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

      // Admin routes
      const isAdminRoute = pathname.startsWith('/admin');

      // Allow access to public routes
      if (isPublicRoute) return true;

      // Redirect to login if not authenticated
      if (!isLoggedIn) return false;

      // Check admin access
      if (isAdminRoute && auth.user?.role !== 'admin') {
        return false;
      }

      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
});
