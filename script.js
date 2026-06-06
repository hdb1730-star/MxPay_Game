const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreEl');
const startScreen = document.getElementById('startScreen');
const gameOverModal = document.getElementById('gameOverModal');
const finalScore = document.getElementById('finalScore');
const startPlayBtn = document.getElementById('startPlayBtn');
const restartBtn = document.getElementById('restartBtn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// গেমের ছবি (Assets)
const playerImg = new Image();
playerImg.src = 'https://labs.phaser.io/assets/sprites/player.png'; 

const enemyImg = new Image();
enemyImg.src = 'https://labs.phaser.io/assets/sprites/mine.png'; 

const bulletImg = new Image();
bulletImg.src = 'https://labs.phaser.io/assets/sprites/bullet.png'; 

// সাউন্ড (Sounds)
const shootSound = new Audio('https://labs.phaser.io/assets/audio/SoundEffects/lazer.wav');
const explosionSound = new Audio('https://labs.phaser.io/assets/audio/SoundEffects/explosion.mp3');
shootSound.volume = 0.3;
explosionSound.volume = 0.6;

let score = 0;
let animationId;
let enemies = [];
let projectiles = [];
let frames = 0;
let bgY = 0; 
let isGameRunning = false; // গেম লক করার ভেরিয়েবল

// প্লেয়ারের অবজেক্ট
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    draw() {
        ctx.drawImage(playerImg, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
};

// টাচ কন্ট্রোল (গেম চালু না হলে কাজ করবে না)
canvas.addEventListener('touchmove', (e) => {
    if (!isGameRunning) return; // গেম শুরু না হলে লক থাকবে
    player.x = e.touches[0].clientX;
    player.y = e.touches[0].clientY;
});
canvas.addEventListener('mousemove', (e) => {
    if (!isGameRunning) return; 
    player.x = e.clientX;
    player.y = e.clientY;
});

// লেজার/গুলি
class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 30;
        this.velocity = 12;
    }
    draw() {
        ctx.drawImage(bulletImg, this.x - this.width/2, this.y, this.width, this.height);
    }
    update() {
        this.draw();
        this.y -= this.velocity;
    }
}

// শত্রুর মিসাইল
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

function spawnEnemies() {
    if (frames % 40 === 0) { 
        const size = Math.random() * (40 - 25) + 25;
        const x = Math.random() * (canvas.width - size) + size / 2;
        const velocity = Math.random() * 3 + 2;
        enemies.push(new Enemy(x, -50, size, size, velocity));
    }
}

function animate() {
    if (!isGameRunning) return;
    
    animationId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // ব্যাকগ্রাউন্ড স্ক্রল ইফেক্ট
    bgY += 2;
    document.body.style.backgroundPosition = `0px ${bgY}px`;

    player.draw();
    
    // ফায়ারিং লজিক 
    if (frames % 15 === 0) {
        projectiles.push(new Projectile(player.x, player.y - 20));
        shootSound.currentTime = 0; 
        shootSound.play().catch(()=>{}); 
    }

    // লেজার আপডেট
    projectiles.forEach((projectile, index) => {
        projectile.update();
        if (projectile.y < 0) {
            setTimeout(() => projectiles.splice(index, 1), 0);
        }
    });

    // শত্রু আপডেট ও কলিশন
    enemies.forEach((enemy, index) => {
        enemy.update();

        // প্লেয়ারের সাথে ধাক্কা
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distToPlayer < player.width/2 + enemy.width/2 - 10) {
            isGameRunning = false; // গেম ওভার হলে লক
            cancelAnimationFrame(animationId);
            explosionSound.play().catch(()=>{});
            
            gameOverModal.style.display = 'block'; // গেম ওভার স্ক্রিন দেখানো
            document.getElementById('topBar').style.display = 'none'; 
            finalScore.innerText = score;
        }

        // গুলির সাথে শত্রুর ধাক্কা
        projectiles.forEach((projectile, pIndex) => {
            const distToEnemy = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if (distToEnemy < enemy.width/2) {
                explosionSound.currentTime = 0;
                explosionSound.play().catch(()=>{});
                
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

// গেম শুরু করার মেইন ফাংশন
function initGame() {
    score = 0;
    scoreEl.innerText = score;
    frames = 0;
    enemies = [];
    projectiles = [];
    isGameRunning = true; // গেম আনলক করা হলো
    
    document.getElementById('topBar').style.display = 'flex';
    
    // স্ক্রিনগুলো চিরতরে লুকিয়ে ফেলা
    startScreen.style.display = 'none';
    gameOverModal.style.display = 'none';
    
    // সাউন্ড পলিসি আনলক 
    shootSound.play().then(() => {
        shootSound.pause();
        shootSound.currentTime = 0;
    }).catch(()=>{});

    animate();
}

// বাটন ক্লিক ইভেন্ট 
startPlayBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
