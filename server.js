// server.js - Main backend server for Web3 MMO
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { ethers } = require('ethers');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Game state
const gameState = {
  players: new Map(),
  rooms: new Map(),
  battles: new Map()
};

// Polygon Amoy configuration
const POLYGON_RPC = 'https://rpc-amoy.polygon.technology/';
const provider = new ethers.JsonRpcProvider(POLYGON_RPC);

// Game constants
const GAME_CONFIG = {
  WORLD_WIDTH: 2000,
  WORLD_HEIGHT: 2000,
  MAX_PLAYERS_PER_ROOM: 50,
  PLAYER_SPEED: 200,
  ATTACK_RANGE: 100,
  RESPAWN_TIME: 5000
};

// Utility functions
function generatePlayerId(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isValidPolygonAddress(address) {
  return ethers.isAddress(address);
}

function calculateDistance(pos1, pos2) {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}

function sanitizeMessage(message) {
  return message.replace(/<[^>]*>/g, '').substring(0, 100);
}

// Player class
class Player {
  constructor(socketId, walletAddress) {
    this.socketId = socketId;
    this.walletAddress = walletAddress;
    this.id = generatePlayerId(walletAddress);
    this.name = `Warrior_${walletAddress.slice(-4)}`;
    this.x = Math.random() * GAME_CONFIG.WORLD_WIDTH;
    this.y = Math.random() * GAME_CONFIG.WORLD_HEIGHT;
    this.health = 100;
    this.maxHealth = 100;
    this.mana = 100;
    this.maxMana = 100;
    this.level = 1;
    this.experience = 0;
    this.gold = 0;
    this.isAlive = true;
    this.lastAttack = 0;
    this.lastMovement = Date.now();
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.isAlive = false;
      this.respawn();
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  respawn() {
    setTimeout(() => {
      this.health = this.maxHealth;
      this.mana = this.maxMana;
      this.isAlive = true;
      this.x = Math.random() * GAME_CONFIG.WORLD_WIDTH;
      this.y = Math.random() * GAME_CONFIG.WORLD_HEIGHT;
    }, GAME_CONFIG.RESPAWN_TIME);
  }

  getPublicData() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      health: this.health,
      maxHealth: this.maxHealth,
      level: this.level,
      isAlive: this.isAlive
    };
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    players: gameState.players.size,
    timestamp: Date.now()
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalPlayers: gameState.players.size,
    activeBattles: gameState.battles.size,
    rooms: gameState.rooms.size
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('authenticate', async (data) => {
    try {
      const { walletAddress } = data;
      
      if (!isValidPolygonAddress(walletAddress)) {
        socket.emit('auth_error', { message: 'Invalid wallet address' });
        return;
      }

      // Create new player
      const player = new Player(socket.id, walletAddress);
      gameState.players.set(socket.id, player);

      // Join default room
      socket.join('main_room');
      
      // Send player data
      socket.emit('authenticated', {
        player: player.getPublicData(),
        gameConfig: GAME_CONFIG
      });

      // Broadcast new player to others
      socket.to('main_room').emit('player_joined', player.getPublicData());

      // Send existing players to new player
      const existingPlayers = Array.from(gameState.players.values())
        .filter(p => p.socketId !== socket.id)
        .map(p => p.getPublicData());
      
      socket.emit('existing_players', existingPlayers);

      console.log(`Player authenticated: ${player.name} (${walletAddress})`);

    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  socket.on('move', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player || !player.isAlive) return;

    const now = Date.now();
    if (now - player.lastMovement < 50) return; // Rate limit movement

    const { x, y } = data;
    
    // Validate movement bounds
    if (x >= 0 && x <= GAME_CONFIG.WORLD_WIDTH && 
        y >= 0 && y <= GAME_CONFIG.WORLD_HEIGHT) {
      
      player.x = x;
      player.y = y;
      player.lastMovement = now;

      // Broadcast movement to other players
      socket.to('main_room').emit('player_moved', {
        id: player.id,
        x: player.x,
        y: player.y
      });
    }
  });

  socket.on('chat_message', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const { message } = data;
    const sanitizedMessage = sanitizeMessage(message);
    
    if (sanitizedMessage.length > 0) {
      io.to('main_room').emit('chat_message', {
        playerId: player.id,
        playerName: player.name,
        message: sanitizedMessage,
        timestamp: Date.now()
      });
    }
  });

  socket.on('disconnect', () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      console.log(`Player disconnected: ${player.name}`);
      
      // Remove player from game state
      gameState.players.delete(socket.id);
      
      // Notify other players
      socket.to('main_room').emit('player_left', { playerId: player.id });
    }
  });
});

// Game loop for server-side updates
setInterval(() => {
  // Regenerate mana for all players
  gameState.players.forEach(player => {
    if (player.isAlive && player.mana < player.maxMana) {
      player.mana = Math.min(player.maxMana, player.mana + 1);
    }
  });
  
  // Send periodic updates to clients
  io.to('main_room').emit('server_update', {
    timestamp: Date.now(),
    playerCount: gameState.players.size
  });
}, 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Web3 MMO Server running on port ${PORT}`);
  console.log(`📊 Game Stats: Max ${GAME_CONFIG.MAX_PLAYERS_PER_ROOM} players per room`);
});
