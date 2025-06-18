console.log("🎨 SpriteManager loading...");

// Enemy AI System for moving monsters
class EnemyAI {
    constructor() {
        this.enemies = new Map();
        console.log("🤖 EnemyAI system initialized");
    }

    addEnemy(enemy) {
        const aiData = {
            id: enemy.id,
            type: enemy.type,
            state: 'patrol', // patrol, chase, attack, flee
            target: null,
            patrolCenter: { x: enemy.x, y: enemy.y },
            patrolRadius: 150,
            patrolAngle: Math.random() * Math.PI * 2,
            lastStateChange: Date.now(),
            attackCooldown: 0,
            chaseRange: 200,
            attackRange: 80,
            speed: this.getEnemySpeed(enemy.type),
            lastAttack: 0
        };
        this.enemies.set(enemy.id, aiData);
        console.log(`🤖 Added AI for ${enemy.type}: ${enemy.name}`);
    }

    getEnemySpeed(type) {
        switch (type) {
            case 'goblin': return 0.15; // Fast and nimble
            case 'orc': return 0.1; // Slow but powerful
            case 'skeleton': return 0.12; // Medium speed
            default: return 0.1;
        }
    }

    updateEnemies(deltaTime, players, playerPosition) {
        this.enemies.forEach((aiData, enemyId) => {
            const enemy = players.get(enemyId);
            if (!enemy || enemy.health <= 0) {
                this.enemies.delete(enemyId);
                return;
            }

            this.updateEnemyAI(enemy, aiData, deltaTime, playerPosition, players);
        });
    }

    updateEnemyAI(enemy, aiData, deltaTime, playerPosition, players) {
        const now = Date.now();
        const distanceToPlayer = this.calculateDistance(enemy, playerPosition);

        // State transitions
        switch (aiData.state) {
            case 'patrol':
                if (distanceToPlayer < aiData.chaseRange) {
                    aiData.state = 'chase';
                    aiData.target = playerPosition;
                    aiData.lastStateChange = now;
                }
                break;

            case 'chase':
                if (distanceToPlayer > aiData.chaseRange * 1.5) {
                    aiData.state = 'patrol';
                    aiData.lastStateChange = now;
                } else if (distanceToPlayer < aiData.attackRange) {
                    aiData.state = 'attack';
                    aiData.lastStateChange = now;
                }
                break;

            case 'attack':
                if (distanceToPlayer > aiData.attackRange * 1.2) {
                    aiData.state = 'chase';
                    aiData.lastStateChange = now;
                }
                break;

            case 'flee':
                if (now - aiData.lastStateChange > 3000) { // Flee for 3 seconds
                    aiData.state = 'patrol';
                    aiData.lastStateChange = now;
                }
                break;
        }

        // Execute behavior based on current state
        this.executeEnemyBehavior(enemy, aiData, deltaTime, playerPosition, players);
    }

    executeEnemyBehavior(enemy, aiData, deltaTime, playerPosition, players) {
        const oldX = enemy.x;
        const oldY = enemy.y;

        switch (aiData.state) {
            case 'patrol':
                this.patrolBehavior(enemy, aiData, deltaTime);
                break;

            case 'chase':
                this.chaseBehavior(enemy, aiData, deltaTime, playerPosition);
                break;

            case 'attack':
                this.attackBehavior(enemy, aiData, deltaTime, playerPosition, players);
                break;

            case 'flee':
                this.fleeBehavior(enemy, aiData, deltaTime, playerPosition);
                break;
        }

        // Check wall collision and revert if needed
        if (terrainManager.checkWallCollision(enemy)) {
            enemy.x = oldX;
            enemy.y = oldY;
            // Change direction if hit wall
            aiData.patrolAngle += Math.PI / 2;
        }

        // Update facing direction and movement state
        const deltaX = enemy.x - oldX;
        if (Math.abs(deltaX) > 0.1) {
            enemy.facing = deltaX > 0 ? 1 : -1;
            enemy.isMoving = true;
        } else {
            enemy.isMoving = false;
        }
    }

