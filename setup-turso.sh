#!/bin/bash

# Turso Database Setup Script
# Run this after creating your Turso database

echo "🚀 Turso Database Setup"
echo "======================="
echo ""

# Check if Turso CLI is installed
if ! command -v turso &> /dev/null; then
    echo "❌ Turso CLI not found!"
    echo "Install it with: curl -sSfL https://get.tur.so/install.sh | bash"
    exit 1
fi

echo "✅ Turso CLI found"
echo ""

# Prompt for database name
read -p "Enter your Turso database name (e.g., lucka-betting): " DB_NAME

if [ -z "$DB_NAME" ]; then
    echo "❌ Database name is required!"
    exit 1
fi

echo ""
echo "📡 Fetching database credentials..."

# Get database URL
DB_URL=$(turso db show $DB_NAME --url 2>/dev/null)
if [ -z "$DB_URL" ]; then
    echo "❌ Could not get database URL. Make sure the database exists."
    echo "Create it with: turso db create $DB_NAME"
    exit 1
fi

# Create auth token
echo "🔑 Creating auth token..."
AUTH_TOKEN=$(turso db tokens create $DB_NAME 2>/dev/null)
if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Could not create auth token."
    exit 1
fi

echo ""
echo "✅ Credentials fetched successfully!"
echo ""
echo "📝 Your credentials:"
echo "DATABASE_URL=$DB_URL"
echo "TURSO_AUTH_TOKEN=$AUTH_TOKEN"
echo ""

# Update .env file
echo "📝 Updating .env file..."
if grep -q "^DATABASE_URL=" .env; then
    # Comment out old DATABASE_URL
    sed -i.backup 's/^DATABASE_URL=/#DATABASE_URL=/' .env
fi

# Add Turso credentials
echo "" >> .env
echo "# Turso Database (for Vercel deployment)" >> .env
echo "DATABASE_URL=\"$DB_URL\"" >> .env
echo "TURSO_AUTH_TOKEN=\"$AUTH_TOKEN\"" >> .env

echo "✅ .env file updated!"
echo ""

# Export for current session
export DATABASE_URL="$DB_URL"
export TURSO_AUTH_TOKEN="$AUTH_TOKEN"

# Push schema
echo "📤 Pushing database schema to Turso..."
npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema"
    exit 1
fi

echo ""
echo "✅ Schema pushed successfully!"
echo ""

# Seed database
echo "🌱 Seeding database with admin user..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Vercel project settings"
echo "2. Add these environment variables:"
echo "   DATABASE_URL=$DB_URL"
echo "   TURSO_AUTH_TOKEN=$AUTH_TOKEN"
echo "   AUTH_SECRET=your-random-secret-key"
echo "   AUTH_TRUST_HOST=true"
echo ""
echo "3. Generate AUTH_SECRET with: openssl rand -base64 32"
echo ""
echo "4. Deploy to Vercel:"
echo "   git add ."
echo "   git commit -m 'Configure Turso database'"
echo "   git push"
echo ""
echo "5. Test your app at: https://your-app.vercel.app"
echo ""
