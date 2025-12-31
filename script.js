const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let fireworks = [];

// --- Utils ---
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function random(min, max) {
    return Math.random() * (max - min) + min;
}

// --- Particle Background (Starfield effect) ---
class Particle {
    constructor() {
        this.x = random(0, width);
        this.y = random(0, height);
        this.size = random(0.5, 2);
        this.speedX = random(-0.2, 0.2);
        this.speedY = random(-0.2, 0.2);
        this.opacity = random(0, 1);
        this.fadeDir = random(0.005, 0.02) * (Math.random() > 0.5 ? 1 : -1);
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity += this.fadeDir;
        if (this.opacity <= 0 || this.opacity >= 1) this.fadeDir *= -1;
        
        // Wrap around screen
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    for (let i = 0; i < 150; i++) {
        particles.push(new Particle());
    }
}

// --- Firework Logic ---
class Firework {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = 2; // Initial launch speed
        this.angle = Math.atan2(targetY - y, targetX - x);
        this.distanceToTarget = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));
        this.distanceTraveled = 0;
        this.coordinates = [];
        this.coordinateCount = 3;
        while(this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        this.acceleration = 1.05;
        this.brightness = random(50, 70);
        this.targetRadius = 1;
        this.exploded = false;
    }

    update(index) {
        // Remove from array if exploded
        if(this.exploded) {
            fireworks.splice(index, 1);
            createParticles(this.targetX, this.targetY); // Create explosion particles
            return;
        }

        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        // Speed up
        this.speed *= this.acceleration;
        
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        
        this.distanceTraveled = Math.sqrt(Math.pow(this.x - this.startX, 2) + Math.pow(this.y - this.startY, 2));

        if(this.distanceTraveled >= this.distanceToTarget) {
            this.exploded = true;
        } else {
            this.x += vx;
            this.y += vy;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsl(${random(0,360)}, 100%, ${this.brightness}%)`;
        ctx.stroke();
    }
}

// Spark particles for explosion
let sparks = [];
class Spark {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = random(0, Math.PI * 2);
        this.speed = random(1, 10);
        this.friction = 0.95;
        this.gravity = 1;
        this.hue = random(0, 360);
        this.brightness = random(50, 80);
        this.alpha = 1;
        this.decay = random(0.015, 0.03);
    }
    
    update(index) {
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;
        
        if (this.alpha <= 0) {
            sparks.splice(index, 1);
        }
    }
    
    draw() {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}

function createParticles(x, y) {
    let particleCount = 50;
    while (particleCount--) {
        sparks.push(new Spark(x, y));
    }
}


// --- Animation Loop ---
function animate() {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; // Trail effect
    ctx.fillRect(0, 0, width, height);

    // Update Stars
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Update Fireworks
    // We will launch fireworks randomly if celebration is active
    if (isCelebrating && Math.random() < 0.05) {
        fireworks.push(new Firework(width/2, height, random(100, width-100), random(50, height/2)));
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }
    
    for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].draw();
        sparks[i].update(i);
    }

    requestAnimationFrame(animate);
}

// --- Content Logic ---
const countdownSection = document.getElementById('countdown-section');
const messageSection = document.getElementById('message-section');
const unlockBtn = document.getElementById('unlock-btn');
const fireworksBtn = document.getElementById('fireworks-btn');

// Set New Year Date (For demo, set to 10 seconds from now if we want instant gratification, 
// or strictly Jan 1st 2026. Given the request, user likely wants to see it work.)
// Let's set it to next year Jan 1st for realism, but add a cheat to unlock manually.
const nextYear = new Date().getFullYear() + 1;
const newYearDate = new Date(`Jan 1, ${nextYear} 00:00:00`).getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const gap = newYearDate - now;

    if (gap < 0) {
        // It's already New Year!
        document.querySelector('.subtitle').innerText = "The moment is here!";
        unlockBtn.classList.remove('hidden');
        return;
    }

    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;

    const d = Math.floor(gap / day);
    const h = Math.floor((gap % day) / hour);
    const m = Math.floor((gap % hour) / minute);
    const s = Math.floor((gap % minute) / second);

    document.getElementById('days').innerText = d < 10 ? '0' + d : d;
    document.getElementById('hours').innerText = h < 10 ? '0' + h : h;
    document.getElementById('minutes').innerText = m < 10 ? '0' + m : m;
    document.getElementById('seconds').innerText = s < 10 ? '0' + s : s;
    
    // FOR TESTING: Show unlock button immediately if user wants (optional)
    // Uncomment next line to debug flow:
    // unlockBtn.classList.remove('hidden'); 
}

setInterval(updateCountdown, 1000);

// Interaction
let isCelebrating = false;

unlockBtn.addEventListener('click', () => {
    countdownSection.classList.remove('active-section');
    countdownSection.classList.add('hidden-section');
    
    setTimeout(() => {
        messageSection.classList.remove('hidden-section');
        messageSection.classList.add('active-section');
        isCelebrating = true; // Auto start fireworks
    }, 800);
});

fireworksBtn.addEventListener('click', () => {
    // Just intensify or simple interaction
    for(let i=0; i<5; i++) {
        fireworks.push(new Firework(width/2, height, random(100, width-100), random(50, height/2)));
    }
});

// For demonstration purposes, if the countdown is far away, we might want to let the user
// click slightly earlier or have a 'secret' unlock.
// Let's make the "Waiting for our moment..." text clickable as a dev secret to test.
document.querySelector('.subtitle').addEventListener('click', () => {
    unlockBtn.classList.remove('hidden');
});

initParticles();
animate();
