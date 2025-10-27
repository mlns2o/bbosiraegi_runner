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

    // 배경 색상
    const bgColors = ["#87cefa", "#ffd700", "#90ee90", "#ffa07a"];
    ctx.fillStyle = bgColors[this.currentStage];
    ctx.fillRect(0, 0, width, height);

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
    const colorSets = [
      { sky: "red", ground: "yellow" },
      { sky: "orange", ground: "green" },
      { sky: "lightblue", ground: "blue" },
      { sky: "gray", ground: "purple" }
    ];
    const c = colorSets[this.currentStage];

    // 👇 스테이지별 조건 분기
    switch (this.currentStage) {
      // ✅ Stage 1: 위 + 아래
      case 0:
        this.obstacles.push(
          new Obstacle(
            this.width,
            this.height - 90,
            30, 40,
            c.ground,
            "rect",
            difficulty.speed
          ),
          new Obstacle(
            Math.random() * this.width,
            -50,
            30, 30,
            c.sky,
            "circle",
            difficulty.speed,
            true
          )
        );
        break;

      // ✅ Stage 2: 위 방해물만
      case 1:
        this.obstacles.push(
          new Obstacle(
            Math.random() * this.width,
            -50,
            30, 30,
            c.sky,
            "circle",
            difficulty.speed,
            true
          )
        );
        break;

      // ✅ Stage 3: 아래 방해물 1개
      case 2:
        this.obstacles.push(
          new Obstacle(
            this.width,
            this.height - 90,
            30, 40,
            c.ground,
            "rect",
            difficulty.speed
          )
        );
        break;

      // ✅ Stage 4: 아래 방해물 2개
      case 3:
        const offset = 120 + Math.random() * 60;
        this.obstacles.push(
          new Obstacle(
            this.width,
            this.height - 90,
            30, 40,
            c.ground,
            "rect",
            difficulty.speed
          ),
          new Obstacle(
            this.width + offset,
            this.height - 90,
            30, 40,
            c.ground,
            "rect",
            difficulty.speed
          )
        );
        break;
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
