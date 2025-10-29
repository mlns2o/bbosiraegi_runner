// game.js
import { Player } from "./player.js";
import { StageManager } from "./stageManager.js";
import { drawUI } from "./ui.js";
import { resizeCanvas, checkCollision } from "./utils.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let width, height, groundY, safePadding;
let player, stageManager;
let floatingTexts = [];
let score = 0;
let hitCount = 0;
const maxHits = 6;
let lastTime = 0;

// 🎮 상태 관리
let gameState = "start"; // "start" | "howto" | "playing" | "gameover" | "clear"

// ====================== 화면 ======================
// ✅ 시작화면
let startImageLoaded = false;
let startImage = new Image();
startImage.src = "assets/img/start_background.png";
startImage.onload = () => {
  startImageLoaded = true;
  if (gameState === "start") drawStartScreen();
};

function drawStartScreen() {
  ctx.clearRect(0, 0, width, height);
  if (startImageLoaded) {
    ctx.drawImage(startImage, 0, 0, width, height);
  }
}

// ✅ 설명화면
let howToLoaded = false;
let howToImg = new Image();
howToImg.src = "assets/img/start_notice.png";
howToImg.onload = () => {
  howToLoaded = true;
  if (gameState === "howto") drawHowToScreen();
};

function drawHowToScreen() {
  ctx.clearRect(0, 0, width, height);
  if (howToLoaded) {
    ctx.drawImage(howToImg, 0, 0, width, height);
  }
}

function setupCanvas() {
  const size = resizeCanvas(canvas, ctx);
  width = size.width;
  height = size.height;
  safePadding = size.safePadding;
  groundY = height - 50;

  if (gameState === "start") drawStartScreen();
  else if (gameState === "howto") drawHowToScreen();
}
setupCanvas();
window.addEventListener("resize", setupCanvas);

player = new Player(width, height);
stageManager = new StageManager(width, height);

function drawGameOverScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = `bold ${Math.floor(height * 0.08)}px Arial`;
  ctx.fillText("💥 GAME OVER 💥", width / 2, height / 2 - 20);
  ctx.font = `${Math.floor(height * 0.04)}px Arial`;
  ctx.fillText(`총 점수: ${Math.floor(score)}`, width / 2, height / 2 + 40);
  ctx.fillText("스페이스 또는 터치로 다시 시작", width / 2, height / 2 + 100);
}

function drawClearScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = `bold ${Math.floor(height * 0.08)}px Arial`;
  ctx.fillText("🎉 CLEAR! 🎉", width / 2, height / 2 - 20);
  ctx.font = `${Math.floor(height * 0.04)}px Arial`;
  ctx.fillText(`총 점수: ${Math.floor(score)}`, width / 2, height / 2 + 40);
  ctx.fillText("스페이스 또는 터치로 다시 시작", width / 2, height / 2 + 100);
}

// ====================== 리셋 ======================
function resetGame() {
  floatingTexts = [];
  score = 0;
  hitCount = 0;
  lastTime = 0;
  player.reset(width, height);
  stageManager.reset(player);
}

// ====================== 입력 처리 ======================
let spaceHeld = false;
let spacePressTime = 0;

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Tab" || e.code === "Enter") {
    if (!spaceHeld) {
      spaceHeld = true;
      spacePressTime = Date.now();
      handleInput();
    }
  }

  if (e.code === "ArrowRight" && gameState === "playing") {
    player.slide(true, groundY);
    setTimeout(() => player.slide(false, groundY), 500);
  }
});

document.addEventListener("keyup", (e) => {
  if (["Space", "Tab", "Enter"].includes(e.code)) spaceHeld = false;
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  handleInput();
});

// ====================== 모바일 스와이프 감지 ======================
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchInProgress = false;

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchInProgress = true;
  }
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (!touchInProgress) return;
  touchInProgress = false;

  if (e.changedTouches.length === 1) {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    handleTouchGesture();
  }
});

function handleTouchGesture() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  // 👉 오른쪽 스와이프 → 슬라이드
  if (Math.abs(dx) > Math.abs(dy) && dx > 50 && gameState === "playing") {
    player.slide(true, groundY);
    setTimeout(() => player.slide(false, groundY), 500);
    return;
  }

  // 👆 위로 스와이프 → 점프
  if (Math.abs(dy) > Math.abs(dx) && dy < -50 && gameState === "playing") {
    player.jump();
    return;
  }

  // 👆👆 단순 탭 (짧은 터치) → 점프 (이중점프 허용)
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && gameState === "playing") {
    player.jump(); // ✅ 이 부분이 double jump를 트리거함
  }
}



// 🎮 상태별 입력 처리
function handleInput() {
  switch (gameState) {
    case "start":
      gameState = "howto";
      drawHowToScreen();
      break;
    case "howto":
      gameState = "playing";
      requestAnimationFrame(loop);
      break;
    case "playing":
      player.jump();
      break;
    case "gameover":
    case "clear":
      resetGame();
      gameState = "start";
      drawStartScreen();
      break;
  }
}

// ====================== 메인 루프 ======================
function loop(timestamp) {
  if (gameState !== "playing") return;

  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  stageManager.update(timestamp, ctx, width, height, player);

  if (stageManager.isCleared()) {
    gameState = "clear";
    drawClearScreen();
    return;
  }

  score += 10 * delta;
  player.update(ctx, groundY);
  drawUI(ctx, width, height, Math.floor(score), hitCount, stageManager.elapsed, safePadding);

  // 충돌 처리
  stageManager.obstacles.forEach((o) => {
    if (checkCollision(player, o) && !player.invincible && !o.fadeOut) {
      hitCount++;
      player.hit();
      score = Math.max(0, score - 20);
      floatingTexts.push({
        text: "-20",
        x: player.x + player.w / 2,
        y: player.y - 20,
        alpha: 1,
        dy: -1,
      });
      if (o.fall) o.fadeOut = true;
    }
  });

  // 아이템 충돌 처리
  stageManager.items = stageManager.items.filter((item) => {
    if (checkCollision(player, item)) {
      score += 50;
      floatingTexts.push({
        text: "+50",
        x: player.x + player.w / 2,
        y: player.y - 20,
        alpha: 1,
        dy: -1,
      });
      return false;
    }
    return true;
  });

  // 떠오르는 텍스트
  floatingTexts = floatingTexts.filter((f) => {
    f.y += f.dy || -1;
    f.alpha -= 0.02;
    if (f.alpha <= 0) return false;
    ctx.globalAlpha = f.alpha;
    ctx.fillStyle = f.text.startsWith("+") ? "gold" : "red";
    ctx.font = `${Math.floor(height * 0.03)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
    return true;
  });

  // 게임 오버 처리
  if (hitCount >= maxHits) {
    gameState = "gameover";
    drawGameOverScreen();
    return;
  }

  requestAnimationFrame(loop);
}




