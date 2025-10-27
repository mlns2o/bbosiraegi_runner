export class Obstacle {
  constructor(x, y, w, h, speed, fall = false) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.speed = speed;
    this.fall = fall;
    this.vy = fall ? 3 : 0;

    this.fadeOut = false;
    this.alpha = 1;

    this.image = null;
    this.imageLoaded = false;
  }

  loadImage(src) {
  if (!src || typeof src !== "string") {
    console.warn("⚠️ 이미지 경로 없음:", src);
    this.image = null;
    return;
  }

  this.image = new Image();
  this.image.onload = () => {
    this.imageLoaded = true;
  };
  this.image.onerror = (e) => {
    console.warn("⚠️ 장애물 이미지 로드 실패:", src, e);
    this.image = null; // 로드 실패 시 그리기 시도 방지
  };
  this.image.src = src;
}


  update(ctx) {
  try {
    // 이동
    if (this.fall) {
      this.y += this.vy;
      this.vy += 0.15;
    } else {
      this.x -= this.speed;
    }

    // 페이드 아웃
    if (this.fadeOut) {
      this.alpha -= 0.05;
      if (this.alpha < 0) this.alpha = 0;
    }

    // ✅ 안전하게 예외 방지
    if (!this.image) {
      // 이미지가 없는 오브젝트는 그냥 스킵 (Stage 2 ground 등)
      return;
    }

    if (this.image.complete && this.image.naturalWidth > 0) {
      // 이미지가 로드 완료된 경우
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
      ctx.restore();
    } else {
      // 아직 로드 중이거나 실패한 경우 — 디버깅용 표시
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  } catch (err) {
    console.error("🚨 Obstacle update 중 오류 발생:", err);
  }
}

  // ✅ 화면 밖으로 나갔는지 체크 (필터용)
  isOffscreen(canvasHeight) {
    return this.x + this.w < 0 || this.y > canvasHeight;
  }
}
