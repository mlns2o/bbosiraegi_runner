export class Item {
  constructor(width, height, groundY) {
    this.r = width * 0.02;
    this.w = this.r * 2;   // ✅ 이미지/충돌용 폭
    this.h = this.r * 2;   // ✅ 이미지/충돌용 높이
    this.x = width + Math.random() * width;
    this.speed = 6;

    const singleJump = 200;
    const doubleJump = singleJump * 2;
    const maxY = groundY - doubleJump;
    const minY = groundY - this.r - 60;
    this.y = Math.random() * (minY - maxY) + maxY;

    // 추후 이미지용
    this.image = null;
  }

  loadImage(src) {
    this.image = new Image();
    this.image.src = src;
  }

  update(ctx) {
    this.x -= this.speed;

    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    } else {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  isOffscreen() {
    return this.x + this.w < 0;
  }
}
