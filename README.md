# ⏰ Lucka Betting - How Late Will She Be? 🎲

A fun multiplayer betting app where classmates can bet on how late Lucka will arrive to class!

## Features

### 🎮 **Core Betting System**
- Place bets on arrival time (minutes early/late)
- "Won't come" special bets for bonus points
- Smart betting windows:
  - Normal days: 6 PM - 8:20 AM
  - Fridays: 6 PM - 10:20 AM (school starts at 10:30)
- **Trip Mode**: Flexible betting for school trips (open 24/7)

### 🏆 **Persistent Points System**
- Simplified point formula: **10 - minutes off**
- Perfect prediction = 10 points
- 1 minute off = 9 points
- 5 minutes off = 5 points
- 10+ minutes off = 0 points
- "Won't come" correct = 15 points bonus
- All progress tracked in database

### 📊 **Statistics & Analytics**
- **Personal Stats** (`/stats`):
  - Win rate and total points earned
  - Average accuracy
  - Current win/loss streak
  - Best prediction ever
  - Recent 10 games history
  - Monthly performance breakdown

- **Player Profiles** (`/players`):
  - Browse all players with rankings
  - Top 3 podium display
  - Click any player to view their detailed stats
  - Individual performance metrics

- **Game History** (`/history`):
  - View all past games chronologically
  - Expandable game details
  - See all bets and results for each day
  - Winner highlights

- **Global Statistics** (`/global-stats`):
  - Average arrival time across all games
  - Average player predictions
  - "Didn't come" percentage
  - Most accurate player overall
  - Distribution charts for predictions vs reality
  - Total games and betting trends

### 📺 **TV Leaderboard Display**
- Live-updating leaderboard at `/players`
- Auto-refreshes every minute
- Shows rank, win/loss records, points
- Perfect for displaying on classroom TV

### 🔐 **User Authentication**
- Secure login system with NextAuth
- User and admin roles
- Password management
- 30-day persistent login (stay logged in!)

### ⚙️ **Admin Dashboard**
- Create and manage users
- Change passwords
- Link users to player profiles
- Delete users
- View today's bets in real-time
- Create trip mode games
- Reveal results and calculate points

### 📱 **Mobile PWA**
- Fully responsive design
- Add to home screen on iOS/Android
- Works like a native app
- Perfect for daily morning bets!

### 🌓 **Dark Mode**
- Full dark mode support
- Toggle between light/dark themes
- Preference saved automatically

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: SQLite (development), PostgreSQL/MySQL ready (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
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
   - Use the slider to predict how late Lucka will be (-30 to +120 minutes)
   - Or check "She won't come today" for a special 15-point bet
   - Click "Place Bet"
   - Change your bet anytime before betting closes
3. **Betting Hours**:
   - Opens: 6 PM daily
   - Closes: 8:20 AM (10:20 AM on Fridays)
   - Trip Mode: Open 24/7 during school trips
4. **View Results**:
   - Results automatically appear after admin reveals them
   - See your points earned and updated total
   - Check personal stats to track your performance

### For Admins

Access admin dashboard at `/admin`:
- **User Management**: Create, edit, delete users
- **Today's Session**: View all placed bets in real-time
- **Reveal Results**:
  - Enter actual arrival time
  - Or mark as "Didn't come"
  - Points automatically calculated and distributed
- **Trip Mode**: Create special games for school trips

### Statistics Pages

- **`/stats`**: Your personal betting history and stats
- **`/players`**: All players ranked (click to view individual profiles)
- **`/history`**: Browse all past games day-by-day
- **`/global-stats`**: Aggregate statistics across all games

### TV Display

Visit `/players` to display the leaderboard:
- Shows all players ranked by points
- Displays wins/losses and win rates
- Auto-refreshes every minute
- Optimized for TV display

### Mobile Access (PWA)

**Add to Home Screen:**
1. Open app on your phone's browser
2. Use "Add to Home Screen" option
3. App appears as an icon on your home screen
4. Opens like a native app!

**Benefits:**
- ✅ Stay logged in for 30 days
- ✅ Quick access each morning
- ✅ No need to type URL
- ✅ Full responsive design

See `PWA_SETUP.md` for detailed instructions!

## Point System

### Regular Bets
**Formula: 10 - minutes off**

- 🎯 **Exact match**: 10 points
- 📍 **1 minute off**: 9 points
- 📊 **2 minutes off**: 8 points
- 📉 **5 minutes off**: 5 points
- ❌ **10+ minutes off**: 0 points

### Special Bets
- 🌟 **"Won't come" (correct)**: 15 points
- ❌ **"Won't come" (wrong)**: 0 points

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
│   │   │   ├── current/           # Current game type (normal/trip)
│   │   │   └── history/           # Game history API
│   │   ├── stats/                 # Statistics APIs
│   │   │   └── global/            # Global aggregate stats
│   │   ├── bets/                  # Betting API
│   │   │   └── today/             # Today's bets
│   │   └── admin/                 # Admin APIs
│   ├── components/
│   │   ├── LuckaBetting.tsx       # Main betting component
│   │   ├── SessionProvider.tsx    # Auth session provider
│   │   └── ThemeProvider.tsx      # Dark mode provider
│   ├── login/                     # Login page
│   ├── admin/                     # Admin dashboard
│   ├── players/                   # Players list & profiles
│   │   └── [name]/                # Individual player pages
│   ├── stats/                     # Personal statistics
│   ├── history/                   # Game history
│   ├── global-stats/              # Global statistics
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

## Database Schema

### Models
- **User**: Authentication and login
- **Player**: Game statistics and points
- **Game**: Individual game sessions (normal/trip mode)
- **Bet**: Player predictions and results

### Key Fields
- `Game.gameType`: "normal" or "trip"
- `Game.actualTime`: Actual arrival time (null if didn't come)
- `Game.didntCome`: Boolean flag
- `Bet.isWontComeBet`: Special "won't come" bet
- `Bet.winnings`: Points earned from bet

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

# Generate Prisma client after schema changes
npx prisma generate
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
- Session tokens expire after 30 days

## New Features Log

### Recent Updates
- ✅ Trip mode for flexible betting during school trips
- ✅ Personal statistics page with streaks and best predictions
- ✅ Player profiles with detailed performance metrics
- ✅ Game history with expandable day-by-day view
- ✅ Global statistics with aggregate analysis
- ✅ Distribution charts for predictions vs reality
- ✅ Most accurate player tracking
- ✅ Monthly performance breakdown
- ✅ Friday special hours (10:20 AM closing)
- ✅ "Won't come" special bets
- ✅ Fixed duplicate game creation bug

## Contributing

This is a class project. Have fun and bet responsibly! 🎉

---

Made with ❤️ for predicting Lucka's arrival time
