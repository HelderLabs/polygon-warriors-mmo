// Terrain Management Module
class TerrainManager {
    constructor() {
        this.TERRAIN_TYPES = {
            WALL: 'wall',
            GRASS: 'grass',
            ROCK: 'rock'
        };
    }

    generateTerrain() {
        const canvas = gameState.canvas;
        
        // Clear existing terrain
        gameState.terrain = {
            walls: [],
            grass: [],
            destructibleTerrain: []
        };
        
        // Generate different terrain types
        this.generateWalls();
        this.generateGrassPatches();
        this.generateRocks();
    }

    generateWalls() {
        const canvas = gameState.canvas;
        const walls = [];
        
        // Border walls
        walls.push(
            { x: 0, y: 0, width: canvas.width, height: 20, type: this.TERRAIN_TYPES.WALL },
            { x: 0, y: 0, width: 20, height: canvas.height, type: this.TERRAIN_TYPES.WALL },
            { x: canvas.width - 20, y: 0, width: 20, height: canvas.height, type: this.TERRAIN_TYPES.WALL },
            { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, type: this.TERRAIN_TYPES.WALL }
        );
        
        // Interior walls (strategic barriers)
        const numWalls = 8;
        for (let i = 0; i < numWalls; i++) {
            const isVertical = Math.random() > 0.5;
            
            if (isVertical) {
                walls.push({
                    x: Math.random() * (canvas.width - 200) + 100,
                    y: Math.random() * (canvas.height - 200) + 100,
                    width: 20,
                    height: 100 + Math.random() * 100,
                    type: this.TERRAIN_TYPES.WALL
                });
            } else {
                walls.push({
                    x: Math.random() * (canvas.width - 200) + 100,
                    y: Math.random() * (canvas.height - 200) + 100,
                    width: 100 + Math.random() * 100,
                    height: 20,
                    type: this.TERRAIN_TYPES.WALL
                });
            }
        }
        
        gameState.terrain.walls = walls;
    }

    generateGrassPatches() {
        const canvas = gameState.canvas;
        const grass = [];
        
        const numPatches = 15;
        for (let i = 0; i < numPatches; i++) {
            const patch = {
                x: Math.random() * (canvas.width - 100) + 50,
                y: Math.random() * (canvas.height - 100) + 50,
                width: 30 + Math.random() * 40,
                height: 30 + Math.random() * 40,
                type: this.TERRAIN_TYPES.GRASS,
                health: 100,
                maxHealth: 100
            };

            // Make sure grass doesn't spawn on walls
            if (!this.isOverlappingWalls(patch)) {
                grass.push(patch);
            }
        }
        
        gameState.terrain.grass = grass;
    }

    generateRocks() {
        const canvas = gameState.canvas;
        const rocks = [];
        
        const numRocks = 5;
        for (let i = 0; i < numRocks; i++) {
            const rock = {
                x: Math.random() * (canvas.width - 100) + 50,
                y: Math.random() * (canvas.height - 100) + 50,
                width: 25,
                height: 25,
                type: this.TERRAIN_TYPES.ROCK,
                health: 200,
                maxHealth: 200
            };

            // Make sure rocks don't spawn on walls or grass
            if (!this.isOverlappingWalls(rock) && !this.isOverlappingGrass(rock)) {
                rocks.push(rock);
            }
        }
        
        gameState.terrain.destructibleTerrain = rocks;
    }

    isOverlappingWalls(object) {
        return gameState.terrain.walls.some(wall => {
            return object.x < wall.x + wall.width &&
                   object.x + object.width > wall.x &&
                   object.y < wall.y + wall.height &&
                   object.y + object.height > wall.y;
        });
    }

    isOverlappingGrass(object) {
        return gameState.terrain.grass.some(grass => {
            return object.x < grass.x + grass.width &&
                   object.x + object.width > grass.x &&
                   object.y < grass.y + grass.height &&
                   object.y + object.height > grass.y;
        });
    }

    checkWallCollision(player) {
        const playerBounds = {
            x: player.x - 12,
            y: player.y - 12,
            width: 24,
            height: 24
        };

        return gameState.terrain.walls.some(wall => {
            return playerBounds.x < wall.x + wall.width &&
                   playerBounds.x + playerBounds.width > wall.x &&
                   playerBounds.y < wall.y + wall.height &&
                   playerBounds.y + playerBounds.height > wall.y;
        });
    }

