// Visual Effects Management Module
class EffectsManager {
    constructor() {
        this.effects = [];
        this.particles = [];
        this.screenShake = { intensity: 0, duration: 0 };
    }

    updateEffects(deltaTime) {
        // Update visual effects
        this.effects = this.effects.filter(effect => {
            effect.life -= deltaTime;
            
            // Update effect properties based on type
            this.updateEffectProperties(effect, deltaTime);
            
            return effect.life > 0;
        });

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.vx * deltaTime * 0.001;
            particle.y += particle.vy * deltaTime * 0.001;
            particle.alpha = particle.life / particle.maxLife;
            
            return particle.life > 0;
        });

        // Update screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            if (this.screenShake.duration <= 0) {
                this.screenShake.intensity = 0;
            }
        }
    }

    updateEffectProperties(effect, deltaTime) {
        switch (effect.type) {
            case 'fireball':
                // Fireball grows and fades
                effect.radius += deltaTime * 0.05;
                break;
            case 'explosion':
                // Explosion pulses
                effect.radius += Math.sin(effect.life * 0.01) * 2;
                break;
            case 'heal':
                // Healing sparkles rotate
                effect.rotation = (effect.rotation || 0) + deltaTime * 0.005;
                break;
            case 'shield':
                // Shield rotates
                effect.rotation = (effect.rotation || 0) + deltaTime * 0.003;
                break;
            case 'slash':
                // Slash effect fades quickly
                effect.alpha = effect.life / effect.maxLife;
                break;
        }
    }

    drawEffects() {
        const ctx = gameState.ctx;
        
        // Apply screen shake
        if (this.screenShake.intensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            ctx.translate(shakeX, shakeY);
        }

        // Draw all effects
        this.effects.forEach(effect => {
            ctx.save();
            ctx.globalAlpha = effect.life / effect.maxLife;
            
            switch (effect.type) {
                case 'fireball':
                    this.drawFireballEffect(effect);
                    break;
                case 'explosion':
                    this.drawExplosionEffect(effect);
                    break;
                case 'heal':
                    this.drawHealEffect(effect);
                    break;
                case 'shield':
                    this.drawShieldEffect(effect);
                    break;
                case 'slash':
                    this.drawSlashEffect(effect);
                    break;
                case 'impact':
                    this.drawImpactEffect(effect);
                    break;
                case 'burn':
                    this.drawBurnEffect(effect);
                    break;
            }
            
            ctx.restore();
        });

        // Draw particles
        this.drawParticles();

        // Reset screen shake transform
        if (this.screenShake.intensity > 0) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    drawFireballEffect(effect) {
        const ctx = gameState.ctx;
        
        // Create radial gradient for fireball
        const gradient = ctx.createRadialGradient(
            effect.x, effect.y, 0,
            effect.x, effect.y, effect.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 100, 0.9)');
        gradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add flickering flames
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + effect.life * 0.01;
            const flameX = effect.x + Math.cos(angle) * (effect.radius * 0.8);
            const flameY = effect.y + Math.sin(angle) * (effect.radius * 0.8);
            
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, 0.7)`;
            ctx.beginPath();
            ctx.arc(flameX, flameY, 3 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawExplosionEffect(effect) {
        const ctx = gameState.ctx;
        
        // Multiple explosion rings
        for (let i = 0; i < 4; i++) {
            const ringRadius = effect.radius * (i + 1) / 4;
            const alpha = (4 - i) / 4 * (effect.life / effect.maxLife);
            
            ctx.strokeStyle = `rgba(255, ${150 - i * 30}, 0, ${alpha})`;
            ctx.lineWidth = 6 - i;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Explosion sparks
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const sparkDistance = effect.radius * (1 - effect.life / effect.maxLife);
            const sparkX = effect.x + Math.cos(angle) * sparkDistance;
            const sparkY = effect.y + Math.sin(angle) * sparkDistance;
            
            ctx.fillStyle = `rgba(255, 200, 0, ${effect.life / effect.maxLife})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawHealEffect(effect) {
        const ctx = gameState.ctx;
        const rotation = effect.rotation || 0;
        
        // Healing sparkles in a spiral
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + rotation;
            const distance = 25 + Math.sin(effect.life * 0.01 + i) * 10;
            const sparkX = effect.x + Math.cos(angle) * distance;
            const sparkY = effect.y + Math.sin(angle) * distance;
            
            // Green healing sparkle
            ctx.fillStyle = `rgba(56, 239, 125, ${0.8 * effect.life / effect.maxLife})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 3 + Math.sin(effect.life * 0.01 + i) * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // White core
            ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * effect.life / effect.maxLife})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Central healing aura
        const auraGrad = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, 20);
        auraGrad.addColorStop(0, `rgba(56, 239, 125, ${0.3 * effect.life / effect.maxLife})`);
        auraGrad.addColorStop(1, 'rgba(56, 239, 125, 0)');
        
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    drawShieldEffect(effect) {
        const ctx = gameState.ctx;
        const rotation = effect.rotation || 0;
        
        // Shield barrier ring
        ctx.strokeStyle = `rgba(55, 66, 250, ${0.8 * effect.life / effect.maxLife})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = rotation * 100;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Shield energy pulses
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 + rotation;
            const pulseX = effect.x + Math.cos(angle) * 30;
            const pulseY = effect.y + Math.sin(angle) * 30;
            
            ctx.fillStyle = `rgba(100, 149, 237, ${0.6 * effect.life / effect.maxLife})`;
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawSlashEffect(effect) {
        const ctx = gameState.ctx;
        
        ctx.globalAlpha = effect.alpha || 1;
        ctx.strokeStyle = '#38ef7d';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        // Add glow effect
        ctx.shadowColor = '#38ef7d';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(effect.fromX, effect.fromY);
        ctx.lineTo(effect.toX, effect.toY);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }

    drawImpactEffect(effect) {
        const ctx = gameState.ctx;
        
        // Impact burst
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const lineLength = 15 * (effect.life / effect.maxLife);
            const startX = effect.x + Math.cos(angle) * 5;
            const startY = effect.y + Math.sin(angle) * 5;
            const endX = startX + Math.cos(angle) * lineLength;
            const endY = startY + Math.sin(angle) * lineLength;
            
            ctx.strokeStyle = `rgba(255, 255, 0, ${effect.life / effect.maxLife})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    drawBurnEffect(effect) {
        const ctx = gameState.ctx;
        
        // Burning flames
        for (let i = 0; i < 6; i++) {
            const flameX = effect.x + (Math.random() - 0.5) * effect.width;
            const flameY = effect.y + (Math.random() - 0.5) * effect.height;
            const flameSize = 3 + Math.random() * 4;
            
            ctx.fillStyle = `rgba(255, ${Math.random() * 100 + 100}, 0, ${0.8 * effect.life / effect.maxLife})`;
            ctx.beginPath();
            ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawParticles() {
        const ctx = gameState.ctx;
        
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // Effect Creation Methods
    createFireballEffect(x, y, radius = 80) {
        this.effects.push({
            type: 'fireball',
            x: x,
            y: y,
            radius: radius,
            life: 1000,
            maxLife: 1000
        });

        // Add screen shake
        this.addScreenShake(5, 300);

        // Create fire particles
        this.createFireParticles(x, y, 20);
    }

    createExplosionEffect(x, y, radius = 60) {
        this.effects.push({
            type: 'explosion',
            x: x,
            y: y,
            radius: radius,
            life: 800,
            maxLife: 800
        });

        // Strong screen shake for explosion
        this.addScreenShake(8, 400);

        // Create explosion particles
        this.createExplosionParticles(x, y, 15);
    }

    createHealEffect(x, y) {
        this.effects.push({
            type: 'heal',
            x: x,
            y: y,
            rotation: 0,
            life: 1500,
            maxLife: 1500
        });

        // Create heal particles
        this.createHealParticles(x, y, 10);
    }

    createShieldEffect(x, y) {
        this.effects.push({
            type: 'shield',
            x: x,
            y: y,
            rotation: 0,
            life: 10000, // 10 seconds
            maxLife: 10000
        });
    }

    createSlashEffect(fromX, fromY, toX, toY) {
        this.effects.push({
            type: 'slash',
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            alpha: 1,
            life: 300,
            maxLife: 300
        });

        // Create impact effect at target
        this.createImpactEffect(toX, toY);
    }

    createImpactEffect(x, y) {
        this.effects.push({
            type: 'impact',
            x: x,
            y: y,
            life: 400,
            maxLife: 400
        });

        // Light screen shake
        this.addScreenShake(3, 200);
    }

    createBurnEffect(x, y, width, height) {
        this.effects.push({
            type: 'burn',
            x: x,
            y: y,
            width: width,
            height: height,
            life: 2000,
            maxLife: 2000
        });
    }

    // Particle Creation Methods
    createFireParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: `rgba(255, ${100 + Math.random() * 100}, 0, 1)`,
                life: 500 + Math.random() * 500,
                maxLife: 1000,
                alpha: 1
            });
        }
    }

    createExplosionParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                color: `rgba(255, ${150 + Math.random() * 105}, 0, 1)`,
                life: 300 + Math.random() * 400,
                maxLife: 700,
                alpha: 1
            });
        }
    }

    createHealParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20, // Float upward
                size: 2 + Math.random() * 2,
                color: `rgba(56, 239, 125, 1)`,
                life: 800 + Math.random() * 400,
                maxLife: 1200,
                alpha: 1
            });
        }
    }

    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }

    // Utility Methods
    clearAllEffects() {
        this.effects = [];
        this.particles = [];
        this.screenShake = { intensity: 0, duration: 0 };
    }

    getActiveEffectCount() {
        return this.effects.length + this.particles.length;
    }

    hasEffectAt(x, y, radius = 20) {
        return this.effects.some(effect => {
            const distance = Math.sqrt(Math.pow(effect.x - x, 2) + Math.pow(effect.y - y, 2));
            return distance <= radius;
        });
    }
}

// Global effects manager instance
const effectsManager = new EffectsManager();
