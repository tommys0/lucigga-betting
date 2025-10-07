# Vercel Deployment Guide

## ✅ Build Errors Fixed

Both Vercel build errors have been resolved:

1. **✅ bcryptjs Edge Runtime error** - Fixed by adding `export const runtime = 'nodejs'` to all API routes
2. **✅ TypeScript LibSQL error** - Fixed by disabling LibSQL adapter code

Your app now builds successfully! 🎉

---

## ⚠️ Important: Database Setup Required

**Vercel has a read-only filesystem**, which means SQLite won't work. You **must** use a cloud database.

### Recommended Options:

---

## Option 1: Turso (Easiest) ⭐ Recommended

**Why Turso?**
- ✅ Built on LibSQL (SQLite-compatible)
- ✅ Free tier: 500 MB, 1 billion row reads/month
- ✅ 5-minute setup
- ✅ No schema changes needed

### Setup Steps:

**1. Install Turso CLI:**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

**2. Sign up and create database:**
```bash
turso auth login
turso db create lucka-betting
```

**3. Get credentials:**
```bash
turso db show lucka-betting --url
turso db tokens create lucka-betting
```

You'll get:
- URL: `libsql://your-db.turso.io`
- Token: `eyJh...` (long string)

**4. Update Vercel environment variables:**

Go to your Vercel project settings → Environment Variables → Add:

```
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token-here
AUTH_SECRET=your-random-secret-key
AUTH_TRUST_HOST=true
```

**5. Update `lib/prisma.ts`:**

Uncomment and update the LibSQL adapter code:

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const tursoUrl = process.env.DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // Use Turso if configured
  if (tursoUrl && tursoUrl.startsWith("libsql://")) {
    const libsqlClient = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
    const adapter = new PrismaLibSQL(libsqlClient);
    return new PrismaClient({ adapter });
  }

  // Fallback for local development
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**6. Push your schema to Turso:**
```bash
# Install dependencies
npm install @libsql/client @prisma/adapter-libsql

# Set environment variables locally
export DATABASE_URL="libsql://your-db.turso.io"
export TURSO_AUTH_TOKEN="your-token"

# Push schema
npx prisma db push

# Create admin user
npm run seed
```

**7. Deploy to Vercel:**
```bash
git add .
git commit -m "Configure Turso database"
git push
```

Done! Your app will work on Vercel with Turso. 🎉

---

## Option 2: PostgreSQL (Neon)

**Why PostgreSQL?**
- ✅ Industry standard
- ✅ Battle-tested
- ✅ Free tier: 0.5 GB storage
- ✅ 10-minute setup

### Setup Steps:

**1. Sign up at https://neon.tech**

**2. Create a new project and database**

**3. Copy connection string**

It looks like: `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`

**4. Update `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**5. Regenerate Prisma client:**
```bash
npx prisma generate
```

**6. Push schema to Neon:**
```bash
export DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"
npx prisma db push
npm run seed
```

**7. Add to Vercel environment variables:**
```
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require
AUTH_SECRET=your-random-secret-key
AUTH_TRUST_HOST=true
```

**8. Deploy:**
```bash
git add .
git commit -m "Switch to PostgreSQL"
git push
```

---

## Environment Variables for Vercel

Make sure to set these in your Vercel project settings:

### For Turso:
```
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=eyJh...your-token
AUTH_SECRET=your-super-secret-key-change-this
AUTH_TRUST_HOST=true
```

### For PostgreSQL:
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
AUTH_SECRET=your-super-secret-key-change-this
AUTH_TRUST_HOST=true
```

### Generate AUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## Deployment Checklist

Before deploying to Vercel:

- [ ] Choose database (Turso or PostgreSQL)
- [ ] Sign up for chosen database service
- [ ] Create database and get credentials
- [ ] Update code if using PostgreSQL (schema.prisma)
- [ ] Run `npx prisma db push` with cloud database
- [ ] Run `npm run seed` to create admin user
- [ ] Set environment variables in Vercel
- [ ] Generate and set AUTH_SECRET
- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Test login with admin/admin123
- [ ] Test placing a bet

---

## Testing After Deployment

**1. Visit your Vercel URL:**
```
https://your-app.vercel.app
```

**2. Try to login:**
- Username: `admin`
- Password: `admin123`

**3. Test betting:**
- Check that betting window works (midnight-8AM)
- Place a bet
- Verify it saves to cloud database

**4. Check admin features:**
- Go to `/admin`
- Enter a game result
- Verify leaderboard updates

---

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

Run:
```bash
npx prisma generate
git add prisma/generated
git commit -m "Add Prisma generated files"
git push
```

### Error: "No database connection"

Check that:
1. Environment variables are set in Vercel
2. DATABASE_URL is correct
3. TURSO_AUTH_TOKEN is set (if using Turso)
4. Database schema was pushed (`npx prisma db push`)

### Error: "User not found"

Run the seed script against your cloud database:
```bash
export DATABASE_URL="your-cloud-db-url"
export TURSO_AUTH_TOKEN="your-token" # if using Turso
npm run seed
```

### Build fails on Vercel

Make sure all changes are committed:
```bash
git status
git add .
git commit -m "Fix build issues"
git push
```

---

## Files Modified for Vercel

1. **app/api/auth/[...nextauth]/route.ts** - Added `runtime = 'nodejs'`
2. **app/api/players/route.ts** - Added `runtime = 'nodejs'`
3. **app/api/games/route.ts** - Added `runtime = 'nodejs'`
4. **app/api/admin/users/route.ts** - Added `runtime = 'nodejs'`
5. **lib/prisma.ts** - Disabled LibSQL adapter (update for Turso)

---

## Quick Start (Turso)

```bash
# 1. Install Turso
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Setup database
turso auth login
turso db create lucka-betting

# 3. Get credentials
turso db show lucka-betting --url
turso db tokens create lucka-betting

# 4. Update lib/prisma.ts (see Option 1 above)

# 5. Install dependencies
npm install @libsql/client @prisma/adapter-libsql

# 6. Push schema
export DATABASE_URL="libsql://your-db.turso.io"
export TURSO_AUTH_TOKEN="your-token"
npx prisma db push
npm run seed

# 7. Set env vars in Vercel and deploy
git add .
git commit -m "Configure Turso"
git push
```

---

## Summary

✅ **What works now:**
- Build succeeds without errors
- bcryptjs works with Node.js runtime
- All TypeScript errors resolved

⚠️ **What you need to do:**
- Choose Turso or PostgreSQL
- Set up cloud database
- Update environment variables in Vercel
- Deploy!

Your app is ready for production deployment! 🚀