    drawTerrain() {
        this.drawWalls();
        this.drawGrass();
        this.drawRocks();
    }

    drawWalls() {
        const ctx = gameState.ctx;
        
        // Draw walls with red color and border
        ctx.fillStyle = '#ff4757';
        gameState.terrain.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            
            // Wall border for better visibility
            ctx.strokeStyle = '#ff3742';
            ctx.lineWidth = 2;
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        });
    }

    drawGrass() {
        const ctx = gameState.ctx;
        
        gameState.terrain.grass.forEach(grass => {
            const healthPercentage = grass.health / grass.maxHealth;
            
            // Base grass color (fades as health decreases)
            ctx.fillStyle = `rgba(46, 213, 115, ${healthPercentage})`;
            ctx.fillRect(grass.x, grass.y, grass.width, grass.height);
            
            // Grass texture (small lines to look like grass)
            ctx.fillStyle = `rgba(39, 174, 96, ${healthPercentage * 0.7})`;
            for (let i = 0; i < 8; i++) {
                const x = grass.x + Math.random() * grass.width;
                const y = grass.y + Math.random() * grass.height;
                ctx.fillRect(x, y, 2, 6);
            }

            // Grass border
            if (healthPercentage > 0.5) {
                ctx.strokeStyle = `rgba(39, 174, 96, ${healthPercentage})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(grass.x, grass.y, grass.width, grass.height);
            }
        });
    }

    drawRocks() {
        const ctx = gameState.ctx;
        
        gameState.terrain.destructibleTerrain.forEach(rock => {
            if (rock.health > 0) {
                const healthPercentage = rock.health / rock.maxHealth;
                
                // Rock color (grays out as health decreases)
                ctx.globalAlpha = healthPercentage;
                ctx.fillStyle = '#95a5a6';
                ctx.fillRect(rock.x, rock.y, rock.width, rock.height);
                
                // Rock border and cracks
                ctx.strokeStyle = '#7f8c8d';
                ctx.lineWidth = 2;
                ctx.strokeRect(rock.x, rock.y, rock.width, rock.height);
                
                // Show cracks when damaged
                if (healthPercentage < 0.7) {
                    ctx.strokeStyle = '#2c3e50';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(rock.x + 5, rock.y + 5);
                    ctx.lineTo(rock.x + rock.width - 5, rock.y + rock.height - 5);
                    ctx.moveTo(rock.x + rock.width - 5, rock.y + 5);
                    ctx.lineTo(rock.x + 5, rock.y + rock.height - 5);
                    ctx.stroke();
                }
                
                ctx.globalAlpha = 1;
            }
        });
    }

    damageTerrain(x, y, radius, damageType) {
        let terrainDestroyed = false;

        // Damage grass patches
        gameState.terrain.grass.forEach(grass => {
            const distance = this.calculateDistance(
                { x, y }, 
                { x: grass.x + grass.width/2, y: grass.y + grass.height/2 }
            );
            
            if (distance <= radius) {
                const oldHealth = grass.health;
                
                if (damageType === 'fire') {
                    grass.health -= 80; // Fire is very effective against grass
                } else if (damageType === 'sword') {
                    grass.health -= 25; // Sword can cut grass
                } else if (damageType === 'fireball') {
                    grass.health -= 100; // Fireball destroys grass completely
                }
                
                grass.health = Math.max(0, grass.health);
                
                // Show destruction message
                if (oldHealth > 0 && grass.health <= 0) {
                    if (typeof uiManager !== 'undefined') {
                        uiManager.addChatMessage('System', '🔥 Grass patch burned away!', '#e67e22');
                    }
                    terrainDestroyed = true;
                }
            }
        });

        // Damage rocks (only certain damage types work)
        if (damageType === 'fire' || damageType === 'sword' || damageType === 'fireball') {
            gameState.terrain.destructibleTerrain.forEach(rock => {
                const distance = this.calculateDistance(
                    { x, y }, 
                    { x: rock.x + rock.width/2, y: rock.y + rock.height/2 }
                );
                
                if (distance <= radius) {
                    const oldHealth = rock.health;
                    
                    if (damageType === 'fireball') {
                        rock.health -= 120; // Fireball is most effective
                    } else if (damageType === 'fire') {
                        rock.health -= 80;
                    } else if (damageType === 'sword') {
                        rock.health -= 40; // Sword chips away at rocks
                    }
                    
                    rock.health = Math.max(0, rock.health);
                    
                    // Show destruction message
                    if (oldHealth > 0 && rock.health <= 0) {
                        if (typeof uiManager !== 'undefined') {
                            uiManager.addChatMessage('System', '💥 Rock shattered!', '#95a5a6');
                        }
                        terrainDestroyed = true;
                    }
                }
            });
        }

        // Clean up destroyed terrain
        this.cleanupDestroyedTerrain();
        
        return terrainDestroyed;
    }

    cleanupDestroyedTerrain() {
        // Remove destroyed grass patches
        const grassBefore = gameState.terrain.grass.length;
        gameState.terrain.grass = gameState.terrain.grass.filter(grass => grass.health > 0);
        
        // Remove destroyed rocks
        const rocksBefore = gameState.terrain.destructibleTerrain.length;
        gameState.terrain.destructibleTerrain = gameState.terrain.destructibleTerrain.filter(rock => rock.health > 0);
        
        // Log terrain changes for debugging
        if (grassBefore !== gameState.terrain.grass.length) {
            console.log(`Grass patches: ${grassBefore} → ${gameState.terrain.grass.length}`);
        }
        if (rocksBefore !== gameState.terrain.destructibleTerrain.length) {
            console.log(`Rocks: ${rocksBefore} → ${gameState.terrain.destructibleTerrain.length}`);
        }
    }

    calculateDistance(pos1, pos2) {
        return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    }

    // Utility functions for game mechanics
    getTerrainAt(x, y) {
        // Check if position is on any terrain
        const terrain = [];
        
        // Check walls
        gameState.terrain.walls.forEach(wall => {
            if (x >= wall.x && x <= wall.x + wall.width &&
                y >= wall.y && y <= wall.y + wall.height) {
                terrain.push({ type: 'wall', object: wall });
            }
        });
        
        // Check grass
        gameState.terrain.grass.forEach(grass => {
            if (x >= grass.x && x <= grass.x + grass.width &&
                y >= grass.y && y <= grass.y + grass.height) {
                terrain.push({ type: 'grass', object: grass });
            }
        });
        
        // Check rocks
        gameState.terrain.destructibleTerrain.forEach(rock => {
            if (x >= rock.x && x <= rock.x + rock.width &&
                y >= rock.y && y <= rock.y + rock.height) {
                terrain.push({ type: 'rock', object: rock });
            }
        });
        
        return terrain;
    }

    isPositionBlocked(x, y, width = 24, height = 24) {
        // Check if a position is blocked by walls (for spawning, movement, etc.)
        const bounds = { x: x - width/2, y: y - height/2, width, height };
        
        return gameState.terrain.walls.some(wall => {
            return bounds.x < wall.x + wall.width &&
                   bounds.x + bounds.width > wall.x &&
                   bounds.y < wall.y + wall.height &&
                   bounds.y + bounds.height > wall.y;
        });
    }

    regenerateTerrain() {
        // Add new grass patches over time (optional feature)
        if (Math.random() < 0.001 && gameState.terrain.grass.length < 20) {
            const newGrass = {
                x: Math.random() * (gameState.canvas.width - 100) + 50,
                y: Math.random() * (gameState.canvas.height - 100) + 50,
                width: 20 + Math.random() * 30,
                height: 20 + Math.random() * 30,
                type: this.TERRAIN_TYPES.GRASS,
                health: 50,
                maxHealth: 100
            };

            if (!this.isOverlappingWalls(newGrass)) {
                gameState.terrain.grass.push(newGrass);
                if (typeof uiManager !== 'undefined') {
                    uiManager.addChatMessage('System', '🌱 New grass has grown!', '#2ecc71');
                }
            }
        }
    }
}

// Global terrain manager instance
const terrainManager = new TerrainManager();
