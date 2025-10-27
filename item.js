export class Item {
  constructor(width, height, groundY) {
    this.w = 40;
    this.h = 40;
    this.x = width;
    this.speed = 5;
    this.alpha = 1;

    // 플레이어 이중 점프 최고 높이 (예: groundY - 200 정도)
    const jumpRange = 200; // 점프 최대 높이 범위 (필요하면 조절 가능)

    // ✅ groundY 기준으로 랜덤 높이 설정
    const minY = groundY - this.h - 10;          // 바닥 근처
    const maxY = groundY - jumpRange - this.h;   // 점프 가능한 최대 높이
    this.y = Math.random() * (minY - maxY) + maxY; // 랜덤 Y

    this.image = null;
    this.imageLoaded = false;

    // 기본 아이템 이미지
    this.loadImage("assets/img/item.png");
  }

  // ✅ 이미지 로드
  loadImage(src) {
    if (!src || typeof src !== "string") {
      console.warn("⚠️ 아이템 이미지 경로 없음:", src);
      this.image = null;
      return;
    }

    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.onerror = (e) => {
      console.warn("⚠️ 아이템 이미지 로드 실패:", src, e);
      this.image = null;
    };
    this.image.src = src;
  }

  // ✅ 매 프레임 업데이트
  update(ctx) {
    this.x -= this.speed;

    if (this.image && this.image.complete && this.image.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  // ✅ 화면 밖으로 나가면 제거
  isOffscreen() {
    return this.x + this.w < 0;
  }
}
