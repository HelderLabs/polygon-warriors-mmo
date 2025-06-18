console.log("🎨 SpriteManager loading...");

// Enhanced Player Sprite System for Polygon Warriors
class SpriteManager {
    constructor() {
        this.sprites = {};
        this.animationFrames = {
            warrior: {
                idle: [0],
                walk: [0, 1, 2, 3],
                attack: [4, 5, 6],
                cast: [7, 8, 9]
            },
            enemy: {
                idle: [0],
                walk: [0, 1, 2, 3],
                attack: [4, 5]
            }
        };
        this.animationSpeed = 200; // ms per frame
        this.createSprites();
        console.log("✅ SpriteManager created with sprites:", Object.keys(this.sprites));
    }

    createSprites() {
        // Create warrior sprites (different colors for different players)
        this.createWarriorSprite('player', '#38ef7d', '#2ecc71', '#27ae60');
        this.createWarriorSprite('ally', '#3498db', '#2980b9', '#1abc9c');
        this.createWarriorSprite('enemy_player', '#e74c3c', '#c0392b', '#8e44ad');
        
        // Create enemy sprites
        this.createEnemySprite('goblin', '#95a5a6', '#7f8c8d', '#2c3e50');
        this.createEnemySprite('orc', '#e67e22', '#d35400', '#a0522d');
        this.createEnemySprite('skeleton', '#ecf0f1', '#bdc3c7', '#34495e');
    }

    createWarriorSprite(type, primaryColor, secondaryColor, accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 384; // 48px * 8 frames (doubled size)
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Disable image smoothing for pixel art
        ctx.imageSmoothingEnabled = false;

        // Frame 0: Idle
        this.drawWarriorFrame(ctx, 0, 0, primaryColor, secondaryColor, accentColor, 'idle');
        
        // Frames 1-3: Walking animation
        for (let i = 1; i <= 3; i++) {
            this.drawWarriorFrame(ctx, i * 48, 0, primaryColor, secondaryColor, accentColor, 'walk', i);
        }
        
        // Frames 4-6: Attack animation
        for (let i = 0; i < 3; i++) {
            this.drawWarriorFrame(ctx, (4 + i) * 48, 0, primaryColor, secondaryColor, accentColor, 'attack', i);
        }
        
        // Frames 7-9: Casting animation
        for (let i = 0; i < 3; i++) {
            this.drawWarriorFrame(ctx, (7 + i) * 48, 0, primaryColor, secondaryColor, accentColor, 'cast', i);
        }

        this.sprites[type] = canvas;
        console.log(`🏰 Created warrior sprite: ${type}`);
    }

