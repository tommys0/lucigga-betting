# Deployment Guide - Lucka Betting App

## Current Setup (Development)
- **Database**: SQLite (local file)
- **Environment**: Next.js development server

## Production Deployment to Vercel with Home Server Database

### Prerequisites
1. A database server running at your home (PostgreSQL or MySQL recommended)
2. Port forwarding configured on your router
3. Static IP or Dynamic DNS for your home server
4. Vercel account

### Step 1: Prepare Your Home Database Server

#### Option A: PostgreSQL (Recommended)
```bash
# Install PostgreSQL on your home server
# Create database
createdb lucka_betting

# Create user
createuser -P lucka_user
# Enter password when prompted

# Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE lucka_betting TO lucka_user;"
```

#### Option B: MySQL
```bash
# Install MySQL on your home server
# Create database and user
mysql -u root -p
CREATE DATABASE lucka_betting;
CREATE USER 'lucka_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON lucka_betting.* TO 'lucka_user'@'%';
FLUSH PRIVILEGES;
```

### Step 2: Configure Network Access
1. **Port Forwarding**: Forward port 5432 (PostgreSQL) or 3306 (MySQL) on your router
2. **Firewall**: Allow incoming connections on the database port
3. **Security**: Use strong passwords and consider SSL/TLS

### Step 3: Update Prisma Schema

Edit `prisma/schema.prisma`:

For PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

For MySQL:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Step 4: Update Environment Variables

Create `.env.production`:

For PostgreSQL:
```bash
DATABASE_URL="postgresql://lucka_user:your_password@your-home-ip:5432/lucka_betting"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_TRUST_HOST=true
```

For MySQL:
```bash
DATABASE_URL="mysql://lucka_user:your_password@your-home-ip:3306/lucka_betting"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_TRUST_HOST=true
```

### Step 5: Apply Database Migrations

```bash
# Apply migrations to remote database
npx prisma migrate deploy

# Seed initial data (creates admin user)
npm run seed
```

### Step 6: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - DATABASE_URL
# - AUTH_SECRET
# - AUTH_TRUST_HOST
```

### Step 7: Configure Vercel Environment Variables

In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - `DATABASE_URL`: Your connection string
   - `AUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `AUTH_TRUST_HOST`: `true`

## TV Display Setup

Once deployed, access the TV leaderboard at:
```
https://your-app.vercel.app/players
```

Open this URL on your TV browser for a live-updating leaderboard!

## Monitoring and Maintenance

### Database Backups
```bash
# PostgreSQL backup
pg_dump lucka_betting > backup_$(date +%Y%m%d).sql

# MySQL backup
mysqldump lucka_betting > backup_$(date +%Y%m%d).sql
```

### Check Connection Pooling
For production, consider using PgBouncer (PostgreSQL) or ProxySQL (MySQL) for connection pooling.

### Security Recommendations
1. Use SSL/TLS for database connections
2. Implement rate limiting
3. Regular security updates
4. Monitor failed login attempts
5. Regular database backups

## Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the admin password immediately after first deployment!

## Troubleshooting

### Cannot Connect to Database
- Check firewall rules
- Verify port forwarding
- Test connection: `telnet your-home-ip database-port`
- Check database logs

### Migration Issues
```bash
# Reset migrations (CAUTION: Deletes all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Vercel Build Errors
- Ensure all environment variables are set
- Check build logs in Vercel dashboard
- Verify database is accessible from Vercel's servers
