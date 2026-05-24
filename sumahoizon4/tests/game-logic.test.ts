import { describe, it, expect } from 'vitest';
import {
  BUILDING_DEFS,
  INITIAL_RESOURCES,
  OFFLINE_REWARD_RATE,
  FOCUS_REWARD_RATE,
  GRID_ROWS,
  GRID_COLS,
  Resources,
  ResourceType,
} from '../lib/game-types';

// ============================================================
// 資源計算ロジックのテスト
// ============================================================

function calculateOfflineReward(minutes: number): Partial<Resources> {
  const hours = minutes / 60;
  const reward: Partial<Resources> = {};
  for (const [key, rate] of Object.entries(OFFLINE_REWARD_RATE)) {
    reward[key as ResourceType] = Math.floor((rate ?? 0) * hours);
  }
  return reward;
}

function calculateFocusReward(minutes: number): Partial<Resources> {
  const reward: Partial<Resources> = {};
  for (const [key, rate] of Object.entries(FOCUS_REWARD_RATE)) {
    reward[key as ResourceType] = Math.floor((rate ?? 0) * minutes);
  }
  return reward;
}

describe('オフライン報酬計算', () => {
  it('60分オフラインで正しい報酬を計算する', () => {
    const reward = calculateOfflineReward(60);
    expect(reward.wood).toBe(8);   // 8/時間
    expect(reward.iron).toBe(4);   // 4/時間
    expect(reward.seeds).toBe(2);  // 2/時間
    expect(reward.coins).toBe(10); // 10/時間
  });

  it('30分オフラインで半分の報酬を計算する', () => {
    const reward = calculateOfflineReward(30);
    expect(reward.wood).toBe(4);
    expect(reward.iron).toBe(2);
  });

  it('5分未満では報酬が0になる', () => {
    const reward = calculateOfflineReward(4);
    expect(reward.wood).toBe(0);
    expect(reward.coins).toBe(0);
  });
});

describe('フォーカス報酬計算', () => {
  it('25分集中で正しい報酬を計算する', () => {
    const reward = calculateFocusReward(25);
    expect(reward.wood).toBe(50);   // 2/分 × 25
    expect(reward.iron).toBe(25);   // 1/分 × 25
    expect(reward.coins).toBe(75);  // 3/分 × 25
  });

  it('10分集中で正しい報酬を計算する', () => {
    const reward = calculateFocusReward(10);
    expect(reward.wood).toBe(20);
    expect(reward.coins).toBe(30);
  });
});

describe('建物定義データ', () => {
  it('全建物にIDと名前とカテゴリがある', () => {
    for (const def of BUILDING_DEFS) {
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.emoji).toBeTruthy();
    }
  });

  it('生産建物には produces フィールドがある', () => {
    const producers = BUILDING_DEFS.filter((b) => b.category === 'factory' || b.category === 'farm');
    for (const def of producers) {
      expect(def.produces).toBeDefined();
      expect(def.produces!.amount).toBeGreaterThan(0);
      expect(def.produces!.intervalMinutes).toBeGreaterThan(0);
    }
  });

  it('住宅・商業建物には coinPerHour がある', () => {
    const earners = BUILDING_DEFS.filter((b) => b.category === 'housing' || b.category === 'commerce');
    for (const def of earners) {
      expect(def.coinPerHour).toBeGreaterThan(0);
    }
  });

  it('全建物のコストが正の値', () => {
    for (const def of BUILDING_DEFS) {
      for (const val of Object.values(def.cost)) {
        expect(val).toBeGreaterThan(0);
      }
    }
  });
});

describe('グリッド定数', () => {
  it('グリッドサイズが正しい', () => {
    expect(GRID_ROWS).toBe(12);
    expect(GRID_COLS).toBe(8);
  });
});

describe('初期資源', () => {
  it('初期資源が正の値', () => {
    expect(INITIAL_RESOURCES.wood).toBeGreaterThan(0);
    expect(INITIAL_RESOURCES.coins).toBeGreaterThan(0);
  });

  it('初期資源に全種類が含まれる', () => {
    const keys: ResourceType[] = ['wood', 'iron', 'seeds', 'roadMat', 'coins', 'parts', 'crops'];
    for (const key of keys) {
      expect(INITIAL_RESOURCES[key]).toBeDefined();
    }
  });
});