    drawWarriorFrame(ctx, x, y, primaryColor, secondaryColor, accentColor, animation, frame = 0) {
        const centerX = x + 24; // Doubled from 12
        const centerY = y + 24; // Doubled from 12

        // Body (8x12 rectangle - doubled)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 4, centerY - 2, 8, 12);

        // Head (8x8 square - doubled)
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(centerX - 4, centerY - 10, 8, 8);

        // Eyes (4 pixels - doubled)
        ctx.fillStyle = '#000';
        ctx.fillRect(centerX - 2, centerY - 8, 2, 2);
        ctx.fillRect(centerX + 2, centerY - 8, 2, 2);

        // Helmet/Crown - doubled
        ctx.fillStyle = accentColor;
        ctx.fillRect(centerX - 4, centerY - 12, 8, 2);
        ctx.fillRect(centerX - 2, centerY - 14, 4, 2);

        // Arms and legs based on animation - all doubled
        ctx.fillStyle = primaryColor;
        
        switch (animation) {
            case 'idle':
                // Arms at sides - doubled
                ctx.fillRect(centerX - 8, centerY, 4, 6);
                ctx.fillRect(centerX + 4, centerY, 4, 6);
                // Legs straight - doubled
                ctx.fillRect(centerX - 4, centerY + 10, 2, 8);
                ctx.fillRect(centerX + 2, centerY + 10, 2, 8);
                break;
                
            case 'walk':
                // Animated arms and legs - doubled
                const walkOffset = frame % 2 === 0 ? 2 : -2;
                // Arms swinging - doubled
                ctx.fillRect(centerX - 8, centerY + walkOffset, 4, 6);
                ctx.fillRect(centerX + 4, centerY - walkOffset, 4, 6);
                // Legs stepping - doubled
                ctx.fillRect(centerX - 4, centerY + 10, 2, 8 + walkOffset);
                ctx.fillRect(centerX + 2, centerY + 10, 2, 8 - walkOffset);
                break;
                
            case 'attack':
                // Sword raised - doubled
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(centerX + 6, centerY - 6, 2, 12);
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(centerX + 6, centerY - 8, 2, 2);
                // Arm extended - doubled
                ctx.fillStyle = primaryColor;
                ctx.fillRect(centerX + 4, centerY - 2, 6, 4);
                ctx.fillRect(centerX - 8, centerY, 4, 6);
                // Legs in battle stance - doubled
                ctx.fillRect(centerX - 6, centerY + 10, 4, 8);
                ctx.fillRect(centerX + 2, centerY + 10, 2, 8);
                break;
                
            case 'cast':
                // Arms raised for casting - doubled
                ctx.fillRect(centerX - 8, centerY - 4, 4, 6);
                ctx.fillRect(centerX + 4, centerY - 4, 4, 6);
                // Magic sparkles around hands - doubled
                ctx.fillStyle = '#9b59b6';
                ctx.fillRect(centerX - 10, centerY - 4, 2, 2);
                ctx.fillRect(centerX + 8, centerY - 4, 2, 2);
                ctx.fillRect(centerX - 8, centerY - 6, 2, 2);
                ctx.fillRect(centerX + 6, centerY - 6, 2, 2);
                // Legs - doubled
                ctx.fillStyle = primaryColor;
                ctx.fillRect(centerX - 4, centerY + 10, 2, 8);
                ctx.fillRect(centerX + 2, centerY + 10, 2, 8);
                break;
        }

        // Weapon or shield based on class - doubled
        if (animation !== 'cast') {
            // Small shield on left arm - doubled
            ctx.fillStyle = '#34495e';
            ctx.fillRect(centerX - 10, centerY + 2, 4, 4);
            ctx.fillStyle = accentColor;
            ctx.fillRect(centerX - 8, centerY + 2, 2, 2);
        }
    }

    createEnemySprite(type, primaryColor, secondaryColor, accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 288; // 48px * 6 frames (doubled)
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        ctx.imageSmoothingEnabled = false;

        // Frame 0: Idle
        this.drawEnemyFrame(ctx, 0, 0, type, primaryColor, secondaryColor, accentColor, 'idle');
        
        // Frames 1-3: Walking
        for (let i = 1; i <= 3; i++) {
            this.drawEnemyFrame(ctx, i * 48, 0, type, primaryColor, secondaryColor, accentColor, 'walk', i);
        }
        
        // Frames 4-5: Attack
        for (let i = 0; i < 2; i++) {
            this.drawEnemyFrame(ctx, (4 + i) * 48, 0, type, primaryColor, secondaryColor, accentColor, 'attack', i);
        }

        this.sprites[type] = canvas;
        console.log(`👹 Created enemy sprite: ${type}`);
    }

    drawEnemyFrame(ctx, x, y, enemyType, primaryColor, secondaryColor, accentColor, animation, frame = 0) {
        const centerX = x + 24; // Doubled from 12
        const centerY = y + 24; // Doubled from 12

        switch (enemyType) {
            case 'goblin':
                this.drawGoblin(ctx, centerX, centerY, primaryColor, secondaryColor, accentColor, animation, frame);
                break;
            case 'orc':
                this.drawOrc(ctx, centerX, centerY, primaryColor, secondaryColor, accentColor, animation, frame);
                break;
            case 'skeleton':
                this.drawSkeleton(ctx, centerX, centerY, primaryColor, secondaryColor, accentColor, animation, frame);
                break;
        }
    }

