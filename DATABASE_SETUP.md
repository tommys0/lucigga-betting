# LibSQL Database Setup Guide

## ✅ What's Been Done

1. **Slider Updated**: Range is now -30 to 120 minutes ✅
2. **LibSQL Enabled**: Connection to `http://144.24.180.143:25569/` is active ✅
3. **SQL Schema Created**: `schema.sql` file ready to run ✅

## 📋 Next Steps: Setup Database on Your Server

Your LibSQL server is running in Docker with:
- Port: 25569 (host) → 8080 (container)
- Database: `/var/lib/sqld/data.db`
- No authentication required

### Option 1: Run SQL via Docker CLI (Recommended)

**Step 1:** Access your LibSQL container:
```bash
docker exec -it libsql-server /bin/sh
```

**Step 2:** Use the `sqld` CLI to execute SQL:
```bash
# Connect to the database
sqlite3 /var/lib/sqld/data.db
```

**Step 3:** Copy and paste the SQL commands from `schema.sql` into the SQLite prompt.

Or run it directly:
```bash
# Copy the schema.sql file to the container first
docker cp schema.sql libsql-server:/tmp/schema.sql

# Then execute it
docker exec libsql-server sqlite3 /var/lib/sqld/data.db < /tmp/schema.sql
```

### Option 2: Use HTTP API

If you prefer to use the HTTP API, run this from your machine:

```bash
# Install curl if not already installed
# Then run:

curl -X POST http://144.24.180.143:25569/ \
  -H "Content-Type: application/json" \
  -d '{
    "statements": [
      "CREATE TABLE Player (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, points INTEGER DEFAULT 1000, gamesWon INTEGER DEFAULT 0, gamesLost INTEGER DEFAULT 0, totalBet INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('\''now'\'')), updatedAt TEXT DEFAULT (datetime('\''now'\'')))",
      "CREATE TABLE User (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT '\''user'\'', playerId TEXT UNIQUE, createdAt TEXT DEFAULT (datetime('\''now'\'')), updatedAt TEXT DEFAULT (datetime('\''now'\'')), FOREIGN KEY (playerId) REFERENCES Player(id))",
      "CREATE TABLE Game (id TEXT PRIMARY KEY, actualTime INTEGER NOT NULL, playedAt TEXT DEFAULT (datetime('\''now'\'')))",
      "CREATE TABLE Bet (id TEXT PRIMARY KEY, playerId TEXT NOT NULL, gameId TEXT NOT NULL, prediction INTEGER NOT NULL, betAmount INTEGER NOT NULL, winnings INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('\''now'\'')), FOREIGN KEY (playerId) REFERENCES Player(id), FOREIGN KEY (gameId) REFERENCES Game(id))",
      "INSERT INTO User (id, username, password, role) VALUES ('\''admin_' || lower(hex(randomblob(8))))'\'', '\''admin'\'', '\'$2a$10$rGH9j5nZ4vE.wqJXB1xRcOzHVpY5KqE8K6kNj9vBqwQwXvJ1YP0cK'\'', '\''admin'\'')"
    ]
  }'
```

### Option 3: Use LibSQL Client (Easiest)

Install the LibSQL client on your machine:

```bash
# Install libsql CLI
npm install -g @libsql/client-cli

# Or use curl to download
curl -L https://github.com/tursodatabase/libsql/releases/latest/download/sqld-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m) -o sqld
chmod +x sqld
```

Then connect and run the schema:

```bash
# Connect to your server
./sqld http://144.24.180.143:25569

# Paste the SQL from schema.sql
```

## 🧪 Testing the Connection

After setting up the database, test it from your Next.js app:

```bash
# Restart the dev server
npm run dev
```

Watch the logs. You should see:
```
✓ Initializing LibSQL adapter with URL: http://144.24.180.143:25569/
✓ LibSQL adapter created successfully
```

Then try to login at http://localhost:3000/login with:
- Username: `admin`
- Password: `admin123`

If it works, you're connected to the remote database! 🎉

## 🔍 Verify Database Setup

Check if tables were created:

```bash
docker exec libsql-server sqlite3 /var/lib/sqld/data.db ".tables"
```

You should see:
```
Bet     Game    Player  User
```

Check admin user:

```bash
docker exec libsql-server sqlite3 /var/lib/sqld/data.db "SELECT username, role FROM User WHERE role='admin';"
```

You should see:
```
admin|admin
```

## 📊 Data Migration (Optional)

If you have data in your local SQLite (`prisma/dev.db`) that you want to migrate:

**Step 1:** Export from local database:
```bash
sqlite3 prisma/dev.db .dump > local_data.sql
```

**Step 2:** Import to remote database:
```bash
docker cp local_data.sql libsql-server:/tmp/local_data.sql
docker exec libsql-server sqlite3 /var/lib/sqld/data.db < /tmp/local_data.sql
```

## 🚨 Troubleshooting

### Error: "URL_INVALID"
- Check that your server is running: `docker ps | grep libsql`
- Test connection: `curl http://144.24.180.143:25569/health`

### Error: "Connection refused"
- Make sure port 25569 is open on your firewall
- Check Docker port mapping: `docker port libsql-server`

### Error: "Table already exists"
- The database already has tables
- Either drop them first or skip table creation

### Need to Reset Everything?
```bash
# Stop container
docker stop libsql-server

# Remove data
rm -rf ./data/*

# Start fresh
docker-compose up -d

# Run schema.sql again
```

## ✅ Success Checklist

- [ ] LibSQL server running in Docker
- [ ] Database schema created (4 tables)
- [ ] Admin user exists
- [ ] Next.js app connects successfully
- [ ] Can login with admin/admin123
- [ ] Can place bets
- [ ] Data persists between restarts

## 🌐 Production Deployment

When deploying to Vercel:

1. **Update `.env` on Vercel:**
   ```
   LIBSQL_URL=http://144.24.180.143:25569/
   DATABASE_URL=file:./dev.db
   AUTH_SECRET=your-production-secret-key
   AUTH_TRUST_HOST=true
   ```

2. **Make sure your server is accessible:**
   - Open port 25569 on your home router
   - Consider using a dynamic DNS service if your home IP changes
   - Or use Tailscale/ZeroTier for secure remote access

3. **Security recommendations:**
   - Add authentication to LibSQL (set SQLD_AUTH_TOKEN in docker-compose.yml)
   - Use HTTPS instead of HTTP (add SSL certificates)
   - Restrict access to specific IPs
   - Change admin password!

## 📝 Current Configuration

**Your Docker Compose:**
```yaml
services:
  libsql-server:
    image: ghcr.io/tursodatabase/libsql-server:latest
    container_name: libsql-server
    ports:
      - "25569:8080"
    volumes:
      - ./data:/var/lib/sqld
    environment:
      - SQLD_NODE=primary
      - SQLD_DB_PATH=/var/lib/sqld/data.db
```

**Connection String:**
```
http://144.24.180.143:25569/
```

**Database Location:**
```
./data/data.db (on host)
/var/lib/sqld/data.db (in container)
```

---

Need help? Check the logs:
```bash
# App logs
npm run dev

# Docker logs
docker logs libsql-server

# Database logs
docker exec libsql-server cat /var/lib/sqld/logs/sqld.log
```
