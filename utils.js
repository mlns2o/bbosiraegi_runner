// utils.js

// 반응형 + 노치 대응 캔버스 리사이즈 함수
export function resizeCanvas(canvas, ctx) {
  const ratio = window.devicePixelRatio || 1;

  // 모바일 브라우저 실제 표시 영역
  const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  // CSS 크기 (화면 꽉 채우기)
  canvas.style.width = viewportWidth + "px";
  canvas.style.height = viewportHeight + "px";

  // 내부 해상도 (고해상도 대응)
  canvas.width = viewportWidth * ratio;
  canvas.height = viewportHeight * ratio;

  // 스케일 초기화 후 재적용 (iOS 중첩 방지)
  ctx.resetTransform?.();
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = false;

  // 최신 뷰포트 크기 및 안전 패딩 반환
  return {
    width: viewportWidth,
    height: viewportHeight,
    safePadding: Math.max(window.visualViewport?.offsetTop || 0, 20)
  };
}

// 충돌 감지 (AABB 방식)
export function checkCollision(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}