    drawGoblin(ctx, centerX, centerY, primaryColor, secondaryColor, accentColor, animation, frame) {
        // Goblin body (smaller than warrior but doubled)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 2, centerY, 6, 10);

        // Head (bigger relative to body, doubled)
        ctx.fillStyle = '#8fbc8f';
        ctx.fillRect(centerX - 4, centerY - 8, 8, 8);

        // Large ears (doubled)
        ctx.fillRect(centerX - 6, centerY - 6, 2, 4);
        ctx.fillRect(centerX + 4, centerY - 6, 2, 4);

        // Evil red eyes (doubled)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(centerX - 2, centerY - 6, 2, 2);
        ctx.fillRect(centerX + 2, centerY - 6, 2, 2);

        // Simple cloth (doubled)
        ctx.fillStyle = accentColor;
        ctx.fillRect(centerX - 2, centerY + 2, 6, 6);

        // Arms and legs for animation (doubled)
        ctx.fillStyle = '#8fbc8f';
        if (animation === 'walk' && frame % 2 === 1) {
            ctx.fillRect(centerX - 6, centerY + 2, 2, 4);
            ctx.fillRect(centerX + 4, centerY, 2, 4);
        } else {
            ctx.fillRect(centerX - 6, centerY, 2, 4);
            ctx.fillRect(centerX + 4, centerY + 2, 2, 4);
        }
        
        ctx.fillRect(centerX - 2, centerY + 10, 2, 6);
        ctx.fillRect(centerX + 2, centerY + 10, 2, 6);
    }

    drawOrc(ctx, centerX, centerY, primaryColor, secondaryColor, accentColor, animation, frame) {
        // Orc body (larger and bulkier, doubled)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 4, centerY - 2, 10, 14);

        // Head (doubled)
        ctx.fillStyle = '#8fbc8f';
        ctx.fillRect(centerX - 4, centerY - 10, 8, 8);

        // Tusks (doubled)
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(centerX - 2, centerY - 4, 2, 4);
        ctx.fillRect(centerX + 2, centerY - 4, 2, 4);

        // Angry red eyes (doubled)
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(centerX - 2, centerY - 8, 2, 2);
        ctx.fillRect(centerX + 2, centerY - 8, 2, 2);

        // Armor (doubled)
        ctx.fillStyle = accentColor;
        ctx.fillRect(centerX - 4, centerY, 10, 4);

        // Large arms (doubled)
        ctx.fillStyle = '#8fbc8f';
        ctx.fillRect(centerX - 8, centerY, 4, 8);
        ctx.fillRect(centerX + 4, centerY, 4, 8);

        // Legs (doubled)
        ctx.fillRect(centerX - 4, centerY + 12, 4, 6);
        ctx.fillRect(centerX + 2, centerY + 12, 4, 6);
    }

    drawSkeleton(ctx, centerX, centerY, primaryColor, secondaryColor, accentColor, animation, frame) {
        // Skeleton ribcage (doubled)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 2, centerY, 6, 10);
        // Ribs (doubled)
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(centerX - 4, centerY + 2, 2, 2);
        ctx.fillRect(centerX + 4, centerY + 2, 2, 2);
        ctx.fillRect(centerX - 4, centerY + 6, 2, 2);
        ctx.fillRect(centerX + 4, centerY + 6, 2, 2);

        // Skull (doubled)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 4, centerY - 8, 8, 8);

        // Eye sockets (glowing, doubled)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(centerX - 2, centerY - 6, 2, 2);
        ctx.fillRect(centerX + 2, centerY - 6, 2, 2);

        // Bone arms (doubled)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 6, centerY + 2, 2, 6);
        ctx.fillRect(centerX + 4, centerY + 2, 2, 6);

        // Bone legs (doubled)
        ctx.fillRect(centerX - 2, centerY + 10, 2, 8);
        ctx.fillRect(centerX + 2, centerY + 10, 2, 8);
    }ctx.fillRect(centerX - 1, centerY, 3, 5);
        // Ribs
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(centerX - 2, centerY + 1, 1, 1);
        ctx.fillRect(centerX + 2, centerY + 1, 1, 1);
        ctx.fillRect(centerX - 2, centerY + 3, 1, 1);
        ctx.fillRect(centerX + 2, centerY + 3, 1, 1);

