import { Player } from "./player.js";
import { StageManager } from "./stageManager.js";
import { drawUI } from "./ui.js";
import { resizeCanvas } from "./utils.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let width, height, groundY, safePadding;
let player, stageManager;
let gameStarted = false;
let gameOver = false;
let floatingTexts = [];
let score = 0;
let hitCount = 0;
const maxHits = 6;
let lastTime = 0;

function setupCanvas() {
  const size = resizeCanvas(canvas, ctx);
  width = size.width;
  height = size.height;
  safePadding = size.safePadding;
  groundY = height - 50;
}
setupCanvas();
window.addEventListener("resize", setupCanvas);

player = new Player(width, height);
stageManager = new StageManager(width, height);

function drawStartScreen() {
  ctx.fillStyle = "#87cefa";
  ctx.fillRect(0, 0, width, height);


  const boxWidth = width * 0.5;
  const boxHeight = height * 0.25;
  const boxX = (width - boxWidth) / 2;
  const boxY = (height - boxHeight) / 2;

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = `bold ${Math.floor(height * 0.05)}px Arial`;
  ctx.fillText("뽀시래기 러너", width / 2, boxY + boxHeight * 0.45);

  ctx.font = `${Math.floor(height * 0.03)}px Arial`;
  ctx.fillText("스페이스를 눌러 시작합니다", width / 2, boxY + boxHeight * 0.75);
}

function resetGame() {
  gameOver = false;
  floatingTexts = [];
  score = 0;
  hitCount = 0;
  lastTime = 0;
  player.reset(width, height);
  stageManager.reset();

  ctx.clearRect(0, 0, width, height);
  stageManager.update(0, ctx, width, height);
  player.update(ctx, groundY);
  drawUI(ctx, width, height, score, hitCount, 0, safePadding);

  setTimeout(() => requestAnimationFrame(loop), 100);
}

let spaceHeld = false;
let spacePressTime = 0;

document.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "Tab") {
    if (!spaceHeld) {
      spaceHeld = true;
      spacePressTime = Date.now();

      if (!gameStarted) {
        gameStarted = true;
        requestAnimationFrame(loop);
        return;
      }

      if (gameOver) {
        resetGame();
        return;
      }

      player.jump(); // ⬆️ 점프 (이단 점프 포함)
    }
  }

  // 🟧 [2] 슬라이드: 오른쪽 방향키 한 번 눌렸을 때
  if (e.code === "ArrowRight") {
    if (!gameStarted) {
      gameStarted = true;
      requestAnimationFrame(loop);
      return;
    }
    if (gameOver) {
      resetGame();
      return;
    }

    player.slide(true, groundY);
    setTimeout(() => player.slide(false, groundY), 500); // 0.5초 후 자동 복귀
  }
});

document.addEventListener("keyup", e => {
  if (e.code === "Space" || e.code === "Tab") {
    const holdTime = Date.now() - spacePressTime;
    spaceHeld = false;
    if (holdTime > 200) player.slide(false, groundY);
  }
});


// 🟩 [3] 모바일 제스처
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();
});

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const holdTime = Date.now() - touchStartTime;

  // 🟢 오른쪽 스와이프 → 슬라이드
  if (Math.abs(dx) > 50 && dx > Math.abs(dy)) {
    if (!gameStarted) {
      gameStarted = true;
      requestAnimationFrame(loop);
      return;
    }
    if (gameOver) {
      resetGame();
      return;
    }

    player.slide(true, groundY);
    setTimeout(() => player.slide(false, groundY), 500);
    return;
  }

  // 🟢 짧게 터치 → 점프
  if (holdTime < 200) {
    if (!gameStarted) {
      gameStarted = true;
      requestAnimationFrame(loop);
      return;
    }
    if (gameOver) {
      resetGame();
      return;
    }

    player.jump();
  }
});

canvas.setAttribute("tabindex", "0");
canvas.focus();
canvas.addEventListener("click", () => canvas.focus());

function loop(timestamp) {
  if (!gameStarted || gameOver) return;

  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  stageManager.update(timestamp, ctx, width, height);

  if (stageManager.isCleared()) {
    gameOver = true;
    drawClearScreen();
    return;
  }

  score += 10 * delta;

  if (spaceHeld && !player.jumping && Date.now() - spacePressTime > 200) {
    player.slide(true, groundY);
  }

  player.update(ctx, groundY);
  drawUI(ctx, width, height, Math.floor(score), hitCount, stageManager.elapsed, safePadding);

  // ⚠️ 장애물 충돌 처리 (공중 포함)
  if (stageManager.elapsed > 1) {
    stageManager.obstacles.forEach(o => {
      if (checkCollision(player, o) && !player.invincible && !o.fadeOut) {
        hitCount++;
        player.hit();

        // 💥 점수 차감
        score = Math.max(0, score - 20);
        floatingTexts.push({
          text: "-20",
          x: player.x + player.w / 2,
          y: player.y - 20,
          alpha: 1,
          dy: -1
        });

        // 💨 공중 장애물은 자연스럽게 사라지기
        if (o.fall) o.fadeOut = true;
      }
    });
  }

  // 🟡 아이템 충돌 처리
  stageManager.items = stageManager.items.filter(item => {
    if (checkCollision(player, item)) {
      score += 50;
      floatingTexts.push({
        text: "+50",
        x: player.x + player.w / 2,
        y: player.y - 20,
        alpha: 1,
        dy: -1
      });
      return false;
    }
    return true;
  });

  // 떠오르는 텍스트
  floatingTexts = floatingTexts.filter(f => {
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

  // 💀 게임 오버 처리
  if (hitCount >= maxHits) {
    gameOver = true;
    drawGameOverScreen(); // 👈 새 함수 호출
    return;
  }

  requestAnimationFrame(loop);
}

function drawGameOverScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = `bold ${Math.floor(height * 0.08)}px Arial`;
  ctx.fillText("💥 GAME OVER 💥", width / 2, height / 2 - 20);

  ctx.font = `${Math.floor(height * 0.04)}px Arial`;
  ctx.fillText(`총 점수: ${Math.floor(score)}`, width / 2, height / 2 + 40);
  ctx.fillText("스페이스를 눌러 다시 시작", width / 2, height / 2 + 100);
}


function checkCollision(player, obj) {
  return (
    player.x < obj.x + obj.w &&
    player.x + player.w > obj.x &&
    player.y < obj.y + obj.h &&
    player.y + player.h > obj.y
  );
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
  ctx.fillText("스페이스를 눌러 다시 시작", width / 2, height / 2 + 100);
}

drawStartScreen();