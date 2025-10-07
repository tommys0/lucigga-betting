# ⏰ Lucka Betting - How Late Will She Be? 🎲

A fun multiplayer betting app where classmates can bet on how late Lucka will arrive to class!

## Features

✨ **Multi-Player Betting System**
- Place bets on arrival time (minutes early/late)
- Support for multiple players per game
- Bulk bet import via paste

🏆 **Persistent Points System**
- Players start with 1000 points
- Points tracked in database across games
- Win/loss records maintained

📺 **TV Leaderboard Display**
- Live-updating leaderboard at `/players`
- Auto-refreshes every 5 seconds
- Perfect for displaying on classroom TV

🔐 **User Authentication**
- Secure login system with NextAuth
- User and admin roles
- Password management

⚙️ **Admin Dashboard**
- Create and manage users
- Change passwords
- Link users to player profiles
- Delete users

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: SQLite (development), PostgreSQL/MySQL ready (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Seed admin user
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Login

**Admin Account:**
- Username: `admin`
- Password: `admin123`

⚠️ Change this password immediately after first use!

## Usage

### For Players

1. **Login** at `/login` with your username and password
2. **Place Bets**:
   - Enter your player name (or it will auto-fill if linked to your account)
   - Use the slider to predict how late Lucka will be
   - Set your bet amount (points)
   - Click "Add Bet"
3. **Bulk Import** (optional):
   - Format: `Name: minutes, amount` per line
   - Example: `Tommy: -5, 100` (Tommy bets 100 points that Lucka is 5 min early)
4. **When Lucka Arrives**:
   - Enter actual time (negative = early, positive = late, 0 = on time)
   - Click "Reveal Results"
   - Points automatically updated!

### For Admins

Access admin dashboard at `/admin`:
- Create new users
- Change passwords
- Link users to player profiles
- View all users

### TV Display

Visit `/players` to display the leaderboard:
- Shows all players ranked by points
- Displays wins/losses
- Auto-refreshes every 5 seconds
- Optimized for TV display

## Payout Structure

- 🎯 **Exact match**: 10x payout
- 🎲 **1 minute off**: 5x payout
- 🎪 **2 minutes off**: 3x payout
- 🎨 **3 minutes off**: 2x payout
- 🎭 **4-5 minutes off**: 1.5x payout
- ❌ **More than 5 minutes off**: Loss

## Database

Currently using SQLite for development. To switch to a remote database for production:

1. See `DEPLOYMENT.md` for detailed instructions
2. Update `prisma/schema.prisma` datasource
3. Update `DATABASE_URL` in `.env`
4. Run migrations: `npx prisma migrate deploy`
5. Seed data: `npm run seed`

## File Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth API route
│   │   ├── players/               # Player data API
│   │   ├── games/                 # Game processing API
│   │   └── admin/users/           # Admin user management API
│   ├── components/
│   │   ├── LuckaBetting.tsx       # Main betting component
│   │   └── SessionProvider.tsx    # Auth session provider
│   ├── login/                     # Login page
│   ├── admin/                     # Admin dashboard
│   ├── players/                   # TV leaderboard display
│   └── page.tsx                   # Home page
├── lib/
│   └── prisma.ts                  # Prisma client
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Seed script
│   └── migrations/                # Database migrations
├── auth.ts                        # NextAuth configuration
├── middleware.ts                  # Route protection
└── DEPLOYMENT.md                  # Production deployment guide
```

## Development

```bash
# Run development server
npm run dev

# Run Prisma Studio (database GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset
```

## Deployment

See `DEPLOYMENT.md` for detailed instructions on deploying to Vercel with a home server database.

## Security Notes

- All passwords are hashed with bcrypt
- Authentication required for betting
- Admin routes protected by role-based access
- Middleware enforces authentication
- Change default admin password in production
- Use strong `AUTH_SECRET` in production

## Contributing

This is a class project. Have fun and bet responsibly! 🎉
# lucigga-betting
