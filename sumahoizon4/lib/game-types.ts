// ============================================================
// FocusCity - ゲーム型定義
// ============================================================

/** 資源の種類 */
export type ResourceType =
  | 'wood'       // 木材
  | 'iron'       // 鉄
  | 'seeds'      // 農作物の種
  | 'roadMat'    // 道路材料
  | 'coins'      // コイン
  | 'parts'      // 部品（工場生産）
  | 'crops';     // 農作物（畑生産）

/** 資源の保有量マップ */
export type Resources = Record<ResourceType, number>;

/** 建物カテゴリ */
export type BuildingCategory = 'housing' | 'farm' | 'factory' | 'commerce' | 'infra';

/** 建物の定義 */
export interface BuildingDef {
  id: string;
  name: string;
  emoji: string;
  category: BuildingCategory;
  cost: Partial<Resources>;
  description: string;
  /** 生産する資源（工場・畑のみ） */
  produces?: {
    resource: ResourceType;
    amount: number;
    intervalMinutes: number; // 生産間隔（分）
  };
  /** コイン収益（住宅・商業） */
  coinPerHour?: number;
}

/** グリッドセルの状態 */
export interface GridCell {
  row: number;
  col: number;
  buildingId: string | null;
  /** 建設完了時刻（ISO文字列） */
  builtAt: string | null;
  /** 最後に収穫した時刻（ISO文字列） */
  lastHarvestedAt: string | null;
}

/** フォーカスセッションの記録 */
export interface FocusSession {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  resourcesEarned: Partial<Resources>;
}

/** ゲーム全体の状態 */
export interface GameState {
  resources: Resources;
  grid: GridCell[][];
  focusSessions: FocusSession[];
  /** 最後にアプリを閉じた時刻（ISO文字列） */
  lastClosedAt: string | null;
  /** 累計集中時間（分） */
  totalFocusMinutes: number;
  /** ゲーム開始日時 */
  startedAt: string;
  /** チュートリアル完了フラグ */
  tutorialDone: boolean;
}

/** グリッドサイズ定数 */
export const GRID_ROWS = 12;
export const GRID_COLS = 8;

/** 初期資源 */
export const INITIAL_RESOURCES: Resources = {
  wood: 10,
  iron: 5,
  seeds: 3,
  roadMat: 5,
  coins: 50,
  parts: 0,
  crops: 0,
};

/** 建物定義マスターデータ */
export const BUILDING_DEFS: BuildingDef[] = [
  // ===== 住宅 =====
  {
    id: 'hut',
    name: '小屋',
    emoji: '🛖',
    category: 'housing',
    cost: { wood: 5, coins: 10 },
    description: '最初の住まい。住民が増えるとコインが入る。',
    coinPerHour: 2,
  },
  {
    id: 'house',
    name: '家',
    emoji: '🏠',
    category: 'housing',
    cost: { wood: 15, iron: 5, coins: 30 },
    description: '快適な一軒家。コイン収益が増える。',
    coinPerHour: 5,
  },
  {
    id: 'apartment',
    name: 'アパート',
    emoji: '🏢',
    category: 'housing',
    cost: { wood: 20, iron: 20, coins: 100 },
    description: '多くの住民が住める集合住宅。',
    coinPerHour: 15,
  },
  // ===== 農業 =====
  {
    id: 'field',
    name: '畑',
    emoji: '🌾',
    category: 'farm',
    cost: { wood: 5, seeds: 3 },
    description: '農作物を育てる畑。時間が経つと収穫できる。',
    produces: { resource: 'crops', amount: 3, intervalMinutes: 30 },
  },
  {
    id: 'greenhouse',
    name: '温室',
    emoji: '🌿',
    category: 'farm',
    cost: { wood: 15, iron: 5, seeds: 5 },
    description: '効率よく農作物を生産できる温室。',
    produces: { resource: 'crops', amount: 8, intervalMinutes: 30 },
  },
  // ===== 工業 =====
  {
    id: 'sawmill',
    name: '製材所',
    emoji: '🪚',
    category: 'factory',
    cost: { wood: 10, iron: 5, roadMat: 3 },
    description: '木材を加工して部品を生産する。',
    produces: { resource: 'parts', amount: 2, intervalMinutes: 20 },
  },
  {
    id: 'ironworks',
    name: '鉄工所',
    emoji: '⚙️',
    category: 'factory',
    cost: { iron: 20, roadMat: 10, coins: 50 },
    description: '鉄を加工して高品質な部品を生産する。',
    produces: { resource: 'parts', amount: 5, intervalMinutes: 20 },
  },
  {
    id: 'factory',
    name: '工場',
    emoji: '🏭',
    category: 'factory',
    cost: { iron: 30, parts: 10, coins: 100 },
    description: '大規模な生産施設。多くの部品を生産する。',
    produces: { resource: 'parts', amount: 10, intervalMinutes: 20 },
  },
  // ===== 商業 =====
  {
    id: 'market',
    name: '市場',
    emoji: '🏪',
    category: 'commerce',
    cost: { wood: 10, coins: 50 },
    description: '農作物や部品を売買できる市場。',
    coinPerHour: 10,
  },
  {
    id: 'bank',
    name: '銀行',
    emoji: '🏦',
    category: 'commerce',
    cost: { iron: 20, parts: 5, coins: 200 },
    description: 'コインを自動で増やす銀行。',
    coinPerHour: 30,
  },
  // ===== インフラ =====
  {
    id: 'road',
    name: '道路',
    emoji: '🛣️',
    category: 'infra',
    cost: { roadMat: 3 },
    description: '街の基盤となる道路。',
  },
  {
    id: 'park',
    name: '公園',
    emoji: '🌳',
    category: 'infra',
    cost: { wood: 8, coins: 20 },
    description: '住民の憩いの場。街の評価が上がる。',
    coinPerHour: 3,
  },
  {
    id: 'bridge',
    name: '橋',
    emoji: '🌉',
    category: 'infra',
    cost: { iron: 15, roadMat: 10 },
    description: '川を渡るための橋。',
  },
];

/** 資源の表示名・絵文字 */
export const RESOURCE_INFO: Record<ResourceType, { name: string; emoji: string; color: string }> = {
  wood:    { name: '木材',       emoji: '🪵', color: '#795548' },
  iron:    { name: '鉄',         emoji: '⛏️', color: '#607D8B' },
  seeds:   { name: '種',         emoji: '🌱', color: '#4CAF50' },
  roadMat: { name: '道路材料',   emoji: '🧱', color: '#9E9E9E' },
  coins:   { name: 'コイン',     emoji: '🪙', color: '#FFC107' },
  parts:   { name: '部品',       emoji: '⚙️', color: '#455A64' },
  crops:   { name: '農作物',     emoji: '🌽', color: '#8BC34A' },
};

/** オフライン時間に応じた資源獲得レート（1時間あたり） */
export const OFFLINE_REWARD_RATE: Partial<Resources> = {
  wood: 8,
  iron: 4,
  seeds: 2,
  roadMat: 3,
  coins: 10,
};

/** フォーカス時間に応じた資源獲得レート（1分あたり） */
export const FOCUS_REWARD_RATE: Partial<Resources> = {
  wood: 2,
  iron: 1,
  seeds: 0.5,
  roadMat: 0.8,
  coins: 3,
};
