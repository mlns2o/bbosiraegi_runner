// 🩷 하트 이미지 로드
const heartFull = new Image();
heartFull.src = "assets/img/heart.png";
const heartHalf = new Image();
heartHalf.src = "assets/img/heart_half.png";

// 🟦 진행 바 이미지 로드
const progressBarBg = new Image();
progressBarBg.src = "assets/img/bar.png";   // 전체 바
const progressMarker = new Image();
progressMarker.src = "assets/img/bbosiraegi.png";  // 현재 위치 마커

export function drawUI(ctx, width, height, score, hitCount, elapsed, safePadding = 0) {
  const fontSize = Math.floor(width * 0.04);
  const topOffset = safePadding + height * 0.02;

  // 🎯 점수 표시
  ctx.fillStyle = "black";
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "left";
  ctx.fillText(`점수: ${Math.floor(score)}`, width * 0.03, topOffset + fontSize);

  // ❤️ 목숨 표시
  const totalHearts = 3;
  const heartSize = Math.max(width, height) * 0.05;
  const spacing = heartSize * 0.3;

  for (let i = 0; i < totalHearts; i++) {
    const heartIndex = totalHearts - 1 - i;
    const damage = hitCount - heartIndex * 2;

    const x = width - (heartSize + spacing) * (i + 1);
    const y = topOffset + fontSize / 2;

    if (damage <= 0) {
      ctx.drawImage(heartFull, x, y, heartSize, heartSize);
    } else if (damage === 1) {
      ctx.drawImage(heartHalf, x, y, heartSize, heartSize);
    }
  }

  // 🕒 진행 바 이미지 표시
  const total = 60; // 총 시간 기준
  const ratio = Math.min(elapsed / total, 1);

  const barWidth = width * 0.4;
  const barHeight = height * 0.05;
  const barX = (width - barWidth) / 2;
  const barY = topOffset + fontSize * 2;

  // 🔹 1️⃣ 전체 길이 바 (배경)
  ctx.drawImage(progressBarBg, barX, barY, barWidth, barHeight);

  // 🔹 2️⃣ 현재 위치 마커
  const markerWidth = barWidth * 0.2; 
  const markerHeight = barHeight * 1.1;
  const markerX = barX + ratio * (barWidth - markerWidth);
  const markerY = barY - (markerHeight - barHeight) / 2;

  ctx.drawImage(progressMarker, markerX, markerY, markerWidth, markerHeight);
}
