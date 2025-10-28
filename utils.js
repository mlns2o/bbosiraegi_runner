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
  const shrinkA = 0.8; // 캐릭터 판정 80%로 축소
  const shrinkB = 0.7; // 장애물 판정 70%로 축소

  const ax = a.x + (a.w * (1 - shrinkA)) / 2;
  const ay = a.y + (a.h * (1 - shrinkA)) / 2;
  const aw = a.w * shrinkA;
  const ah = a.h * shrinkA;

  const bx = b.x + (b.w * (1 - shrinkB)) / 2;
  const by = b.y + (b.h * (1 - shrinkB)) / 2;
  const bw = b.w * shrinkB;
  const bh = b.h * shrinkB;

  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
}

