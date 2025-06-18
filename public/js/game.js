// Core Game Logic
class GameManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.lastUpdate = Date.now();
        this.running = false;
    }

    async initializeGame() {
        const canvas = document.getElementById('gameCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        gameState.canvas = canvas;
        gameState.ctx = this.ctx;

        // Setup event listeners
        this.setupEventListeners();
        
        // Generate terrain
        terrainManager.generateTerrain();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            gameState.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Enter') {
                const chatInput = document.getElementById('chatInput');
                if (document.activeElement !== chatInput) {
                    chatInput.focus();
                } else {
                    uiManager.sendChatMessage();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            gameState.keys[e.key.toLowerCase()] = false;
        });

        // Mouse controls
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.performAttack(x, y);
        });

        // Chat input
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                uiManager.sendChatMessage();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            terrainManager.generateTerrain();
        });
    }

    startGame() {
        gameState.connected = true;
        uiManager.updateUI();
        
        // Add some mock players for demo
        this.addMockPlayers();
        
        // Start game loop
        this.running = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.running) return;

        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        
        if (deltaTime > 16) { // ~60 FPS
            this.update(deltaTime);
            this.render();
            this.lastUpdate = now;
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update player position
        this.updatePlayerMovement(deltaTime);
        
        // Update game entities
        this.updatePlayers(deltaTime);
        
        // Update effects
        effectsManager.updateEffects(deltaTime);
        
        // Update skill cooldowns
        this.updateSkillCooldowns();
    }

    updatePlayerMovement(deltaTime) {
        const speed = 0.2;
        const player = gameState.player;
        const oldX = player.x;
        const oldY = player.y;

        if (gameState.keys['w'] || gameState.keys['arrowup']) {
            player.y = Math.max(20, player.y - speed * deltaTime);
        }
        if (gameState.keys['s'] || gameState.keys['arrowdown']) {
            player.y = Math.min(this.canvas.height - 20, player.y + speed * deltaTime);
        }
        if (gameState.keys['a'] || gameState.keys['arrowleft']) {
            player.x = Math.max(20, player.x - speed * deltaTime);
        }
        if (gameState.keys['d'] || gameState.keys['arrowright']) {
            player.x = Math.min(this.canvas.width - 20, player.x + speed * deltaTime);
        }

        // Check collision with walls
        if (terrainManager.checkWallCollision(player)) {
            player.x = oldX;
            player.y = oldY;
        }
    }

    updatePlayers(deltaTime) {
        // Regenerate mana slowly
        gameState.player.mana = Math.min(100, gameState.player.mana + 0.02 * deltaTime);

        // Update shield
        if (gameState.player.hasShield && Date.now() > gameState.player.shieldExpiry) {
            gameState.player.hasShield = false;
        }

        // Remove dead enemies
        gameState.players.forEach((player, id) => {
            if (player.health <= 0) {
                uiManager.addChatMessage('System', `💀 ${player.name} has been defeated!`, '#ff6b6b');
                gameState.players.delete(id);
                uiManager.updatePlayerList();
            }
        });
    }

    updateSkillCooldowns() {
        const now = Date.now();
        const cooldowns = gameState.skillCooldowns;
        
        document.getElementById('fireballBtn').disabled = now < cooldowns.fireball;
        document.getElementById('healBtn').disabled = now < cooldowns.heal;
        document.getElementById('shieldBtn').disabled = now < cooldowns.shield;
    }

    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = 'rgba(16, 83, 126, 0.1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw terrain
        terrainManager.drawTerrain();

        // Draw effects
        effectsManager.drawEffects();

        // Draw players
        this.drawPlayers();
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(56, 239, 125, 0.1)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    drawPlayers() {
        // Draw other players
        gameState.players.forEach(player => {
            this.drawPlayer(player, false);
        });

        // Draw self
        this.drawPlayer(gameState.player, true);
    }

    drawPlayer(player, isSelf) {
        const ctx = this.ctx;
        
        // Player circle
        ctx.beginPath();
        ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = isSelf ? '#38ef7d' : '#ff6b6b';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shield effect
        if (isSelf && player.hasShield) {
            ctx.strokeStyle = '#3742fa';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Health bar
        const barWidth = 30;
        const barHeight = 4;
        const barX = player.x - barWidth / 2;
        const barY = player.y - 20;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(barX, barY, (player.health / 100) * barWidth, barHeight);

        // Player name
        ctx.fillStyle = '#fff';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(player.name || 'Warrior', player.x, player.y - 25);
    }

    performAttack(x, y) {
        if (gameState.player.mana < 15) {
            uiManager.addChatMessage('System', '❌ Not enough mana!', '#ff6b6b');
            return;
        }

        gameState.player.mana -= 15;
        
        // Create sword slash effect
        effectsManager.createSlashEffect(gameState.player.x, gameState.player.y, x, y);
        
        // Check for terrain damage
        terrainManager.damageTerrain(x, y, 25, 'sword');
        
        // Damage enemies in range
        this.damageEnemiesInRange(x, y, 25, 30);
        
        uiManager.addChatMessage('System', '⚔️ Sword attack!', '#feca57');
        
        setTimeout(() => uiManager.updateUI(), 100);
    }

    damageEnemiesInRange(x, y, radius, damage) {
        gameState.players.forEach(enemy => {
            const distance = this.calculateDistance({x, y}, enemy);
            
            if (distance <= radius) {
                enemy.health = Math.max(0, enemy.health - damage);
                uiManager.showDamageNumber(enemy.x, enemy.y, damage);
                uiManager.addChatMessage('System', `💥 Hit ${enemy.name} for ${damage} damage!`, '#feca57');
            }
        });
    }

    addMockPlayers() {
        // Add demo players
        for (let i = 0; i < 3; i++) {
            const mockPlayer = {
                id: `demo_${i}`,
                name: `Demo_${i}`,
                x: Math.random() * (this.canvas.width - 200) + 100,
                y: Math.random() * (this.canvas.height - 200) + 100,
                health: 100,
                level: Math.floor(Math.random() * 5) + 1
            };
            
            // Make sure players don't spawn in walls
            while (terrainManager.checkWallCollision(mockPlayer)) {
                mockPlayer.x = Math.random() * (this.canvas.width - 200) + 100;
                mockPlayer.y = Math.random() * (this.canvas.height - 200) + 100;
            }
            
            gameState.players.set(mockPlayer.id, mockPlayer);
        }

        uiManager.updatePlayerList();
    }

    calculateDistance(pos1, pos2) {
        return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    }
}

// Global game manager instance
const gameManager = new GameManager();

// Initialize when page loads
window.addEventListener('load', async () => {
    await gameManager.initializeGame();
});