        // Skull
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 2, centerY - 4, 4, 4);

        // Eye sockets (glowing)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(centerX - 1, centerY - 3, 1, 1);
        ctx.fillRect(centerX + 1, centerY - 3, 1, 1);

        // Bone arms
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 3, centerY + 1, 1, 3);
        ctx.fillRect(centerX + 2, centerY + 1, 1, 3);

        // Bone legs
        ctx.fillRect(centerX - 1, centerY + 5, 1, 4);
        ctx.fillRect(centerX + 1, centerY + 5, 1, 4);
    }

    drawSprite(ctx, spriteType, x, y, animation = 'idle', facing = 1) {
        if (!this.sprites[spriteType]) {
            console.log("❌ Sprite not found for type:", spriteType);
            return;
        }

        const sprite = this.sprites[spriteType];
        const frameIndex = this.getCurrentFrame(spriteType, animation);
        const frameWidth = 48; // Doubled from 24
        const frameHeight = 48; // Doubled from 24

        // Save context for transformations
        ctx.save();

        // Flip sprite if facing left
        if (facing < 0) {
            ctx.scale(-1, 1);
            x = -x - frameWidth;
        }

        // Draw the sprite frame
        ctx.drawImage(
            sprite,
            frameIndex * frameWidth, 0, frameWidth, frameHeight,
            x - frameWidth/2, y - frameHeight/2, frameWidth, frameHeight
        );

        ctx.restore();
    }

    getCurrentFrame(spriteType, animation) {
        const now = Date.now();
        const frames = this.animationFrames[spriteType === 'goblin' || spriteType === 'orc' || spriteType === 'skeleton' ? 'enemy' : 'warrior'][animation] || [0];
        const frameIndex = Math.floor(now / this.animationSpeed) % frames.length;
        return frames[frameIndex];
    }

    // Helper method to determine player sprite type
    getPlayerSpriteType(player, isCurrentPlayer) {
        if (isCurrentPlayer) return 'player';
        
        // Use enemy sprite types for enemies
        if (player.isEnemy && player.type) {
            return player.type; // goblin, orc, or skeleton
        }
        
        return player.isEnemy ? 'enemy_player' : 'ally';
    }
}

// Core Game Logic
class GameManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.lastUpdate = Date.now();
        this.running = false;
        this.spriteManager = new SpriteManager();
        console.log("🎮 GameManager created with SpriteManager");
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
        
        // Add facing direction tracking
        if (gameState.keys['a'] || gameState.keys['arrowleft']) {
            gameState.player.facing = -1;
        } else if (gameState.keys['d'] || gameState.keys['arrowright']) {
            gameState.player.facing = 1;
        }
        
        // Track movement state
        gameState.player.isMoving = gameState.keys['w'] || gameState.keys['a'] || gameState.keys['s'] || gameState.keys['d'];

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
        
        // Determine sprite type and animation
        const spriteType = this.spriteManager.getPlayerSpriteType(player, isSelf);
        let animation = 'idle';
        let facing = player.facing || 1;

        // Determine animation based on player state
        if (player.isMoving) {
            animation = 'walk';
        } else if (player.isAttacking) {
            animation = 'attack';
        } else if (player.isCasting) {
            animation = 'cast';
        }

        // Draw the sprite
        this.spriteManager.drawSprite(ctx, spriteType, player.x, player.y, animation, facing);

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

        // Health bar (positioned above sprite)
        const barWidth = 30;
        const barHeight = 4;
        const barX = player.x - barWidth / 2;
        const barY = player.y - 20;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = player.health > 50 ? '#38ef7d' : player.health > 25 ? '#feca57' : '#ff6b6b';
        ctx.fillRect(barX, barY, (player.health / 100) * barWidth, barHeight);

        // Player name (positioned above health bar)
        ctx.fillStyle = '#fff';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(player.name || 'Warrior', player.x, player.y - 25);
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
        // Add different enemy types instead of demo players
        const enemyTypes = [
            { type: 'goblin', name: 'Goblin_Warrior' },
            { type: 'orc', name: 'Orc_Berserker' },
            { type: 'skeleton', name: 'Skeleton_Archer' }
        ];

        for (let i = 0; i < 3; i++) {
            const enemy = enemyTypes[i];
            const mockPlayer = {
                id: `enemy_${i}`,
                name: enemy.name,
                type: enemy.type, // Add enemy type
                isEnemy: true, // Mark as enemy
                x: Math.random() * (this.canvas.width - 200) + 100,
                y: Math.random() * (this.canvas.height - 200) + 100,
                health: 100,
                level: Math.floor(Math.random() * 3) + 1
            };
            
            // Make sure enemies don't spawn in walls
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