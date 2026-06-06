const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreEl');
const gameOverModal = document.getElementById('gameOverModal');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

// ফুল স্ক্রিন সেট করা
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// গেম ভেরিয়েবল
let score = 0;
let animationId;
let enemies = [];
let projectiles = [];
let particles = [];
let frames = 0;

// প্লেয়ার (স্পেসশিপ)
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: 20,
    color: '#0ff',
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; // রিসেট
    }
};

// মাউস বা টাচ দিয়ে প্লেয়ারকে সরানো
canvas.addEventListener('touchmove', (e) => {
    player.x = e.touches[0].clientX;
});
canvas.addEventListener('mousemove', (e) => {
    player.x = e.clientX;
});

// লেজার/গুলি (Projectiles)
class Projectile {
    constructor(x, y, velocity) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = '#fff';
        this.velocity = velocity;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update() {
        this.draw();
        this.y -= this.velocity;
    }
}

// শত্রু (Enemies)
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    update() {
        this.draw();
        this.y += this.velocity;
    }
}

// বিস্ফোরণের ইফেক্ট (Particles)
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1; // Fading effect
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01; // ধীরে ধীরে গায়েব হবে
    }
}

// শত্রু তৈরি করা
function spawnEnemies() {
    if (frames % 60 === 0) {
        const radius = Math.random() * (30 - 10) + 10;
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`; // Random Neon Color
        const velocity = Math.random() * 3 + 1;
        enemies.push(new Enemy(x, 0 - radius, radius, color, velocity));
    }
}

// মেইন গেম লুপ
function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // লেজ ইফেক্টের জন্য
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    player.draw();
    
    // অটো ফায়ারিং (প্রতি ১০ ফ্রেমে একবার গুলি বের হবে)
    if (frames % 10 === 0) {
        projectiles.push(new Projectile(player.x, player.y, 10));
    }

    // পার্টিকেল আপডেট
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    // লেজার আপডেট
    projectiles.forEach((projectile, index) => {
        projectile.update();
        if (projectile.y + projectile.radius < 0) {
            setTimeout(() => projectiles.splice(index, 1), 0);
        }
    });

    // শত্রু আপডেট এবং কলিশন (ধাক্কা লাগা) চেক করা
    enemies.forEach((enemy, index) => {
        enemy.update();

        // প্লেয়ারের সাথে ধাক্কা লাগলে গেম ওভার
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distToPlayer - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            gameOverModal.classList.remove('hidden');
            finalScore.innerText = score;
        }

        projectiles.forEach((projectile, pIndex) => {
            const distToEnemy = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            
            // গুলি শত্রুর গায়ে লাগলে
            if (distToEnemy - enemy.radius - projectile.radius < 1) {
                // বিস্ফোরণ তৈরি করা
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 3, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }));
                }
                
                score += 10;
                scoreEl.innerText = score;

                setTimeout(() => {
                    enemies.splice(index, 1);
                    projectiles.splice(pIndex, 1);
                }, 0);
            }
        });
    });

    frames++;
    spawnEnemies();
}

// গেম শুরু করা
function initGame() {
    score = 0;
    scoreEl.innerText = score;
    frames = 0;
    enemies = [];
    projectiles = [];
    particles = [];
    gameOverModal.classList.add('hidden');
    animate();
}

// রিস্টার্ট বাটন
restartBtn.addEventListener('click', () => {
    initGame();
});

// প্রথমবার গেম শুরু
initGame();
                      
