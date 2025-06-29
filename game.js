const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const timerEl = document.getElementById('timer');

// Game constants
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const BALL_SIZE = 16;
const PLAYER_X = 20;
const AI_X = canvas.width - PLAYER_X - PADDLE_WIDTH;
const BALL_SPEED = 6;

// Game state
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let ballX = canvas.width / 2 - BALL_SIZE / 2;
let ballY = canvas.height / 2 - BALL_SIZE / 2;
let ballVelX = 0;
let ballVelY = 0;
let aiSpeed = 4;

let playerScore = 0;
let aiScore = 0;

let gameStarted = false;
let gameStartTime = 0;
let timerInterval = null;

// --- Sound Effects ---
const paddleHitSound = new Audio("paddle_hit.wav");
const failSound = new Audio("failure.wav");

// --- DRAWING FUNKSIYALARI ---
function drawRect(x, y, w, h, color = '#fff') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawBall(x, y, size, color = '#fff') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawScore() {
    // Yutayotgan yashil, yutqizayotgan qizil, teng bo‘lsa oq
    let playerColor = "#fff", aiColor = "#fff";
    if (playerScore > aiScore) {
        playerColor = "#7cf9a4"; // yashil
        aiColor = "#fa5656";     // qizil
    } else if (aiScore > playerScore) {
        playerColor = "#fa5656";
        aiColor = "#7cf9a4";
    }
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = playerColor;
    ctx.fillText(`${playerScore}`, canvas.width / 4, 50);
    ctx.fillStyle = aiColor;
    ctx.fillText(`${aiScore}`, canvas.width * 3 / 4, 50);
}

function resetBall() {
    ballX = canvas.width / 2 - BALL_SIZE / 2;
    ballY = canvas.height / 2 - BALL_SIZE / 2;
    // Faqatgina startdan keyin ball harakatlanadi
    ballVelX = gameStarted ? BALL_SPEED * (Math.random() > 0.5 ? 1 : -1) : 0;
    ballVelY = gameStarted ? BALL_SPEED * (Math.random() * 2 - 1) : 0;
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
}

// Mouse control for player paddle
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    playerY = clamp(mouseY - PADDLE_HEIGHT / 2, 0, canvas.height - PADDLE_HEIGHT);
});

function aiMove() {
    // AI paddle centers on the ball with some smoothing
    const target = ballY - (PADDLE_HEIGHT - BALL_SIZE) / 2;
    if (aiY < target) {
        aiY += aiSpeed;
    } else if (aiY > target) {
        aiY -= aiSpeed;
    }
    aiY = clamp(aiY, 0, canvas.height - PADDLE_HEIGHT);
}

function checkCollision(px, py) {
    // Check if ball collides with paddle at (px, py)
    return (
        ballX < px + PADDLE_WIDTH &&
        ballX + BALL_SIZE > px &&
        ballY < py + PADDLE_HEIGHT &&
        ballY + BALL_SIZE > py
    );
}

// TIMER
function updateTimer() {
    if (!gameStarted) {
        timerEl.textContent = "00:00";
        return;
    }
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const min = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const sec = (elapsed % 60).toString().padStart(2, '0');
    timerEl.textContent = `${min}:${sec}`;
}

function startTimer() {
    updateTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

function update() {
    if (!gameStarted) return; // O'yin boshlanmasa, update ishlamasin

    // Move ball
    ballX += ballVelX;
    ballY += ballVelY;

    // Top/bottom wall collision
    if (ballY <= 0 || ballY + BALL_SIZE >= canvas.height) {
        ballVelY *= -1;
        ballY = clamp(ballY, 0, canvas.height - BALL_SIZE);
    }

    // Player paddle collision
    if (checkCollision(PLAYER_X, playerY)) {
        ballX = PLAYER_X + PADDLE_WIDTH;
        ballVelX *= -1;
        let deltaY = (ballY + BALL_SIZE / 2) - (playerY + PADDLE_HEIGHT / 2);
        ballVelY = deltaY * 0.25;
        paddleHitSound.currentTime = 0; paddleHitSound.play();
    }

    // AI paddle collision
    if (checkCollision(AI_X, aiY)) {
        ballX = AI_X - BALL_SIZE;
        ballVelX *= -1;
        let deltaY = (ballY + BALL_SIZE / 2) - (aiY + PADDLE_HEIGHT / 2);
        ballVelY = deltaY * 0.25;
        paddleHitSound.currentTime = 0; paddleHitSound.play();
    }

    // Left/right wall (score & fail sound)
    if (ballX < 0) {
        aiScore++;
        failSound.currentTime = 0; failSound.play();
        resetBall();
    }
    if (ballX + BALL_SIZE > canvas.width) {
        playerScore++;
        failSound.currentTime = 0; failSound.play();
        resetBall();
    }

    aiMove();
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    drawRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, '#61dafb');
    drawRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT, '#fa5656');

    // Draw ball
    drawBall(ballX, ballY, BALL_SIZE, '#fff');

    // Draw score
    drawScore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// --- START tugmasi va o'yin boshqaruvi --- //
function initGame() {
    playerScore = 0;
    aiScore = 0;
    playerY = (canvas.height - PADDLE_HEIGHT) / 2;
    aiY = (canvas.height - PADDLE_HEIGHT) / 2;
    gameStarted = false;
    resetBall();
    stopTimer();
    updateTimer();
}

startBtn.addEventListener('click', () => {
    if (gameStarted) return;
    gameStarted = true;
    gameStartTime = Date.now();
    resetBall();
    startTimer();
    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';
});

// O'yin boshida toza holat
initGame();
loop();