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
  }

  update(timestamp, ctx, width, height) {
    if (!this.startTime) this.startTime = timestamp;
    this.elapsed = (timestamp - this.startTime) / 1000;

    // 15초마다 스테이지 전환
    if (this.elapsed >= 15 * (this.currentStage + 1) && this.currentStage < 3) {
      this.currentStage++;
    }

    // ✅ 배경 이미지 표시
    const bg = this.bgImages[this.currentStage];
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, width, height);
    } else {
      // 이미지 로드 전 임시 배경
      ctx.fillStyle = "#87cefa";
      ctx.fillRect(0, 0, width, height);
    }

    // 난이도 계산
    const difficulty = this.getDifficulty(this.currentStage);

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

    // 업데이트
    this.obstacles.forEach(o => o.update(ctx));
    this.items.forEach(i => i.update(ctx));

    // 화면 밖 제거
    this.obstacles = this.obstacles.filter(o => !o.isOffscreen(this.height));
    this.items = this.items.filter(i => !i.isOffscreen());
  }

  spawnObstacle(difficulty) {
  // 스테이지별 이미지 세트
  const imageSets = [
    // 🌨️ Stage 1 (눈 내리는 밭)
    {
      ground: "assets/img/stage1_groundsnow.png",
      sky: "assets/img/stage1_skysnow.png"
    },
    // 🚃 Stage 2 (기차 내부)
    {
      ground: null, // 없음
      sky: "assets/img/stage1_skysnow.png"
    },
    // 🌇 Stage 3 (서울 외곽)
    {
      ground: "assets/img/stage1_groundsnow.png",
      sky: null // 없음
    },
    // 🏙️ Stage 4 (서울 중심)
    {
      ground1: "assets/img/stage1_skysnow.png",
      ground2: "assets/img/stage1_groundsnow.png", // 서로 다른 이미지
      sky: null
    }
  ];

  const set = imageSets[this.currentStage];

  switch (this.currentStage) {
    // ✅ Stage 1: 위 1개 + 아래 1개
    case 0: {
      const groundW = 60, groundH = 60;
      const ground = new Obstacle(
        this.width,
        this.height - groundH - 50, // 화면 아래에서 약간 띄움
        groundW, groundH,
        difficulty.speed
      );
      ground.loadImage(set.ground);

      const skyW = 45, skyH = 45;
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

    // ✅ Stage 2: 공중 방해물만
    case 1: {
      const airW = 50, airH = 50;
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

    // ✅ Stage 3: 지상 방해물 1개만
    case 2: {
      const groundW = 70, groundH = 70;
      const ground = new Obstacle(
        this.width,
        this.height - groundH - 50,
        groundW, groundH,
        difficulty.speed
      );
      ground.loadImage(set.ground);
      this.obstacles.push(ground);
      break;
    }

    // ✅ Stage 4: 지상 방해물 2개 (서로 다른 이미지)
    case 3: {
      const offset = 120 + Math.random() * 60;
      const groundW = 60, groundH = 60;

      const ground1 = new Obstacle(
        this.width,
        this.height - groundH - 50,
        groundW, groundH,
        difficulty.speed
      );
      ground1.loadImage(set.ground1);

      const ground2 = new Obstacle(
        this.width + offset,
        this.height - groundH - 50,
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
        return { speed: 6, obstacleChance: 0.02, minSpawnGap: 1200, itemChance: 0.01, doubleChance: 0.0 };
      case 1:
        return { speed: 7, obstacleChance: 0.03, minSpawnGap: 1000, itemChance: 0.008, doubleChance: 0.1 };
      case 2:
        return { speed: 8, obstacleChance: 0.035, minSpawnGap: 900, itemChance: 0.006, doubleChance: 0.2 };
      case 3:
        return { speed: 9, obstacleChance: 0.04, minSpawnGap: 800, itemChance: 0.004, doubleChance: 0.35 };
      default:
        return { speed: 10, obstacleChance: 0.05, minSpawnGap: 700, itemChance: 0.003, doubleChance: 0.4 };
    }
  }

  // ✅ 60초 후 클리어
  isCleared() {
    return this.elapsed >= 60;
  }
}