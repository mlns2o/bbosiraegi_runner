const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let width, height, groundY;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  canvas.style.width = viewportWidth + "px";
  canvas.style.height = viewportHeight + "px";
  canvas.width = viewportWidth * ratio;
  canvas.height = viewportHeight * ratio;

  ctx.resetTransform?.();
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  width = viewportWidth;
  height = viewportHeight;
  groundY = height - 50;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 🧩 게임 상태
let gameStarted = false;
let showStartScreen = true;
let obstacles = [];
let items = [];
let floatingTexts = [];
let spawnTimer = 0;
let itemTimer = 0;
let score = 0;
let gameOver = false;
let gameClear = false;
let baseSpeed = 8;
let currentBg = 0;
let startTime = null;
let hitCount = 0;
const maxHits = 6;
let lastJumpTime = 0;
let lastHitTime = 0;

// 🧩 플레이어
const playerImage = new Image();
playerImage.src = "assets/img/stage1_siraegi.png";

const player = {
  x: 80,
  y: 0,
  w: 80,
  h: 120,
  vy: 0,
  gravity: 0.8,
  jumping: false,
  jumpCount: 0,
};

function jump() {
  const now = performance.now();
  const doubleJump = now - lastJumpTime <= 400;

  if (gameOver || gameClear) {
    gameOver = false;
    gameClear = false;
    resetGame();
    return;
  }

  if (!gameStarted) {
    gameStarted = true;
    showStartScreen = false;
    requestAnimationFrame(loop);
    return;
  }

  if (!gameOver && !gameClear) {
    if (!player.jumping) {
      player.vy = -15;
      player.jumping = true;
      player.jumpCount = 1;
      lastJumpTime = now;
    } else if (player.jumpCount === 1 && doubleJump) {
      player.vy = -22;
      player.jumpCount = 2;
      lastJumpTime = now;
    }
  }
}
document.addEventListener("keydown", e => e.code === "Space" && jump());
canvas.addEventListener("touchstart", jump);

function resetGame() {
  obstacles = [];
  items = [];
  floatingTexts = [];
  score = 0;
  gameOver = false;
  gameClear = false;
  baseSpeed = 8;
  currentBg = 0;
  startTime = null;
  hitCount = 0;
  lastHitTime = 0;
  player.y = groundY - player.h;
  player.vy = 0;
  player.jumping = false;
  player.jumpCount = 0;
  requestAnimationFrame(loop);
}

// 🧩 충돌
function checkCollision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function updateStageByTime(currentTime) {
  if (!startTime) startTime = currentTime;
  const elapsed = (currentTime - startTime) / 1000;
  if (elapsed >= 50) currentBg = 4;
  else if (elapsed >= 35) currentBg = 3;
  else if (elapsed >= 20) currentBg = 2;
  else if (elapsed >= 10) currentBg = 1;
  else currentBg = 0;
  if (elapsed >= 60) gameClear = true;
  return elapsed;
}

const obstacleStyles = [
  { color: "#a0d8ef", shape: "circle" },
  { color: "#7b7b7b", shape: "rect" },
  { color: "#222", shape: "bar" },
  { color: "#d32f2f", shape: "rect" },
  { color: "#8e24aa", shape: "rect" },
];

function drawObstacle(o, style) {
  ctx.fillStyle = style.color;
  switch (style.shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "bar":
      ctx.fillRect(o.x, o.y + o.h - 10, o.w, 10);
      break;
    default:
      ctx.fillRect(o.x, o.y, o.w, o.h);
  }
}