    patrolBehavior(enemy, aiData, deltaTime) {
        // Circular patrol around spawn point
        aiData.patrolAngle += 0.002 * deltaTime;
        
        const targetX = aiData.patrolCenter.x + Math.cos(aiData.patrolAngle) * aiData.patrolRadius;
        const targetY = aiData.patrolCenter.y + Math.sin(aiData.patrolAngle) * aiData.patrolRadius;
        
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            enemy.x += (dx / distance) * aiData.speed * deltaTime;
            enemy.y += (dy / distance) * aiData.speed * deltaTime;
        }
    }

    chaseBehavior(enemy, aiData, deltaTime, playerPosition) {
        const dx = playerPosition.x - enemy.x;
        const dy = playerPosition.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            // Move towards player with increased speed
            const chaseSpeed = aiData.speed * 1.5;
            enemy.x += (dx / distance) * chaseSpeed * deltaTime;
            enemy.y += (dy / distance) * chaseSpeed * deltaTime;
        }
    }

    attackBehavior(enemy, aiData, deltaTime, playerPosition, players) {
        const now = Date.now();
        
        // Attack cooldown based on enemy type
        let attackCooldown = 2000; // Default 2 seconds
        switch (aiData.type) {
            case 'goblin': attackCooldown = 1500; break;
            case 'orc': attackCooldown = 2500; break;
            case 'skeleton': attackCooldown = 1800; break;
        }

        if (now - aiData.lastAttack > attackCooldown) {
            this.performEnemyAttack(enemy, aiData, playerPosition, players);
            aiData.lastAttack = now;
        }

        // Stay close to player while attacking
        const dx = playerPosition.x - enemy.x;
        const dy = playerPosition.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > aiData.attackRange * 0.7) {
            enemy.x += (dx / distance) * aiData.speed * 0.5 * deltaTime;
            enemy.y += (dy / distance) * aiData.speed * 0.5 * deltaTime;
        }
    }

    fleeBehavior(enemy, aiData, deltaTime, playerPosition) {
        // Run away from player
        const dx = enemy.x - playerPosition.x;
        const dy = enemy.y - playerPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const fleeSpeed = aiData.speed * 2;
            enemy.x += (dx / distance) * fleeSpeed * deltaTime;
            enemy.y += (dy / distance) * fleeSpeed * deltaTime;
        }
    }

    performEnemyAttack(enemy, aiData, playerPosition, players) {
        // Set attack animation state
        enemy.isAttacking = true;
        setTimeout(() => { enemy.isAttacking = false; }, 500);

        // Calculate damage based on enemy type
        let damage = 15;
        let attackMessage = '';
        switch (aiData.type) {
            case 'goblin': 
                damage = 10; 
                attackMessage = `🗡️ ${enemy.name} stabs with a rusty dagger!`;
                break;
            case 'orc': 
                damage = 25; 
                attackMessage = `🪓 ${enemy.name} swings a massive axe!`;
                break;
            case 'skeleton': 
                damage = 20; 
                attackMessage = `🏹 ${enemy.name} shoots a bone arrow!`;
                break;
        }

        // Apply damage to player if in range
        const distance = this.calculateDistance(enemy, playerPosition);
        if (distance < aiData.attackRange) {
            gameState.player.health = Math.max(0, gameState.player.health - damage);
            
            // Show damage effect
            if (typeof uiManager !== 'undefined') {
                uiManager.showDamageNumber(playerPosition.x, playerPosition.y, damage);
                uiManager.addChatMessage('System', attackMessage, '#ff6b6b');
            }

            // Check if player died
            if (gameState.player.health <= 0) {
                if (typeof uiManager !== 'undefined') {
                    uiManager.addChatMessage('System', '💀 You have been defeated!', '#ff6b6b');
                }
            }
        }
    }

    // Trigger flee behavior for goblins when low health
    checkFleeCondition(enemy, aiData) {
        if (aiData.type === 'goblin' && enemy.health < 30 && aiData.state !== 'flee') {
            aiData.state = 'flee';
            aiData.lastStateChange = Date.now();
            if (typeof uiManager !== 'undefined') {
                uiManager.addChatMessage('System', `🏃 ${enemy.name} flees in terror!`, '#feca57');
            }
        }
    }

    calculateDistance(pos1, pos2) {
        return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    }
}

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
        this.animationSpeed = 200;
        this.createSprites();
        console.log("✅ SpriteManager created with sprites:", Object.keys(this.sprites));
    }

    createSprites() {
        this.createWarriorSprite('player', '#38ef7d', '#2ecc71', '#27ae60');
        this.createWarriorSprite('ally', '#3498db', '#2980b9', '#1abc9c');
        this.createWarriorSprite('enemy_player', '#e74c3c', '#c0392b', '#8e44ad');
        
        this.createEnemySprite('goblin', '#95a5a6', '#7f8c8d', '#2c3e50');
        this.createEnemySprite('orc', '#e67e22', '#d35400', '#a0522d');
        this.createEnemySprite('skeleton', '#ecf0f1', '#bdc3c7', '#34495e');
    }

    createWarriorSprite(type, primaryColor, secondaryColor, accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 576;
        canvas.height = 72;
        const ctx = canvas.getContext('2d');
        
        ctx.imageSmoothingEnabled = false;

        this.drawWarriorFrame(ctx, 0, 0, primaryColor, secondaryColor, accentColor, 'idle');
        
        for (let i = 1; i <= 3; i++) {
            this.drawWarriorFrame(ctx, i * 72, 0, primaryColor, secondaryColor, accentColor, 'walk', i);
        }
        
        for (let i = 0; i < 3; i++) {
            this.drawWarriorFrame(ctx, (4 + i) * 72, 0, primaryColor, secondaryColor, accentColor, 'attack', i);
        }
        
        for (let i = 0; i < 3; i++) {
            this.drawWarriorFrame(ctx, (7 + i) * 72, 0, primaryColor, secondaryColor, accentColor, 'cast', i);
        }

        this.sprites[type] = canvas;
        console.log(`🏰 Created warrior sprite: ${type}`);
    }

    drawWarriorFrame(ctx, x, y, primaryColor, secondaryColor, accentColor, animation, frame = 0) {
        const centerX = x + 36;
        const centerY = y + 36;

        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 6, centerY - 3, 12, 18);

        ctx.fillStyle = secondaryColor;
        ctx.fillRect(centerX - 6, centerY - 15, 12, 12);

        ctx.fillStyle = '#000';
        ctx.fillRect(centerX - 3, centerY - 12, 3, 3);
        ctx.fillRect(centerX + 3, centerY - 12, 3, 3);

        ctx.fillStyle = accentColor;
        ctx.fillRect(centerX - 6, centerY - 18, 12, 3);
        ctx.fillRect(centerX - 3, centerY - 21, 6, 3);

        ctx.fillStyle = primaryColor;
        
        switch (animation) {
            case 'idle':
                ctx.fillRect(centerX - 12, centerY, 6, 9);
                ctx.fillRect(centerX + 6, centerY, 6, 9);
                ctx.fillRect(centerX - 6, centerY + 15, 3, 12);
                ctx.fillRect(centerX + 3, centerY + 15, 3, 12);
                break;
                
            case 'walk':
                const walkOffset = frame % 2 === 0 ? 3 : -3;
                ctx.fillRect(centerX - 12, centerY + walkOffset, 6, 9);
                ctx.fillRect(centerX + 6, centerY - walkOffset, 6, 9);
                ctx.fillRect(centerX - 6, centerY + 15, 3, 12 + walkOffset);
                ctx.fillRect(centerX + 3, centerY + 15, 3, 12 - walkOffset);
                break;
                
            case 'attack':
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(centerX + 9, centerY - 9, 3, 18);
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(centerX + 9, centerY - 12, 3, 3);
                ctx.fillStyle = primaryColor;
                ctx.fillRect(centerX + 6, centerY - 3, 9, 6);
                ctx.fillRect(centerX - 12, centerY, 6, 9);
                ctx.fillRect(centerX - 9, centerY + 15, 6, 12);
                ctx.fillRect(centerX + 3, centerY + 15, 3, 12);
                break;
                
            case 'cast':
                ctx.fillRect(centerX - 12, centerY - 6, 6, 9);
                ctx.fillRect(centerX + 6, centerY - 6, 6, 9);
                ctx.fillStyle = '#9b59b6';
                ctx.fillRect(centerX - 15, centerY - 6, 3, 3);
                ctx.fillRect(centerX + 12, centerY - 6, 3, 3);
                ctx.fillRect(centerX - 12, centerY - 9, 3, 3);
                ctx.fillRect(centerX + 9, centerY - 9, 3, 3);
                ctx.fillStyle = primaryColor;
                ctx.fillRect(centerX - 6, centerY + 15, 3, 12);
                ctx.fillRect(centerX + 3, centerY + 15, 3, 12);
                break;
        }

        if (animation !== 'cast') {
            ctx.fillStyle = '#34495e';
            ctx.fillRect(centerX - 15, centerY + 3, 6, 6);
            ctx.fillStyle = accentColor;
            ctx.fillRect(centerX - 12, centerY + 3, 3, 3);
        }
    }

    createEnemySprite(type, primaryColor, secondaryColor, accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 432;
        canvas.height = 72;
        const ctx = canvas.getContext('2d');
        
        ctx.imageSmoothingEnabled = false;

        this.drawEnemyFrame(ctx, 0, 0, type, primaryColor, secondaryColor, accentColor, 'idle');
        
        for (let i = 1; i <= 3; i++) {
            this.drawEnemyFrame(ctx, i * 72, 0, type, primaryColor, secondaryColor, accentColor, 'walk', i);
        }
        
        for (let i = 0; i < 2; i++) {
            this.drawEnemyFrame(ctx, (4 + i) * 72, 0, type, primaryColor, secondaryColor, accentColor, 'attack', i);
        }

        this.sprites[type] = canvas;
        console.log(`👹 Created enemy sprite: ${type}`);
    }

    drawEnemyFrame(ctx, x, y, enemyType, primaryColor, secondaryColor, accentColor, animation, frame = 0) {
        const centerX = x + 36;
        const centerY = y + 36;

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
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 3, centerY, 9, 15);

        ctx.fillStyle = '#8fbc8f';
        ctx.fillRect(centerX - 6, centerY - 12, 12, 12);

        ctx.fillRect(centerX - 9, centerY - 9, 3, 6);
        ctx.fillRect(centerX + 6, centerY - 9, 3, 6);

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(centerX - 3, centerY - 9, 3, 3);
        ctx.fillRect(centerX + 3, centerY - 9, 3, 3);

        ctx.fillStyle = accentColor;
        ctx.fillRect(centerX - 3, centerY + 3, 9, 9);

        ctx.fillStyle = '#8fbc8f';
        if (animation === 'walk' && frame % 2 === 1) {
            ctx.fillRect(centerX - 9, centerY + 3, 3, 6);
            ctx.fillRect(centerX + 6, centerY, 3, 6);
        } else {
            ctx.fillRect(centerX - 9, centerY, 3, 6);
            ctx.fillRect(centerX + 6, centerY + 3, 3, 6);
        }
        
        ctx.fillRect(centerX - 3, centerY + 15, 3, 9);
        ctx.fillRect(centerX + 3, centerY + 15, 3, 9);
    }

    drawOrc(ctx, centerX, centerY, primaryColor, secondaryColor, accentColor, animation, frame) {
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 6, centerY - 3, 15, 21);

        ctx.fillStyle = '#8fbc8f';
        ctx.fillRect(centerX - 6, centerY - 15, 12, 12);

        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(centerX - 3, centerY - 6, 3, 6);
        ctx.fillRect(centerX + 3, centerY - 6, 3, 6);

        ctx.fillStyle = '#c0392b';
        ctx.fillRect(centerX - 3, centerY - 12, 3, 3);
        ctx.fillRect(centerX + 3, centerY - 12, 3, 3);

        ctx.fillStyle = accentColor;
        ctx.fillRect(centerX - 6, centerY, 15, 6);

        ctx.fillStyle = '#8fbc8f';
        ctx.fillRect(centerX - 12, centerY, 6, 12);
        ctx.fillRect(centerX + 6, centerY, 6, 12);

        ctx.fillRect(centerX - 6, centerY + 18, 6, 9);
        ctx.fillRect(centerX + 3, centerY + 18, 6, 9);
    }

    drawSkeleton(ctx, centerX, centerY, primaryColor, secondaryColor, accentColor, animation, frame) {
        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 3, centerY, 9, 15);
        
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(centerX - 6, centerY + 3, 3, 3);
        ctx.fillRect(centerX + 6, centerY + 3, 3, 3);
        ctx.fillRect(centerX - 6, centerY + 9, 3, 3);
        ctx.fillRect(centerX + 6, centerY + 9, 3, 3);

        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 6, centerY - 12, 12, 12);

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(centerX - 3, centerY - 9, 3, 3);
        ctx.fillRect(centerX + 3, centerY - 9, 3, 3);

        ctx.fillStyle = primaryColor;
        ctx.fillRect(centerX - 9, centerY + 3, 3, 9);
        ctx.fillRect(centerX + 6, centerY + 3, 3, 9);

        ctx.fillRect(centerX - 3, centerY + 15, 3, 12);
        ctx.fillRect(centerX + 3, centerY + 15, 3, 12);
    }

    drawSprite(ctx, spriteType, x, y, animation = 'idle', facing = 1) {
        if (!this.sprites[spriteType]) {
            console.log("❌ Sprite not found for type:", spriteType);
            return;
        }

        const sprite = this.sprites[spriteType];
        const frameIndex = this.getCurrentFrame(spriteType, animation);
        const frameWidth = 72;
        const frameHeight = 72;

        ctx.save();

        if (facing < 0) {
            ctx.scale(-1, 1);
            x = -x - frameWidth;
        }

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

    getPlayerSpriteType(player, isCurrentPlayer) {
        if (isCurrentPlayer) return 'player';
        
        if (player.isEnemy && player.type) {
            return player.type;
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
        this.enemyAI = new EnemyAI(); // Add AI system
        console.log("🎮 GameManager created with SpriteManager and EnemyAI");
    }

    async initializeGame() {
        const canvas = document.getElementById('gameCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        gameState.canvas = canvas;
        gameState.ctx = this.ctx;

        this.setupEventListeners();
        terrainManager.generateTerrain();
    }

    setupEventListeners() {
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

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.performAttack(x, y);
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                uiManager.sendChatMessage();
            }
        });

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            terrainManager.generateTerrain();
        });
    }

    startGame() {
        gameState.connected = true;
        uiManager.updateUI();
        this.addMockPlayers();
        this.running = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.running) return;

        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        
        if (deltaTime > 16) {
            this.update(deltaTime);
            this.render();
            this.lastUpdate = now;
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.updatePlayerMovement(deltaTime);
        this.updatePlayers(deltaTime);
        
        // Update enemy AI for moving monsters
        this.enemyAI.updateEnemies(deltaTime, gameState.players, gameState.player);
        
        effectsManager.updateEffects(deltaTime);
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
        
        if (gameState.keys['a'] || gameState.keys['arrowleft']) {
            gameState.player.facing = -1;
        } else if (gameState.keys['d'] || gameState.keys['arrowright']) {
            gameState.player.facing = 1;
        }
        
        gameState.player.isMoving = gameState.keys['w'] || gameState.keys['a'] || gameState.keys['s'] || gameState.keys['d'];

        if (terrainManager.checkWallCollision(player)) {
            player.x = oldX;
            player.y = oldY;
        }
    }

    updatePlayers(deltaTime) {
        gameState.player.mana = Math.min(100, gameState.player.mana + 0.02 * deltaTime);

        if (gameState.player.hasShield && Date.now() > gameState.player.shieldExpiry) {
            gameState.player.hasShield = false;
        }

        gameState.players.forEach((player, id) => {
            if (player.health <= 0) {
                uiManager.addChatMessage('System', `💀 ${player.name} has been defeated!`, '#ff6b6b');
                gameState.players.delete(id);
                this.enemyAI.enemies.delete(id); // Remove from AI system
                uiManager.updatePlayerList();
            } else if (player.isEnemy) {
                // Check flee condition for goblins
                const aiData = this.enemyAI.enemies.get(id);
                if (aiData) {
                    this.enemyAI.checkFleeCondition(player, aiData);
                }
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

        ctx.fillStyle = 'rgba(16, 83, 126, 0.1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        terrainManager.drawTerrain();
        effectsManager.drawEffects();
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
        gameState.players.forEach(player => {
            this.drawPlayer(player, false);
        });

        this.drawPlayer(gameState.player, true);
    }

    drawPlayer(player, isSelf) {
        const ctx = this.ctx;
        
        const spriteType = this.spriteManager.getPlayerSpriteType(player, isSelf);
        let animation = 'idle';
        let facing = player.facing || 1;

        if (player.isMoving) {
            animation = 'walk';
        } else if (player.isAttacking) {
            animation = 'attack';
        } else if (player.isCasting) {
            animation = 'cast';
        }

        this.spriteManager.drawSprite(ctx, spriteType, player.x, player.y, animation, facing);

        if (isSelf && player.hasShield) {
            ctx.strokeStyle = '#3742fa';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        const barWidth = 40;
        const barHeight = 6;
        const barX = player.x - barWidth / 2;
        const barY = player.y - 45;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = player.health > 50 ? '#38ef7d' : player.health > 25 ? '#feca57' : '#ff6b6b';
        ctx.fillRect(barX, barY, (player.health / 100) * barWidth, barHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(player.name || 'Warrior', player.x, player.y - 50);
        ctx.fillText(player.name || 'Warrior', player.x, player.y - 50);
    }

    performAttack(x, y) {
        if (gameState.player.mana < 15) {
            uiManager.addChatMessage('System', '❌ Not enough mana!', '#ff6b6b');
            return;
        }

        gameState.player.mana -= 15;
        
        effectsManager.createSlashEffect(gameState.player.x, gameState.player.y, x, y);
        terrainManager.damageTerrain(x, y, 25, 'sword');
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
                type: enemy.type,
                isEnemy: true,
                x: Math.random() * (this.canvas.width - 200) + 100,
                y: Math.random() * (this.canvas.height - 200) + 100,
                health: 100,
                level: Math.floor(Math.random() * 3) + 1,
                facing: 1,
                isMoving: false,
                isAttacking: false
            };
            
            while (terrainManager.checkWallCollision(mockPlayer)) {
                mockPlayer.x = Math.random() * (this.canvas.width - 200) + 100;
                mockPlayer.y = Math.random() * (this.canvas.height - 200) + 100;
            }
            
            gameState.players.set(mockPlayer.id, mockPlayer);
            
            // Add to AI system for movement and behavior
            this.enemyAI.addEnemy(mockPlayer);
        }

        uiManager.updatePlayerList();
        console.log("🏹 Added 3 moving enemies with AI behavior!");
    }

    calculateDistance(pos1, pos2) {
        return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    }
}

const gameManager = new GameManager();

window.addEventListener('load', async () => {
    await gameManager.initializeGame();
});