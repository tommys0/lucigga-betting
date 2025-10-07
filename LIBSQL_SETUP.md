# LibSQL Database Setup

## Current Status

The app is currently using **local SQLite** database (`prisma/dev.db`). The LibSQL remote database integration had issues and has been temporarily disabled.

## What Was Fixed

### 1. **Turbopack/LibSQL Adapter Issue**
The main issue was that the `@libsql/client` package was causing errors in Turbopack:
- **Error**: `URL_INVALID: The URL 'undefined' is not in a valid format`
- **Root Cause**: The LibSQL client internally tried to access undefined properties during initialization
- **Current Solution**: Temporarily disabled LibSQL by commenting out `LIBSQL_URL` in `.env`

### 2. **Middleware Edge Runtime Issue**
NextAuth middleware was trying to use Prisma in edge runtime, which doesn't support database adapters:
- **Fixed**: Updated `auth.ts` to use `authorized` callback instead of custom middleware logic
- **Fixed**: Updated `middleware.ts` to use the simpler NextAuth export pattern

### 3. **Database Setup**
- Created local SQLite database with `npx prisma migrate deploy`
- Seeded admin user with `npm run seed`
- App is now fully functional with local database

## How to Enable LibSQL Remote Database

To use your remote LibSQL server at `http://144.24.180.143:25569/`, you need to:

### Option 1: Fix the LibSQL Adapter (Recommended for Production)

1. **Verify the remote server is accessible**:
   ```bash
   curl http://144.24.180.143:25569/
   ```

2. **Check if the server requires authentication**:
   If your LibSQL server requires an auth token:
   ```bash
   # Add to .env:
   LIBSQL_AUTH_TOKEN="your-token-here"
   ```

3. **Update lib/prisma.ts** to include auth token:
   ```typescript
   const libsqlClient = createClient({
     url: libsqlUrl,
     authToken: process.env.LIBSQL_AUTH_TOKEN,
   });
   ```

4. **Uncomment the LIBSQL_URL in .env**:
   ```
   LIBSQL_URL="http://144.24.180.143:25569/"
   ```

5. **Migrate the remote database**:
   Since LibSQL over HTTP doesn't support `prisma migrate`, you'll need to either:
   - Use the LibSQL CLI to run migrations manually
   - Use Turso CLI if you're using Turso
   - Or connect directly to the database file on the server

### Option 2: Use Turso (Easiest for Remote LibSQL)

Turso is the managed service for LibSQL:

1. **Sign up** for Turso at https://turso.tech
2. **Create a database**
3. **Get your database URL and auth token**:
   ```bash
   turso db show your-db-name
   ```
4. **Update .env**:
   ```
   LIBSQL_URL="libsql://your-db.turso.io"
   LIBSQL_AUTH_TOKEN="your-turso-token"
   ```
5. **Push schema** using Prisma:
   ```bash
   npx prisma db push
   ```

### Option 3: Keep Using Local SQLite (Simplest for Development)

If you're just developing locally and don't need a remote database:

1. Keep the current setup (LIBSQL_URL commented out)
2. Use `prisma/dev.db` for local development
3. When deploying to production, use a proper database service (Turso, Neon, PlanetScale, etc.)

## Troubleshooting LibSQL

If you re-enable LIBSQL_URL and encounter issues:

### Check the server logs:
```bash
# Look for:
# - "Initializing LibSQL adapter with URL: ..."
# - Any error messages from @libsql/client
```

### Common issues:

1. **URL_INVALID error**:
   - Make sure the URL is accessible
   - Check if authentication is required
   - Verify the URL format is correct (should start with `http://` or `libsql://`)

2. **Connection timeout**:
   - Check network connectivity to the server
   - Verify firewall rules allow access to port 25569

3. **Schema doesn't exist**:
   - The remote database needs to have the schema created
   - You'll need to manually create tables or use LibSQL CLI

## Current Configuration

**.env file** (current working setup):
```
DATABASE_URL="file:./dev.db"
# LIBSQL_URL="http://144.24.180.143:25569/"  # Temporarily disabled

AUTH_SECRET="your-super-secret-key-change-this-in-production"
AUTH_TRUST_HOST=true
```

**lib/prisma.ts**:
- Automatically falls back to local SQLite if LIBSQL_URL is not set
- Includes error handling and logging for debugging

## Recommendation

For **development**: Keep using local SQLite (current setup) ✅

For **production deployment**:
1. Use Turso (managed LibSQL)
2. Or migrate to PostgreSQL/MySQL for easier management
3. Update DATABASE_URL in production environment

The app is fully functional with local SQLite, so you can continue development without any issues!
