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

// ✅ 스토리 화면 
let storyImageLoaded = false;
let storyImage = new Image();
storyImage.src = "assets/img/start_notice_01.png"; // 새로 만든 이미지 경로
storyImage.onload = () => {
  storyImageLoaded = true;
  if (gameState === "story") drawStoryScreen();
};

function drawStoryScreen() {
  ctx.clearRect(0, 0, width, height);
  if (storyImageLoaded) {
    ctx.drawImage(storyImage, 0, 0, width, height);
  }
}


// ✅ 설명화면
let howToLoaded = false;
let howToImg = new Image();
howToImg.src = "assets/img/start_notice_02.png";
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
  else if (gameState === "story") drawStoryScreen();
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
  ctx.fillText("터치로 다시 시작", width / 2, height / 2 + 100);
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
  ctx.fillText("터치로 다시 시작", width / 2, height / 2 + 100);
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

// ====================== 모바일 터치 입력 ======================
let lastTapTime = 0; // 더블탭 간격 측정용
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();

  if (e.changedTouches.length !== 1) return;

  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  // 👉 오른쪽 스와이프 → 슬라이드
  if (Math.abs(dx) > Math.abs(dy) && dx > 50 && gameState === "playing") {
    player.slide(true, groundY);
    setTimeout(() => player.slide(false, groundY), 500);
    return;
  }

  // 👆👆 탭 (짧은 터치) → 점프 (이단 점프 포함)
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
    if (["start", "story", "howto", "gameover", "clear"].includes(gameState)) {
      handleInput(); // 화면 넘기기
      return;
    }

    if (gameState === "playing") {
      const now = Date.now();
      const timeDiff = now - lastTapTime;
      lastTapTime = now;

      // 350ms 이내 두 번 탭이면 — 두 번째 점프도 허용
      if (player.jumpCount === 0) {
      player.jump();
      }
    // ✅ 두 번째 탭: 350ms 안에, 공중에 있을 때만 이단 점프
      else if (player.jumpCount === 1 && timeDiff < 350) {
        player.jump();
      }
    }
  }
});





// 🎮 상태별 입력 처리
function handleInput() {
  switch (gameState) {
    case "start":
      gameState = "story";
      drawStoryScreen();
      break;
    case "story":
      gameState = "howto";        // ✅ 다음은 게임 방법 화면
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
    ctx.font = `bold ${Math.floor(height * 0.03)}px Arial`;
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




