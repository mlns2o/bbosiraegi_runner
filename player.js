export class Player {
  constructor(width, height) {
    this.x = 80;
    this.h = height * 0.12;
    this.w = width * 0.04;
    this.y = height - 50 - this.h;
    this.vy = 0;
    this.gravity = 0.8;

    this.jumping = false;
    this.jumpCount = 0;
    this.maxJumps = 2;
    this.slideMode = false;

    this.invincible = false;
    this.invincibleTimer = 0;
    this.flash = false;

    this.baseX = 80;
    this.boostSpeed = 4;
    this.maxOffset = 120;
  }

  jump() {
    // 슬라이드 중엔 점프 불가
    if (this.slideMode) return;

    if (this.jumpCount < this.maxJumps) {
      this.vy = -18;
      this.jumping = true;
      this.jumpCount++;
    }
  }

  slide(active, groundY) {
    const onGround = Math.abs(this.y - (groundY - this.h)) < 2;
    if (!onGround) {
      this.slideMode = false;
      return;
    }

    this.slideMode = active;
  }

  hit() {
    this.invincible = true;
    this.invincibleTimer = 60;
  }

  reset(width, height) {
    this.x = 80;
    this.h = height * 0.12;
    this.w = width * 0.04;
    this.y = height - 50 - this.h;
    this.vy = 0;
    this.jumping = false;
    this.jumpCount = 0;
    this.slideMode = false;
    this.invincible = false;
  }

  update(ctx, groundY) {
    // 중력
    this.vy += this.gravity;
    this.y += this.vy;

    if (this.y >= groundY - this.h) {
      this.y = groundY - this.h;
      this.vy = 0;
      this.jumping = false;
      this.jumpCount = 0;
    }

    // 슬라이드/가속 중
    if (this.slideMode) {
      this.h = 40;
      this.y = groundY - 40;
      if (this.x < this.baseX + this.maxOffset) this.x += this.boostSpeed;
    } else {
      this.h = 80;
      if (this.x > this.baseX) this.x -= 2;
    }

    // 무적 깜빡임
    if (this.invincible) {
      this.invincibleTimer--;
      this.flash = this.invincibleTimer % 10 < 5;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    ctx.save();
    ctx.globalAlpha = this.invincible && this.flash ? 0.4 : 1;
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.restore();
  }
}