function drawStar(x, y, r, color = "yellow") {
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.moveTo(0, -r);
  for (let i = 0; i < 5; i++) {
    ctx.rotate(Math.PI / 5);
    ctx.lineTo(0, -r * 0.5);
    ctx.rotate(Math.PI / 5);
    ctx.lineTo(0, -r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawFloatingTexts() {
  floatingTexts.forEach(ft => {
    ctx.fillStyle = `rgba(255,255,255,${ft.alpha})`;
    ctx.font = "bold 24px Arial";
    ctx.fillText(ft.text, ft.x, ft.y);
    ft.y -= 1;
    ft.alpha -= 0.02;
  });
  floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);
}

function drawEnding(text, color = "white") {
  ctx.fillStyle = "black";
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height / 2);
  ctx.font = "24px Arial";
  ctx.fillText("탭하거나 스페이스로 다시 시작", width / 2, height / 2 + 40);
}

function drawStartScreen() {
  ctx.fillStyle = "#fff176";
  const boxW = width * 0.7;
  const boxH = 150;
  const x = (width - boxW) / 2;
  const y = (height - boxH) / 2;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeStyle = "#333";
  ctx.strokeRect(x, y, boxW, boxH);
  ctx.fillStyle = "black";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("스페이스바 또는 화면을 탭하여 게임을 시작하세요", width / 2, height / 2 + 10);
}

function drawLives() {
  const radius = 15;
  const margin = 10;
  const safeY = 50;
  const startX = width - (radius * 2 + margin) * 3;

  for (let i = 0; i < 3; i++) {
    const damage = Math.min(2, Math.max(0, hitCount - i * 2));
    ctx.beginPath();
    ctx.arc(startX + i * (radius * 2 + margin), safeY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ff4444";
    ctx.fill();

    if (damage === 1) {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(startX + i * (radius * 2 + margin), safeY, radius, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(startX + i * (radius * 2 + margin), safeY);
      ctx.closePath();
      ctx.fill();
    } else if (damage >= 2) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(startX + i * (radius * 2 + margin), safeY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawProgressBar(elapsed) {
  const totalTime = 60;
  const progressRatio = Math.min(elapsed / totalTime, 1);
  const barWidth = width * 0.4;
  const barHeight = 10;
  const barX = (width - barWidth) / 2;
  const barY = height * 0.05;
  ctx.fillStyle = "#ccc";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  const indicatorX = barX + progressRatio * barWidth - 2;
  ctx.fillStyle = "#00b050";
  ctx.fillRect(indicatorX, barY - 4, 6, barHeight + 8);
}

function loop(timestamp) {
  if (gameOver) return drawEnding("GAME OVER");
  if (gameClear) return drawEnding("MISSION CLEAR!", "#00ff88");

  const elapsed = updateStageByTime(timestamp);
  const bgColors = ["#87cefa", "#90ee90", "#fff176", "#ffb74d", "#b0bec5"];
  ctx.fillStyle = bgColors[currentBg];
  ctx.fillRect(0, 0, width, height);

  player.y += player.vy;
  player.vy += player.gravity;
  if (player.y >= groundY - player.h) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.jumping = false;
    player.jumpCount = 0;
  }

  if (playerImage.complete) ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
  else {
    ctx.fillStyle = "green";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  let currentSpeed = baseSpeed + Math.floor(score / 500);

  spawnTimer++;
  if (spawnTimer > 90 - Math.min(score / 50, 60)) {
    obstacles.push({ x: width, y: groundY - 40, w: 30, h: 40, stage: currentBg });
    spawnTimer = 0;
  }

  itemTimer++;
  if (itemTimer > 500 + Math.random() * 800) {
    items.push({ x: width + 30, y: groundY - 100 - Math.random() * 150, r: 15, stage: currentBg });
    itemTimer = 0;
  }

  obstacles.forEach(o => {
    o.x -= currentSpeed;
    drawObstacle(o, obstacleStyles[o.stage]);
    if (checkCollision(player, o)) {
      const now = performance.now();
      if (now - lastHitTime > 500) {
        hitCount += 1;
        lastHitTime = now;
      }
      obstacles = obstacles.filter(obs => obs !== o);
      if (hitCount >= maxHits) gameOver = true;
    }
  });
  obstacles = obstacles.filter(o => o.x + o.w > 0);

  items.forEach(it => {
    it.x -= currentSpeed;
    drawStar(it.x, it.y, it.r);
    if (checkCollision(player, { x: it.x - it.r, y: it.y - it.r, w: it.r * 2, h: it.r * 2 })) {
      score += 50;
      floatingTexts.push({ x: it.x, y: it.y, text: "+50", alpha: 1 });
      items = items.filter(i => i !== it);
    }
  });
  items = items.filter(it => it.x + it.r > 0);

  score++;
  ctx.fillStyle = "black";
  ctx.font = `${height * 0.03}px Arial`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`점수: ${score}`, width * 0.05, height * 0.03);

  drawLives();
  drawProgressBar(elapsed);
  drawFloatingTexts();

  requestAnimationFrame(loop);
}

function renderStartScreen() {
  ctx.fillStyle = "#87cefa";
  ctx.fillRect(0, 0, width, height);
  drawStartScreen();
}
renderStartScreen();
