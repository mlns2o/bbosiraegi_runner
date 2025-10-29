import { Obstacle } from "./obstacle.js";
import { Item } from "./item.js";

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

    // 🎞️ 페이드 전환 관리
    this.isTransitioning = false;
    this.stageSwitched = false;
    this.fadeOpacity = 0;

    // 🏞️ 스테이지별 배경 이미지
    this.bgImages = [
      this.loadImage("assets/img/stage1_background.png"),
      this.loadImage("assets/img/stage2_background.png"),
      this.loadImage("assets/img/stage3_background.png"),
      this.loadImage("assets/img/stage4_background.png"),
    ];

    // 🧍‍♂️ 플레이어 스프라이트
    this.playerSprites = [
      "assets/img/stage1_siraegi.png",
      "assets/img/player_bbosiraegi.png",
      "assets/img/player_bbosiraegi.png",
      "assets/img/player_bbosiraegi.png",
    ];

    // 🚧 장애물 세트
    this.obstacleSets = [
      { ground: "assets/img/stage1_skysnow.png" },
      { sky: "assets/img/stage2_obstacle.png" },
      { ground: "assets/img/stage3_obstacle.png" },
      {
        ground1: "assets/img/stage3_obstacle.png",
        ground2: "assets/img/stage4_obstacle.png",
      },
    ];

    // 현재 적용 중인 세트
    this.currentBg = this.bgImages[0];
    this.currentObstacleSet = this.obstacleSets[0];
  }

  // 이미지 로더
  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  // 게임 리셋
  reset(player) {
    this.elapsed = 0;
    this.currentStage = 0;
    this.obstacles = [];
    this.items = [];
    this.startTime = null;
    this.lastSpawn = 0;
    this.isTransitioning = false;
    this.stageSwitched = false;
    this.fadeOpacity = 0;

    // ✅ 플레이어 스프라이트를 stage1 기준으로 복원
    if (player) {
      player.setSprite(this.playerSprites[0]);  // stage1 캐릭터 이미지
      player.w = this.width * 0.15;
      player.h = this.height * 0.36;
      player.y = this.height - 50 - player.h;
    }

    // ✅ 배경 및 장애물 세트만 초기화
    this.currentBg = this.bgImages[0];
    this.currentObstacleSet = this.obstacleSets[0];
    }

  // 🎨 스테이지별 리소스(배경, 장애물, 플레이어) 통합 관리 + 해상도 보정
  updateStageAssets(stage, player) {
    this.currentBg = this.bgImages[stage];
    this.currentObstacleSet = this.obstacleSets[stage];

    if (player) {
      const sprite = this.playerSprites[stage] || this.playerSprites[0];
      player.setSprite(sprite);

      // 🧮 화면 해상도 보정 (devicePixelRatio)
      const ratio = window.devicePixelRatio || 1;
      const baseW = (this.width / ratio);
      const baseH = (this.height / ratio);

      // ✅ 스테이지별 캐릭터 비율 설정
      switch (stage) {
        case 0:
        case 1:
          player.w = baseW * 0.25;  // 약간 키움 (기존 0.15 → 0.18)
          player.h = baseH * 0.40;
        case 2:
          player.w = baseW * 0.25;  // 약간 키움 (기존 0.15 → 0.18)
          player.h = baseH * 0.40;
        case 3:
          player.w = baseW * 0.25;  // 약간 키움 (기존 0.15 → 0.18)
          player.h = baseH * 0.40;
          break;
      }

      // 바닥 위치 정렬
      player.y = this.height - 50 - player.h;
    }
  }

  // 🎬 스테이지 전환 (페이드 완료 시 호출)
  nextStage(player) {
    this.currentStage++;
    this.updateStageAssets(this.currentStage, player);
  }

  // 🕹️ 매 프레임 업데이트
  update(timestamp, ctx, width, height, player) {
    if (!this.startTime) this.startTime = timestamp;
    this.elapsed = (timestamp - this.startTime) / 1000;

    // 🏞️ 현재 배경 렌더링
    if (this.currentBg && this.currentBg.complete) {
      ctx.drawImage(this.currentBg, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#87cefa";
      ctx.fillRect(0, 0, width, height);
    }

    // 🌠 스테이지 전환 (15초마다)
    if (this.elapsed >= 15 * (this.currentStage + 1) && this.currentStage < 3) {
      if (!this.isTransitioning) {
        this.isTransitioning = true;
        this.fadeOpacity = 0;
        this.transitionStart = timestamp;
      }

      const fadeDuration = 1000; // 1초 페이드
      const progress = (timestamp - this.transitionStart) / fadeDuration;

      if (progress < 0.5) {
        this.fadeOpacity = progress * 2; // 어두워짐
      } else if (progress < 1) {
        if (!this.stageSwitched) {
          this.nextStage(player); // 스테이지 전환 호출
          this.stageSwitched = true;
        }
        this.fadeOpacity = 2 - progress * 2; // 밝아짐
      } else {
        this.isTransitioning = false;
        this.stageSwitched = false;
        this.fadeOpacity = 0;
      }

      // 어두운 페이드 레이어
      if (this.fadeOpacity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeOpacity})`;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // 🎚️ 난이도 조절
    const difficulty = this.getDifficulty(this.currentStage);

    // 🚧 장애물 스폰
    const timeSinceLast = timestamp - this.lastSpawn;
    if (this.elapsed > 1 && timeSinceLast > difficulty.minSpawnGap) {
      if (Math.random() < difficulty.obstacleChance) {
        this.spawnObstacle(difficulty);
        this.lastSpawn = timestamp;
      }
    }

    // 💎 아이템 스폰
    if (Math.random() < difficulty.itemChance) {
      this.items.push(new Item(width, height, this.groundY));
    }

    // 🌀 객체 업데이트
    this.obstacles.forEach((o) => o.update(ctx));
    this.items.forEach((i) => i.update(ctx));

    // 🧹 화면 밖 제거
    this.obstacles = this.obstacles.filter((o) => !o.isOffscreen(this.height));
    this.items = this.items.filter((i) => !i.isOffscreen());
  }

  // 🚧 장애물 생성
  spawnObstacle(difficulty) {
    const set = this.currentObstacleSet;
    switch (this.currentStage) {
      case 0: {
        const ground = new Obstacle(
          this.width,
          this.height - 80 - 50,
          80,
          80,
          difficulty.speed
        );
        ground.loadImage(set.ground);
        this.obstacles.push(ground);
        break;
      }

      case 1: {
        const air = new Obstacle(
          Math.random() * this.width,
          -100,
          100,
          100,
          difficulty.speed,
          true
        );
        air.loadImage(set.sky);
        this.obstacles.push(air);
        break;
      }

      case 2: {
        const ground = new Obstacle(
          this.width,
          this.groundY - 100,
          150,
          120,
          difficulty.speed
        );
        ground.loadImage(set.ground);
        this.obstacles.push(ground);
        break;
      }

      case 3: {
        const set = this.currentObstacleSet;

        const ground1H = 120; // 자동차 높이
        const ground2H = 150; // 사람 높이

        // 🚗 자동차 (약 70% 확률로 등장)
        if (Math.random() < 0.5) {
          const car = new Obstacle(
            this.width,
            this.groundY - ground1H,
            150,
            ground1H,
            difficulty.speed
          );
          car.loadImage(set.ground1);
          this.obstacles.push(car);
        }

        // 🧍 사람 (약 50% 확률로 등장)
        if (Math.random() < 0.7) {
          const offset = 100 + Math.random() * 200; // 랜덤 간격
          const person = new Obstacle(
            this.width + offset,
            this.groundY - 120,
            120,
            120,
            difficulty.speed
          );
          person.loadImage(set.ground2);
          this.obstacles.push(person);
        }

        break;
      }
    }
  }

  // 📈 스테이지별 난이도 세팅
  getDifficulty(stage) {
    switch (stage) {
      case 0:
        return { speed: 6, obstacleChance: 0.02, minSpawnGap: 1200, itemChance: 0.01 };
      case 1:
        return { speed: 7, obstacleChance: 0.03, minSpawnGap: 1000, itemChance: 0.009 };
      case 2:
        return { speed: 7.6, obstacleChance: 0.035, minSpawnGap: 1000, itemChance: 0.008 };
      case 3:
        return {
            speed: 8,           // 🔹 기존 9 → 조금 느리게
            obstacleChance: 0.02, // 🔹 장애물 등장 확률 낮춤 (기존 0.04 → 0.02)
            minSpawnGap: 1000,    // 🔹 스폰 간격 늘림
            itemChance: 0.009,    // 🔹 아이템 등장률 살짝 ↑
        };
      default:
        return { speed: 10, obstacleChance: 0.05, minSpawnGap: 700, itemChance: 0.003 };
    }
  }

  // 🎉 클리어 조건
  isCleared() {
    return this.elapsed >= 60;
  }
}
