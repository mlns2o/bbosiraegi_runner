export class Obstacle {
  constructor(x, y, w, h, color, shape, speed, fall = false) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
    this.shape = shape;
    this.speed = speed;
    this.fall = fall;
    this.vy = fall ? 3 : 0;

    this.fadeOut = false; // 👈 충돌 후 서서히 사라질 상태
    this.alpha = 1;       // 👈 투명도 (1 = 불투명)
  }

  update(ctx) {
    // 움직임 처리
    if (this.fall) {
      this.y += this.vy;
      this.vy += 0.15; // 중력 가속
    } else {
      this.x -= this.speed;
    }

    // fadeOut 중이면 점점 투명해지기
    if (this.fadeOut) {
      this.alpha -= 0.05;
      if (this.alpha < 0) this.alpha = 0;
    }

    // 그리기
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    if (this.shape === "circle") {
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }

    ctx.restore();
  }

  isOffscreen(height) {
    // 화면 아래로 떨어지거나 완전히 사라졌을 때 제거
    return this.alpha <= 0 || this.x + this.w < 0 || this.y - this.h > height;
  }
}
