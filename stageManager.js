import { Obstacle } from './obstacle.js';
import { Item } from './item.js';

export class StageManager {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.elapsed = 0;
    this.currentStage = 0;
    this.obstacles = [];
    this.items = [];
    this.groundY = height - 50;
    this.startTime = null;
    this.lastSpawn = 0;

    // 페이드 전환 관련
    this.isTransitioning = false;
    this.stageSwitched = false;
    this.fadeOpacity = 0;

    this.bgImages = [
      this.loadImage("assets/img/stage1_background.png"),
      this.loadImage("assets/img/stage2_background.png"),
      this.loadImage("assets/img/stage3_background.png"),
      this.loadImage("assets/img/stage4_background.png")
    ];
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  reset() {
    this.elapsed = 0;
    this.currentStage = 0;
    this.obstacles = [];
    this.items = [];
    this.startTime = null;
    this.lastSpawn = 0;

    // 페이드 변수 초기화
    this.isTransitioning = false;
    this.stageSwitched = false;
    this.fadeOpacity = 0;
  }

  update(timestamp, ctx, width, height, player) {
    if (!this.startTime) this.startTime = timestamp;
    this.elapsed = (timestamp - this.startTime) / 1000;

    // ✅ 배경 이미지 표시
    const bg = this.bgImages[this.currentStage];
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#87cefa";
      ctx.fillRect(0, 0, width, height);
    }

    // ✅ 페이드 전환 (자연스러운 Stage 변경)
    if (this.elapsed >= 15 * (this.currentStage + 1) && this.currentStage < 3) {
      if (!this.isTransitioning) {
        this.isTransitioning = true;
        this.fadeOpacity = 0;
        this.transitionStart = timestamp;
      }

      const fadeDuration = 1000; // 1초 전환
      const progress = (timestamp - this.transitionStart) / fadeDuration;

      if (progress < 0.5) {
        // 0~0.5초: 어두워짐
        this.fadeOpacity = progress * 2;
      } else if (progress < 1) {
        // 0.5~1초: 밝아짐 + Stage 교체
        if (!this.stageSwitched) {
          this.currentStage++;

          // Stage 2 진입 시 플레이어 이미지 변경
          if (this.currentStage === 1 && player) {
            player.setSprite("assets/img/player_bbosiraegi.png");

            // ✅ Stage2에서 캐릭터 비율 키우기
            player.h = player.h * 1.4;  // 세로 1.4배
            player.w = player.w * 1.4;  // 가로 1.4배
            player.y = this.height - 50 - player.h;  // 바닥 맞춰주기
          }

          this.stageSwitched = true;
        }

        this.fadeOpacity = 2 - progress * 2;
      } else {
        // 전환 완료 후에도 이미지 확실히 유지
        if (this.currentStage >= 1 && player) {
          player.image.src = "assets/img/player_bbosiraegi.png";
          player.imageSlide.src = "assets/img/player_bbosiraegi.png";
        }

        this.fadeOpacity = 0;
        this.isTransitioning = false;
        this.stageSwitched = false;
      }

      // 어둡게 덮기 (페이드 효과)
      if (this.fadeOpacity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeOpacity})`;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // ✅ 스테이지별 난이도 계산
    const difficulty = this.getDifficulty(this.currentStage);

    // ✅ 장애물 & 아이템 스폰
    const timeSinceLast = timestamp - this.lastSpawn;
    if (this.elapsed > 1 && timeSinceLast > difficulty.minSpawnGap) {
      if (Math.random() < difficulty.obstacleChance) {
        this.spawnObstacle(difficulty);
        this.lastSpawn = timestamp;
      }
    }

    if (Math.random() < difficulty.itemChance) {
      this.items.push(new Item(width, height, this.groundY));
    }

    // ✅ 객체 업데이트
    this.obstacles.forEach(o => o.update(ctx));
    this.items.forEach(i => i.update(ctx));

    // ✅ 화면 밖 제거
    this.obstacles = this.obstacles.filter(o => !o.isOffscreen(this.height));
    this.items = this.items.filter(i => !i.isOffscreen());
  }

  spawnObstacle(difficulty) {
    // 스테이지별 이미지 세트
    const imageSets = [
      {
        ground: "assets/img/stage1_groundsnow.png",
        sky: "assets/img/stage1_skysnow.png"
      },
      {
        ground: null,
        sky: "assets/img/stage2_obstacle.png"
      },
      {
        ground: "assets/img/stage3_obstacle.png",
        sky: null
      },
      {
        ground1: "assets/img/stage3_obstacle.png",
        ground2: "assets/img/stage4_obstacle.png",
        sky: null
      }
    ];

    const set = imageSets[this.currentStage];

    switch (this.currentStage) {
      // ✅ Stage 1: 위 + 아래 동시 생성
      case 0: {
        const groundW = 80, groundH = 80;
        const ground = new Obstacle(
          this.width,
          this.height - groundH - 50,
          groundW, groundH,
          difficulty.speed
        );
        ground.loadImage(set.ground);

        const skyW = 70, skyH = 70;
        const sky = new Obstacle(
          Math.random() * this.width,
          -skyH,
          skyW, skyH,
          difficulty.speed,
          true
        );
        sky.loadImage(set.sky);

        this.obstacles.push(ground, sky);
        break;
      }

      // ✅ Stage 2: 공중 장애물
      case 1: {
        const airW = 100, airH = 100;
        const air = new Obstacle(
          Math.random() * this.width,
          -airH,
          airW, airH,
          difficulty.speed,
          true
        );
        air.loadImage(set.sky);
        this.obstacles.push(air);
        break;
      }

      // ✅ Stage 3: 지상 장애물
      case 2: {
        const groundW = 150, groundH = 120;
        const ground = new Obstacle(
          this.width,
          this.groundY - groundH,
          groundW, groundH,
          difficulty.speed
        );
        ground.loadImage(set.ground);
        this.obstacles.push(ground);
        break;
      }

      // ✅ Stage 4: 지상 장애물 2개
      case 3: {
        const offset = 120 + Math.random() * 60;
        const groundW = 100, groundH = 100;

        const ground1 = new Obstacle(
          this.width,
          this.height - groundH - 50,
          groundW, groundH,
          difficulty.speed
        );
        ground1.loadImage(set.ground1);

        const ground2 = new Obstacle(
          this.width + offset,
          this.groundY - groundH,
          groundW, groundH,
          difficulty.speed
        );
        ground2.loadImage(set.ground2);

        this.obstacles.push(ground1, ground2);
        break;
      }
    }
  }

  getDifficulty(stage) {
    switch (stage) {
      case 0:
        return { speed: 6, obstacleChance: 0.02, minSpawnGap: 1200, itemChance: 0.01 };
      case 1:
        return { speed: 7, obstacleChance: 0.03, minSpawnGap: 1000, itemChance: 0.008 };
      case 2:
        return { speed: 8, obstacleChance: 0.035, minSpawnGap: 900, itemChance: 0.006 };
      case 3:
        return { speed: 9, obstacleChance: 0.04, minSpawnGap: 800, itemChance: 0.004 };
      default:
        return { speed: 10, obstacleChance: 0.05, minSpawnGap: 700, itemChance: 0.003 };
    }
  }

  isCleared() {
    return this.elapsed >= 60;
  }
}
