-- LibSQL Database Schema for Lucka Betting App
-- Run this on your LibSQL server at http://144.24.180.143:25569/

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS Bet;
DROP TABLE IF EXISTS Game;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Player;

-- Create Player table
CREATE TABLE Player (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    points INTEGER NOT NULL DEFAULT 1000,
    gamesWon INTEGER NOT NULL DEFAULT 0,
    gamesLost INTEGER NOT NULL DEFAULT 0,
    totalBet INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create User table
CREATE TABLE User (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    playerId TEXT UNIQUE,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (playerId) REFERENCES Player(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Game table
CREATE TABLE Game (
    id TEXT PRIMARY KEY NOT NULL,
    actualTime INTEGER NOT NULL,
    playedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create Bet table
CREATE TABLE Bet (
    id TEXT PRIMARY KEY NOT NULL,
    playerId TEXT NOT NULL,
    gameId TEXT NOT NULL,
    prediction INTEGER NOT NULL,
    betAmount INTEGER NOT NULL,
    winnings INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (playerId) REFERENCES Player(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (gameId) REFERENCES Game(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_user_username ON User(username);
CREATE INDEX idx_user_playerId ON User(playerId);
CREATE INDEX idx_player_name ON Player(name);
CREATE INDEX idx_bet_playerId ON Bet(playerId);
CREATE INDEX idx_bet_gameId ON Bet(gameId);
CREATE INDEX idx_game_playedAt ON Game(playedAt);

-- Insert default admin user
-- Password: admin123 (bcrypt hash)
INSERT INTO User (id, username, password, role, playerId, createdAt, updatedAt)
VALUES (
    'admin_' || lower(hex(randomblob(8))),
    'admin',
    '$2a$10$rGH9j5nZ4vE.wqJXB1xRcOzHVpY5KqE8K6kNj9vBqwQwXvJ1YP0cK',
    'admin',
    NULL,
    datetime('now'),
    datetime('now')
);

-- Success message
SELECT 'Database schema created successfully!' as message;
SELECT 'Admin user created: username=admin, password=admin123' as message;
