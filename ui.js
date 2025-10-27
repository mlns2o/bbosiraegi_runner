export function drawUI(ctx, width, height, score, hitCount, elapsed, safePadding = 0) {
  const fontSize = Math.floor(width * 0.04); // 👈 width 기준으로 조금 더 안정적
  const topOffset = safePadding + height * 0.02;

  // 🎯 점수 (왼쪽 상단)
  ctx.fillStyle = "black";
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "left"; // 👈 명시적으로 왼쪽 정렬
  ctx.fillText(`점수: ${Math.floor(score)}`, width * 0.03, topOffset + fontSize);

  // ❤️ 목숨 (오른쪽 상단)
  const radius = Math.max(width, height) * 0.015;
  const totalHearts = 3;

  for (let i = 0; i < totalHearts; i++) {
    const heartIndex = totalHearts - 1 - i;
    const damage = hitCount - heartIndex * 2;

    const x = width - (radius * 2.2) * (i + 1);
    const y = topOffset + fontSize / 2 + radius;

    // 회색 배경 원
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ccc";
    ctx.fill();

    // 체력 상태 덮어 그리기
    if (damage <= 0) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ff4444";
      ctx.fill();
    } else if (damage === 1) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, radius, Math.PI / 2, -Math.PI / 2, true);
      ctx.closePath();
      ctx.fillStyle = "#ff4444";
      ctx.fill();
    }
  }

  // 📊 진행 바 (현재 위치 마커)
  const total = 60;
  const ratio = Math.min(elapsed / total, 1);
  const barWidth = width * 0.4;
  const barHeight = height * 0.015;
  const barX = (width - barWidth) / 2;
  const barY = topOffset + fontSize * 2;

  // 회색 배경 바
  ctx.fillStyle = "#ddd";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // 초록색 마커
  const markerX = barX + ratio * barWidth;
  const markerWidth = barWidth * 0.02;
  ctx.fillStyle = "#00b050";
  ctx.fillRect(markerX - markerWidth / 2, barY - 2, markerWidth, barHeight + 4);
}
