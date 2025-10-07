import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    role?: string;
    playerId?: string | null;
    playerName?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      playerId?: string | null;
      playerName?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    playerId?: string | null;
    playerName?: string;
  }
}
