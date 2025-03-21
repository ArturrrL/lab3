const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const loginForm = document.getElementById('loginForm');
const gameContainer = document.getElementById('gameContainer');
const resultsDiv = document.getElementById('results');

let car = { x: 300, y: 300, width: 40, height: 20, angle: 0, speed: 0, maxSpeed: 5, drifting: false };
let obstacles = [], bonuses = [], smokeParticles = [];
let score = 0, driftTime = 0, gameRunning = false, username = '';
let keys = {};

function registerUser() {
    username = document.getElementById('username').value.trim();
    if (username) {
        loginForm.style.display = 'none';
        gameContainer.style.display = 'block';
        startGame();
    } else {
        alert('Введіть ім’я!');
    }
}

function startGame() {
    gameRunning = true;
    score = 0;
    driftTime = 0;
    car.x = 300;
    car.y = 300;
    car.angle = 0;
    car.speed = 0;
    obstacles = [];
    bonuses = [];
    smokeParticles = [];
    animate();
}

function endGame() {
    gameRunning = false;
    gameContainer.style.display = 'none';
    resultsDiv.style.display = 'block';

    // Збереження передостаннього результату в LocalStorage
    const previousScore = localStorage.getItem(`lastScore_${username}`) || '-';
    localStorage.setItem(`lastScore_${username}`, score);

    fetch('/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, score, driftTime, date: new Date().toISOString() })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('currentScore').textContent = `Ваш результат: ${score} очок`;
        document.getElementById('bestScore').textContent = `Рекорд: ${data.bestScore} очок (Попередній: ${previousScore})`;
    })
    .catch(err => console.error('Помилка:', err));
}

function restartGame() {
    resultsDiv.style.display = 'none';
    gameContainer.style.display = 'block';
    startGame();
}

function drawCar() {
    ctx.save();
    ctx.translate(car.x + car.width / 2, car.y + car.height / 2);
    ctx.rotate(car.angle);

    // Кузов машинки
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);

    // Колеса
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-car.width / 2 + 5, -car.height / 2 - 5, 8, 5);
    ctx.fillRect(car.width / 2 - 13, -car.height / 2 - 5, 8, 5);
    ctx.fillRect(-car.width / 2 + 5, car.height / 2, 8, 5);
    ctx.fillRect(car.width / 2 - 13, car.height / 2, 8, 5);

    ctx.restore();
}

function drawSmoke() {
    if (car.drifting) {
        smokeParticles.push({
            x: car.x + car.width / 2 - Math.cos(car.angle) * car.width / 2,
            y: car.y + car.height / 2 - Math.sin(car.angle) * car.height / 2,
            size: 10,
            opacity: 0.6
        });
    }

    smokeParticles.forEach((p, i) => {
        p.size += 0.5;
        p.opacity -= 0.02;
        if (p.opacity <= 0) {
            smokeParticles.splice(i, 1);
            return;
        }

        ctx.fillStyle = `rgba(150, 150, 150, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function animate() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (car.drifting) {
        car.speed *= 0.98;
        car.angle += 0.05 * (keys.ArrowLeft ? -1 : keys.ArrowRight ? 1 : 0);
        driftTime++;
        score += 1;
    } else {
        car.speed = Math.min(car.speed + (keys.ArrowUp ? 0.2 : keys.ArrowDown ? -0.2 : 0), car.maxSpeed);
        car.speed *= 0.95;
        car.angle += 0.03 * (keys.ArrowLeft ? -1 : keys.ArrowRight ? 1 : 0);
    }
    car.x += car.speed * Math.cos(car.angle);
    car.y += car.speed * Math.sin(car.angle);
    if (car.x < 0) car.x = 0; if (car.x > 560) car.x = 560;
    if (car.y < 0) car.y = 0; if (car.y > 380) car.y = 380;

    drawSmoke();
    drawCar();

    if (Math.random() < 0.03) obstacles.push({ x: Math.random() * 560, y: -20 });
    obstacles.forEach((o, i) => {
        o.y += 3;
        ctx.fillStyle = '#6d6875';
        ctx.beginPath();
        ctx.arc(o.x, o.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b5838d';
        ctx.stroke();
        if (Math.hypot(o.x - car.x, o.y - car.y) < 25) endGame();
        if (o.y > 400) obstacles.splice(i, 1);
    });

    if (Math.random() < 0.02) bonuses.push({ x: Math.random() * 560, y: -20 });
    bonuses.forEach((b, i) => {
        b.y += 2;
        ctx.fillStyle = '#457b9d';
        ctx.fillRect(b.x, b.y, 15, 15);
        ctx.strokeStyle = '#a8dadc';
        ctx.strokeRect(b.x, b.y, 15, 15);
        if (Math.hypot(b.x - car.x, b.y - car.y) < 25) {
            score += 50;
            bonuses.splice(i, 1);
        }
        if (b.y > 400) bonuses.splice(i, 1);
    });

    scoreDisplay.textContent = `Очки: ${score}`;
    requestAnimationFrame(animate);
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') car.drifting = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === ' ') car.drifting = false;
});