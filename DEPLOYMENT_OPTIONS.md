# Deployment Options - LibSQL Issue & Solutions

## ⚠️ Current Issue

The LibSQL HTTP adapter has compatibility issues with Next.js 15 + Turbopack:
- The adapter initializes successfully
- But the LibSQL client internally receives `undefined` for configuration
- This is a known issue with how Turbopack bundles external packages

**Error:** `URL_INVALID: The URL 'undefined' is not in a valid format`

## ✅ Working Solutions

### Option 1: Use Turso (Recommended - Easiest)

Turso is the managed LibSQL service with better Next.js compatibility.

**Steps:**

1. **Sign up for Turso:**
   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash

   # Login
   turso auth login

   # Create database
   turso db create lucka-betting

   # Get connection details
   turso db show lucka-betting
   ```

2. **Get your database URL and token:**
   ```bash
   turso db show lucka-betting --url
   turso db tokens create lucka-betting
   ```

3. **Update `.env`:**
   ```
   LIBSQL_URL="libsql://your-db.turso.io"
   LIBSQL_AUTH_TOKEN="your-token-here"
   ```

4. **Update `lib/prisma.ts`:**
   ```typescript
   const libsqlClient = createClient({
     url: process.env.LIBSQL_URL,
     authToken: process.env.LIBSQL_AUTH_TOKEN,
   });
   ```

5. **Push schema:**
   ```bash
   npx prisma db push
   npm run seed
   ```

**Pros:**
- ✅ Free tier available
- ✅ Works with Next.js/Turbopack
- ✅ Global replication
- ✅ Automatic backups
- ✅ Easy setup

**Cons:**
- ⚠️ Requires internet connection
- ⚠️ Free tier limits (500 MB, 1 billion row reads/month)

---

### Option 2: Deploy Without Turbopack

Use regular webpack instead of Turbopack for production.

**Steps:**

1. **Update `package.json` scripts:**
   ```json
   {
     "scripts": {
       "dev": "next dev",  // Remove --turbopack for dev too
       "build": "next build",  // This already uses webpack
       "start": "next start"
     }
   }
   ```

2. **Uncomment LIBSQL_URL in `.env`:**
   ```
   LIBSQL_URL="http://144.24.180.143:25569/"
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **For production:**
   ```bash
   npm run build
   npm start
   ```

**Pros:**
- ✅ Uses your self-hosted LibSQL
- ✅ No external dependencies
- ✅ Full control

**Cons:**
- ⚠️ Slower dev server (webpack vs turbopack)
- ⚠️ May still have issues with LibSQL HTTP adapter

---

### Option 3: Use PostgreSQL/MySQL Instead

Switch to a traditional database with better Next.js support.

**For PostgreSQL (Neon):**

1. **Sign up at https://neon.tech** (free tier)

2. **Get connection string**

3. **Update `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Update `.env`:**
   ```
   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
   ```

5. **Push schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

**For MySQL (PlanetScale):**

Similar process with `provider = "mysql"`

**Pros:**
- ✅ Mature, stable, well-supported
- ✅ Works perfectly with Next.js
- ✅ Generous free tiers
- ✅ Good performance

**Cons:**
- ⚠️ Not SQLite-compatible
- ⚠️ Slightly different features

---

### Option 4: Local SQLite Only (Current Setup)

Keep using local SQLite for development.

**For Production:**
- Deploy SQLite file with your app
- Works on platforms like Fly.io, Railway, or VPS
- Not recommended for Vercel (read-only filesystem)

**Pros:**
- ✅ Simple, no external services
- ✅ Fast
- ✅ Currently working

**Cons:**
- ⚠️ No replication
- ⚠️ Single point of failure
- ⚠️ Harder to backup
- ⚠️ Can't deploy to Vercel easily

---

### Option 5: Wait for LibSQL HTTP Fix

The LibSQL + Turbopack issue may be fixed in future updates.

Monitor these repos:
- https://github.com/tursodatabase/libsql
- https://github.com/prisma/prisma
- https://github.com/vercel/next.js

---

## 📊 Comparison Table

| Solution | Difficulty | Cost | Works Now | Best For |
|----------|-----------|------|-----------|----------|
| **Turso** | ⭐ Easy | Free tier | ✅ Yes | Most users |
| **No Turbopack** | ⭐⭐ Medium | Free | ⚠️ Maybe | Self-hosted fans |
| **PostgreSQL** | ⭐⭐ Medium | Free tier | ✅ Yes | Production apps |
| **Local SQLite** | ⭐ Easy | Free | ✅ Yes | Dev/small projects |
| **Wait for fix** | ⭐ Easy | Free | ❌ No | Patient users |

---

## 🎯 My Recommendation

**For your use case** (school project, classmates betting):

### Best Option: **Turso** 🏆

Why?
1. Free tier is generous (more than enough for a class)
2. Works perfectly with Next.js 15 + Turbopack
3. Easy to set up (5 minutes)
4. No need to self-host
5. Automatic backups
6. Can still use your LibSQL server later when compatibility improves

### Alternative: **PostgreSQL (Neon)** 🥈

Why?
1. Battle-tested, no compatibility issues
2. Free tier: 0.5 GB storage, 100k rows
3. Works everywhere (Vercel, etc.)
4. Better ecosystem support

---

## 🚀 Quick Start: Turso Setup (5 minutes)

```bash
# 1. Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Login
turso auth login

# 3. Create database
turso db create lucka-betting

# 4. Get credentials
turso db show lucka-betting --url
turso db tokens create lucka-betting

# 5. Update .env
echo 'LIBSQL_URL="libsql://your-db.turso.io"' >> .env
echo 'LIBSQL_AUTH_TOKEN="your-token"' >> .env

# 6. Update lib/prisma.ts (add authToken line)
# 7. Push schema
npx prisma db push

# 8. Seed admin user
npm run seed

# 9. Done! Test your app
npm run dev
```

---

## 📝 Your Current Setup

**Docker LibSQL Server:**
- Running at: http://144.24.180.143:25569/
- Database: `/var/lib/sqld/data.db`
- Issue: HTTP adapter incompatible with Turbopack

**What to do:**
1. Keep your Docker server running (it's fine!)
2. Use Turso for the Next.js app (easiest)
3. When LibSQL/Turbopack is fixed, switch back to self-hosted
4. Or use your Docker LibSQL with a different deployment method (no Turbopack)

---

## 💬 Need Help Deciding?

**Questions to ask yourself:**

1. **Do you need it to work RIGHT NOW?**
   - Yes → Use Turso or PostgreSQL
   - No → Wait for fix, use local SQLite

2. **Do you want to self-host?**
   - Yes → Deploy without Turbopack OR use PostgreSQL on your server
   - No → Turso (still LibSQL, but managed)

3. **Is this for production?**
   - Yes → Turso or PostgreSQL
   - No (just school project) → Local SQLite is fine!

4. **Do you like bleeding-edge tech?**
   - Yes → Keep troubleshooting LibSQL HTTP
   - No → PostgreSQL (stable)

---

## 🛠️ Current Status

- ✅ Slider: -30 to 120 minutes working
- ✅ Time-based betting working
- ✅ Auto-login working
- ✅ Local SQLite working perfectly
- ❌ LibSQL HTTP + Turbopack not compatible yet
- ✅ Alternative solutions available

**You can use the app right now with local SQLite!** The LibSQL migration is optional for production deployment.
