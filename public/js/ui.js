// UI Management Module
class UIManager {
    constructor() {
        this.chatHistory = [];
        this.damageNumbers = [];
        this.notifications = [];
        this.maxChatMessages = 50;
        this.maxDamageNumbers = 10;
    }

    initialize() {
        this.setupChatEventListeners();
        this.setupUIEventListeners();
        this.startUIUpdateLoop();
    }

    setupChatEventListeners() {
        // Chat input handling
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });

            chatInput.addEventListener('focus', () => {
                // Disable game controls when typing
                this.chatFocused = true;
            });

            chatInput.addEventListener('blur', () => {
                // Re-enable game controls
                this.chatFocused = false;
            });
        }
    }

    setupUIEventListeners() {
        // Skill button click handlers
        document.getElementById('fireballBtn')?.addEventListener('click', () => {
            this.castSkill('fireball');
        });

        document.getElementById('healBtn')?.addEventListener('click', () => {
            this.castSkill('heal');
        });

        document.getElementById('shieldBtn')?.addEventListener('click', () => {
            this.castSkill('shield');
        });

        // Prevent context menu on canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
    }

    startUIUpdateLoop() {
        // Update UI elements periodically
        setInterval(() => {
            this.updateUI();
            this.updateDamageNumbers();
            this.updateNotifications();
        }, 100); // 10 FPS for UI updates
    }

    // Chat System
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;

        const message = input.value.trim();
        
        if (message.length > 0) {
            // Add player's message to chat
            this.addChatMessage(gameState.player.name, message, '#38ef7d');
            
            // Clear input
            input.value = '';
            
            // Blur input to return focus to game
            input.blur();
            
            // Process chat commands
            this.processChatCommand(message);
        }
    }

    processChatCommand(message) {
        const command = message.toLowerCase();
        
        // Chat commands
        if (command.startsWith('/')) {
            switch (command) {
                case '/help':
                    this.addChatMessage('System', '🎮 Commands: /help, /stats, /clear, /respawn', '#3742fa');
                    break;
                case '/stats':
                    this.showPlayerStats();
                    break;
                case '/clear':
                    this.clearChat();
                    break;
                case '/respawn':
                    this.respawnPlayer();
                    break;
                case '/terrain':
                    this.showTerrainStats();
                    break;
                default:
                    this.addChatMessage('System', '❓ Unknown command. Type /help for commands.', '#ff6b6b');
            }
        }
    }

    addChatMessage(sender, message, color = '#fff', timestamp = true) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        // Create message object
        const messageObj = {
            sender: sender,
            message: message,
            color: color,
            timestamp: Date.now()
        };

        // Add to history
        this.chatHistory.push(messageObj);

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.style.color = color;
        messageDiv.style.marginBottom = '2px';
        messageDiv.style.wordWrap = 'break-word';

        // Format message with timestamp
        const timeStr = timestamp ? this.formatTime(messageObj.timestamp) : '';
        const timePrefix = timeStr ? `[${timeStr}] ` : '';
        
        if (sender === 'System') {
            messageDiv.innerHTML = `${timePrefix}<span style="color: #feca57;">${sender}:</span> ${message}`;
        } else {
            messageDiv.innerHTML = `${timePrefix}<strong>${sender}:</strong> ${message}`;
        }

        chatMessages.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Limit chat history
        while (chatMessages.children.length > this.maxChatMessages) {
            chatMessages.removeChild(chatMessages.firstChild);
            this.chatHistory.shift();
        }

        // Add chat notification effect
        this.flashChatWindow();
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    flashChatWindow() {
        const chatWindow = document.querySelector('.chat');
        if (chatWindow) {
            chatWindow.style.borderColor = '#38ef7d';
            setTimeout(() => {
                chatWindow.style.borderColor = '#38ef7d';
            }, 200);
        }
    }

    clearChat() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            this.chatHistory = [];
            this.addChatMessage('System', '💬 Chat cleared!', '#3742fa');
        }
    }

    // Player Stats Display
    showPlayerStats() {
        const player = gameState.player;
        const stats = [
            `💪 Health: ${player.health}/100`,
            `🔮 Mana: ${Math.round(player.mana)}/100`,
            `⭐ Level: ${player.level}`,
            `💰 Gold: ${player.gold}`,
            `🛡️ Shield: ${player.hasShield ? 'Active' : 'Inactive'}`
        ];
        
        this.addChatMessage('System', `📊 Your Stats: ${stats.join(' | ')}`, '#3742fa');
    }

    showTerrainStats() {
        const terrain = gameState.terrain;
        const stats = [
            `🧱 Walls: ${terrain.walls.length}`,
            `🌱 Grass: ${terrain.grass.length}`,
            `🪨 Rocks: ${terrain.destructibleTerrain.length}`
        ];
        
        this.addChatMessage('System', `🌍 Terrain: ${stats.join(' | ')}`, '#2ecc71');
    }

    respawnPlayer() {
        const player = gameState.player;
        player.health = 100;
        player.mana = 100;
        player.x = 100;
        player.y = 100;
        player.hasShield = false;
        
        this.addChatMessage('System', '🔄 Player respawned!', '#3742fa');
        this.updateUI();
    }

    // Main UI Updates
    updateUI() {
        this.updatePlayerInfo();
        this.updateHealthBars();
        this.updateSkillButtons();
        this.updatePlayerList();
    }

    updatePlayerInfo() {
        const player = gameState.player;
        
        // Update player name
        const nameElement = document.getElementById('playerName');
        if (nameElement) {
            nameElement.textContent = player.name || 'Loading...';
        }

        // Update level
        const levelElement = document.getElementById('playerLevel');
        if (levelElement) {
            levelElement.textContent = player.level;
        }

        // Update gold
        const goldElement = document.getElementById('playerGold');
        if (goldElement) {
            goldElement.textContent = player.gold;
        }
    }

    updateHealthBars() {
        const player = gameState.player;
        
        // Update health bar
        const healthBar = document.getElementById('healthBar');
        if (healthBar) {
            const healthPercent = Math.max(0, Math.min(100, player.health));
            healthBar.style.width = `${healthPercent}%`;
            
            // Change color based on health
            if (healthPercent > 60) {
                healthBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
            } else if (healthPercent > 30) {
                healthBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            }
        }

        // Update mana bar
        const manaBar = document.getElementById('manaBar');
        if (manaBar) {
            const manaPercent = Math.max(0, Math.min(100, player.mana));
            manaBar.style.width = `${manaPercent}%`;
        }
    }

    updateSkillButtons() {
        const now = Date.now();
        const cooldowns = gameState.skillCooldowns;
        
        // Update button states and cooldown displays
        this.updateSkillButton('fireballBtn', 'fireball', cooldowns.fireball, now);
        this.updateSkillButton('healBtn', 'heal', cooldowns.heal, now);
        this.updateSkillButton('shieldBtn', 'shield', cooldowns.shield, now);
    }

    updateSkillButton(buttonId, skillName, cooldownEnd, now) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const onCooldown = now < cooldownEnd;
        button.disabled = onCooldown;

        if (onCooldown) {
            const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
            button.style.opacity = '0.5';
            button.style.transform = 'scale(0.95)';
            
            // Show cooldown timer
            const originalText = button.getAttribute('data-original-text') || button.textContent;
            if (!button.getAttribute('data-original-text')) {
                button.setAttribute('data-original-text', originalText);
            }
            button.textContent = `${originalText} (${remainingTime}s)`;
        } else {
            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
            
            // Restore original text
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.textContent = originalText;
            }
        }
    }

    updatePlayerList() {
        const playerListContent = document.getElementById('playerListContent');
        if (!playerListContent) return;

        let html = `<div style="color: #38ef7d; margin-bottom: 5px;">👑 ${gameState.player.name} (You)</div>`;
        
        // Add other players
        gameState.players.forEach(player => {
            const healthColor = player.health > 50 ? '#2ecc71' : player.health > 25 ? '#f39c12' : '#e74c3c';
            html += `<div style="margin-bottom: 2px;">
                <span style="color: ${healthColor};">⚔️</span> 
                ${player.name} 
                <small>(Lv.${player.level})</small>
                <div style="font-size: 10px; color: #7f8c8d;">HP: ${player.health}/100</div>
            </div>`;
        });

        // Show online count
        const totalPlayers = gameState.players.size + 1;
        html += `<div style="margin-top: 10px; color: #3742fa; font-size: 11px;">
            📊 ${totalPlayers} warrior${totalPlayers !== 1 ? 's' : ''} online
        </div>`;

        playerListContent.innerHTML = html;
    }

    // Damage Numbers System
    showDamageNumber(x, y, damage, type = 'damage') {
        // Remove old damage numbers if too many
        if (this.damageNumbers.length >= this.maxDamageNumbers) {
            this.damageNumbers.shift();
        }

        // Create damage number element
        const damageElement = document.createElement('div');
        damageElement.className = 'damage-number';
        
        // Set damage number properties
        const colors = {
            damage: '#ff6b6b',
            heal: '#2ecc71',
            mana: '#3742fa',
            critical: '#f39c12'
        };
        
        const symbols = {
            damage: '-',
            heal: '+',
            mana: '+',
            critical: '💥'
        };

        damageElement.textContent = `${symbols[type] || ''}${damage}`;
        damageElement.style.color = colors[type] || '#ff6b6b';
        damageElement.style.left = `${x}px`;
        damageElement.style.top = `${y}px`;
        damageElement.style.fontSize = type === 'critical' ? '18px' : '14px';
        damageElement.style.fontWeight = 'bold';
        
        // Add to DOM
        document.body.appendChild(damageElement);
        
        // Store reference
        this.damageNumbers.push({
            element: damageElement,
            createdAt: Date.now(),
            duration: 1000
        });
    }

    updateDamageNumbers() {
        this.damageNumbers = this.damageNumbers.filter(damageNum => {
            const age = Date.now() - damageNum.createdAt;
            
            if (age >= damageNum.duration) {
                // Remove from DOM
                if (damageNum.element.parentNode) {
                    damageNum.element.parentNode.removeChild(damageNum.element);
                }
                return false;
            }
            
            return true;
        });
    }

    // Notification System
    showNotification(message, type = 'info', duration = 3000) {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `notification notification-${type}`;
        notificationDiv.textContent = message;
        
        // Style notification
        notificationDiv.style.position = 'fixed';
        notificationDiv.style.top = '100px';
        notificationDiv.style.right = '20px';
        notificationDiv.style.padding = '10px 15px';
        notificationDiv.style.borderRadius = '5px';
        notificationDiv.style.color = 'white';
        notificationDiv.style.fontWeight = 'bold';
        notificationDiv.style.zIndex = '1000';
        notificationDiv.style.animation = 'slideIn 0.3s ease-out';
        
        // Set background color based on type
        const colors = {
            info: '#3742fa',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c'
        };
        notificationDiv.style.backgroundColor = colors[type] || colors.info;
        
        // Add to DOM
        document.body.appendChild(notificationDiv);
        
        // Store reference
        this.notifications.push({
            element: notificationDiv,
            createdAt: Date.now(),
            duration: duration
        });
    }

    updateNotifications() {
        this.notifications = this.notifications.filter(notification => {
            const age = Date.now() - notification.createdAt;
            
            if (age >= notification.duration) {
                // Fade out animation
                notification.element.style.animation = 'slideOut 0.3s ease-in';
                
                setTimeout(() => {
                    if (notification.element.parentNode) {
                        notification.element.parentNode.removeChild(notification.element);
                    }
                }, 300);
                
                return false;
            }
            
            return true;
        });
    }

    // Skill Casting Interface
    castSkill(skillName) {
        const now = Date.now();
        const player = gameState.player;
        
        // Check cooldown
        if (now < gameState.skillCooldowns[skillName]) {
            const remainingTime = Math.ceil((gameState.skillCooldowns[skillName] - now) / 1000);
            this.addChatMessage('System', `⏰ ${skillName} on cooldown for ${remainingTime}s!`, '#ff6b6b');
            return;
        }

        const manaCosts = { fireball: 40, heal: 30, shield: 35 };
        const cooldownTimes = { fireball: 3000, heal: 5000, shield: 8000 };
        
        if (player.mana < manaCosts[skillName]) {
            this.addChatMessage('System', '❌ Not enough mana!', '#ff6b6b');
            this.showNotification('Not enough mana!', 'error', 2000);
            return;
        }

        // Consume mana and set cooldown
        player.mana -= manaCosts[skillName];
        gameState.skillCooldowns[skillName] = now + cooldownTimes[skillName];

        // Cast the skill
        switch(skillName) {
            case 'fireball':
                this.castFireball();
                break;
            case 'heal':
                this.castHeal();
                break;
            case 'shield':
                this.castShield();
                break;
        }

        // Update UI immediately
        this.updateUI();
    }

    castFireball() {
        const player = gameState.player;
        
        // Create visual effects
        if (typeof effectsManager !== 'undefined') {
            effectsManager.createFireballEffect(player.x, player.y, 80);
            effectsManager.createExplosionEffect(player.x, player.y, 60);
        }

        // Damage terrain in area
        if (typeof terrainManager !== 'undefined') {
            terrainManager.damageTerrain(player.x, player.y, 80, 'fireball');
        }
        
        // Damage enemies in range
        this.damageEnemiesInRange(player.x, player.y, 80, 60);
        
        this.addChatMessage('System', '🔥 Fireball erupts! Everything burns!', '#ff6b6b');
        this.showNotification('Fireball cast!', 'warning', 2000);
    }

    castHeal() {
        const player = gameState.player;
        const healAmount = 35;
        
        const oldHealth = player.health;
        player.health = Math.min(100, player.health + healAmount);
        const actualHeal = player.health - oldHealth;
        
        // Create visual effects
        if (typeof effectsManager !== 'undefined') {
            effectsManager.createHealEffect(player.x, player.y);
        }
        
        // Show heal number
        this.showDamageNumber(player.x, player.y - 10, actualHeal, 'heal');
        
        this.addChatMessage('System', `💚 Restored ${actualHeal} health!`, '#38ef7d');
        this.showNotification(`+${actualHeal} Health`, 'success', 2000);
    }

    castShield() {
        const player = gameState.player;
        
        player.hasShield = true;
        player.shieldExpiry = Date.now() + 10000; // 10 seconds
        
        // Create visual effects
        if (typeof effectsManager !== 'undefined') {
            effectsManager.createShieldEffect(player.x, player.y);
        }
        
        this.addChatMessage('System', '🛡️ Shield activated! (10s protection)', '#3742fa');
        this.showNotification('Shield Active!', 'info', 2000);
    }

    damageEnemiesInRange(x, y, radius, damage) {
        gameState.players.forEach(enemy => {
            const distance = Math.sqrt(
                Math.pow(x - enemy.x, 2) + 
                Math.pow(y - enemy.y, 2)
            );
            
            if (distance <= radius) {
                const actualDamage = Math.min(damage, enemy.health);
                enemy.health = Math.max(0, enemy.health - damage);
                
                // Show damage number
                this.showDamageNumber(enemy.x, enemy.y - 10, actualDamage, 'damage');
                
                this.addChatMessage('System', `💥 Hit ${enemy.name} for ${actualDamage} damage!`, '#feca57');
                
                // Check if enemy died
                if (enemy.health <= 0) {
                    this.addChatMessage('System', `💀 ${enemy.name} has been defeated!`, '#ff6b6b');
                }
            }
        });
    }

    // Utility Methods
    isChatFocused() {
        return this.chatFocused;
    }

    getChatHistory() {
        return this.chatHistory;
    }

    clearAllUI() {
        this.clearChat();
        this.damageNumbers.forEach(damageNum => {
            if (damageNum.element.parentNode) {
                damageNum.element.parentNode.removeChild(damageNum.element);
            }
        });
        this.damageNumbers = [];
        
        this.notifications.forEach(notification => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        });
        this.notifications = [];
    }
}

// Global UI manager instance
const uiManager = new UIManager();

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    uiManager.initialize();
});

// Global functions for HTML onclick handlers
function castSkill(skillName) {
    uiManager.castSkill(skillName);
}
