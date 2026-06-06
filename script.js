const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreEl');
const gameOverModal = document.getElementById('gameOverModal');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- সাউন্ড ইফেক্ট (Sound Effects) ---
const shootSound = new Audio('https://labs.phaser.io/assets/audio/SoundEffects/blaster.mp3');
const explosionSound = new Audio('https://labs.phaser.io/assets/audio/SoundEffects/explosion.mp3');
shootSound.volume = 0.3;
explosionSound.volume = 0.5;

// --- গেমের ছবি (Images) ---
const playerImg = new Image();
playerImg.src = 'https://labs.phaser.io/assets/sprites/ship.png'; // স্পেসশিপের ছবি

const enemyImg = new Image();
enemyImg.src = 'https://labs.phaser.io/assets/sprites/space-baddie.png'; // এলিয়েনের ছবি

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
    y: canvas.height - 80,
    width: 50,
    height: 50,
    draw() {
        // ছবি আঁকা
        ctx.drawImage(playerImg, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
};

// মাউস বা টাচ দিয়ে প্লেয়ারকে সরানো
canvas.addEventListener('touchmove', (e) => {
    player.x = e.touches[0].clientX;
});
canvas.addEventListener('mousemove', (e) => {
    player.x = e.clientX;
});

// লেজার/গুলি
class Projectile {
    constructor(x, y, velocity) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.color = '#0f0'; // সবুজ গুলি
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

// শত্রু (এলিয়েন)
class Enemy {
    constructor(x, y, width, height, velocity) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocity = velocity;
    }
    draw() {
        ctx.drawImage(enemyImg, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
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
        this.alpha = 1;
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
        this.alpha -= 0.02;
    }
}

// শত্রু তৈরি করা
function spawnEnemies() {
    if (frames % 60 === 0) {
        const width = 40;
        const height = 40;
        const x = Math.random() * (canvas.width - width) + width / 2;
        const velocity = Math.random() * 2 + 1.5;
        enemies.push(new Enemy(x, -50, width, height, velocity));
    }
}

// মেইন গেম লুপ
function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 15, 0.5)'; // স্পেস ব্যাকগ্রাউন্ড ইফেক্ট
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    player.draw();
    
    // অটো ফায়ারিং এবং সাউন্ড
    if (frames % 15 === 0) {
        projectiles.push(new Projectile(player.x, player.y - 20, 10));
        // গুলি করার সাউন্ড প্লে করা
        shootSound.currentTime = 0; 
        shootSound.play().catch(e => console.log("Click to enable sound")); 
    }

    // পার্টিকেল আপডেট
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) particles.splice(index, 1);
        else particle.update();
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
        if (distToPlayer < 30) {
            cancelAnimationFrame(animationId);
            gameOverModal.classList.remove('hidden');
            finalScore.innerText = score;
        }

        projectiles.forEach((projectile, pIndex) => {
            const distToEnemy = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            
            // গুলি শত্রুর গায়ে লাগলে
            if (distToEnemy < 25) {
                // বিস্ফোরণের সাউন্ড প্লে করা
                explosionSound.currentTime = 0;
                explosionSound.play().catch(e => console.log("Audio play error"));

                // বিস্ফোরণের আগুন তৈরি করা
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 3, '#f97316', {
                        x: (Math.random() - 0.5) * 5,
                        y: (Math.random() - 0.5) * 5
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

restartBtn.addEventListener('click', () => {
    initGame();
});

// সাউন্ড পলিসির জন্য স্ক্রিনে একবার ক্লিক বা টাচ করলে গেম শুরু হবে
window.addEventListener('click', () => {
    if(frames === 0) initGame();
}, { once: true });
window.addEventListener('touchstart', () => {
    if(frames === 0) initGame();
}, { once: true });

// স্ক্রিনে নির্দেশিকা দেখানো
ctx.fillStyle = "white";
ctx.font = "20px Arial";
ctx.textAlign = "center";
ctx.fillText("গেম শুরু করতে স্ক্রিনে টাচ করুন বা ক্লিক করুন", canvas.width/2, canvas.height/2);
