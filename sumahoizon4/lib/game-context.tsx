import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameState,
  Resources,
  ResourceType,
  GridCell,
  FocusSession,
  GRID_ROWS,
  GRID_COLS,
  INITIAL_RESOURCES,
  OFFLINE_REWARD_RATE,
  FOCUS_REWARD_RATE,
  BUILDING_DEFS,
} from './game-types';

const STORAGE_KEY = '@focus_city_game_state';

// ============================================================
// 初期状態の生成
// ============================================================
function createInitialGrid(): GridCell[][] {
  return Array.from({ length: GRID_ROWS }, (_, row) =>
    Array.from({ length: GRID_COLS }, (_, col) => ({
      row,
      col,
      buildingId: null,
      builtAt: null,
      lastHarvestedAt: null,
    }))
  );
}

const INITIAL_STATE: GameState = {
  resources: { ...INITIAL_RESOURCES },
  grid: createInitialGrid(),
  focusSessions: [],
  lastClosedAt: null,
  totalFocusMinutes: 0,
  startedAt: new Date().toISOString(),
  tutorialDone: false,
};

// ============================================================
// アクション定義
// ============================================================
type GameAction =
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'ADD_RESOURCES'; payload: Partial<Resources> }
  | { type: 'SPEND_RESOURCES'; payload: Partial<Resources> }
  | { type: 'PLACE_BUILDING'; payload: { row: number; col: number; buildingId: string } }
  | { type: 'HARVEST_CELL'; payload: { row: number; col: number; resources: Partial<Resources> } }
  | { type: 'ADD_FOCUS_SESSION'; payload: FocusSession }
  | { type: 'SET_LAST_CLOSED'; payload: string }
  | { type: 'COMPLETE_TUTORIAL' };

// ============================================================
// Reducer
// ============================================================
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'ADD_RESOURCES': {
      const updated = { ...state.resources };
      for (const [key, val] of Object.entries(action.payload)) {
        updated[key as ResourceType] = (updated[key as ResourceType] ?? 0) + (val ?? 0);
      }
      return { ...state, resources: updated };
    }

    case 'SPEND_RESOURCES': {
      const updated = { ...state.resources };
      for (const [key, val] of Object.entries(action.payload)) {
        updated[key as ResourceType] = Math.max(0, (updated[key as ResourceType] ?? 0) - (val ?? 0));
      }
      return { ...state, resources: updated };
    }

    case 'PLACE_BUILDING': {
      const { row, col, buildingId } = action.payload;
      const newGrid = state.grid.map((r) =>
        r.map((cell) =>
          cell.row === row && cell.col === col
            ? { ...cell, buildingId, builtAt: new Date().toISOString(), lastHarvestedAt: new Date().toISOString() }
            : cell
        )
      );
      return { ...state, grid: newGrid };
    }

    case 'HARVEST_CELL': {
      const { row, col, resources } = action.payload;
      const newGrid = state.grid.map((r) =>
        r.map((cell) =>
          cell.row === row && cell.col === col
            ? { ...cell, lastHarvestedAt: new Date().toISOString() }
            : cell
        )
      );
      const updatedResources = { ...state.resources };
      for (const [key, val] of Object.entries(resources)) {
        updatedResources[key as ResourceType] = (updatedResources[key as ResourceType] ?? 0) + (val ?? 0);
      }
      return { ...state, grid: newGrid, resources: updatedResources };
    }

    case 'ADD_FOCUS_SESSION': {
      const session = action.payload;
      const updatedResources = { ...state.resources };
      for (const [key, val] of Object.entries(session.resourcesEarned)) {
        updatedResources[key as ResourceType] = (updatedResources[key as ResourceType] ?? 0) + (val ?? 0);
      }
      return {
        ...state,
        resources: updatedResources,
        focusSessions: [session, ...state.focusSessions].slice(0, 100),
        totalFocusMinutes: state.totalFocusMinutes + session.durationMinutes,
      };
    }

    case 'SET_LAST_CLOSED':
      return { ...state, lastClosedAt: action.payload };

    case 'COMPLETE_TUTORIAL':
      return { ...state, tutorialDone: true };

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  canAfford: (cost: Partial<Resources>) => boolean;
  placeBuilding: (row: number, col: number, buildingId: string) => boolean;
  harvestCell: (row: number, col: number) => { harvested: boolean; resources: Partial<Resources> };
  getHarvestProgress: (cell: GridCell) => number; // 0-1
  getHarvestReady: (cell: GridCell) => boolean;
  calculateOfflineReward: (minutes: number) => Partial<Resources>;
  calculateFocusReward: (minutes: number) => Partial<Resources>;
  saveState: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ============================================================
// Provider
// ============================================================
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 初回ロード
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: GameState = JSON.parse(saved);
          // グリッドサイズが変わった場合の互換性対応
          if (!parsed.grid || parsed.grid.length !== GRID_ROWS) {
            parsed.grid = createInitialGrid();
          }
          // 各行の列数チェック
          parsed.grid = parsed.grid.map((row, rowIdx) => {
            if (row.length !== GRID_COLS) {
              return Array.from({ length: GRID_COLS }, (_, colIdx) => ({
                row: rowIdx,
                col: colIdx,
                buildingId: null,
                builtAt: null,
                lastHarvestedAt: null,
              }));
            }
            return row;
          });
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
      } catch (e) {
        console.warn('Failed to load game state', e);
      }
    })();
  }, []);

  // 定期的に保存（30秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // コイン自動収益（住宅・商業）- 1分ごとに計算
  useEffect(() => {
    const interval = setInterval(() => {
      const { grid } = stateRef.current;
      let totalCoinPerHour = 0;
      grid.flat().forEach((cell) => {
        if (!cell.buildingId) return;
        const def = BUILDING_DEFS.find((b) => b.id === cell.buildingId);
        if (def?.coinPerHour) {
          totalCoinPerHour += def.coinPerHour;
        }
      });
      if (totalCoinPerHour > 0) {
        const coinsPerMinute = totalCoinPerHour / 60;
        dispatch({ type: 'ADD_RESOURCES', payload: { coins: coinsPerMinute } });
      }
    }, 60000); // 1分ごと
    return () => clearInterval(interval);
  }, []);

  const saveState = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
  }, []);

  const canAfford = useCallback((cost: Partial<Resources>): boolean => {
    const { resources } = stateRef.current;
    return Object.entries(cost).every(([key, val]) => (resources[key as ResourceType] ?? 0) >= (val ?? 0));
  }, []);

  const placeBuilding = useCallback((row: number, col: number, buildingId: string): boolean => {
    const def = BUILDING_DEFS.find((b) => b.id === buildingId);
    if (!def) return false;
    if (!canAfford(def.cost)) return false;
    const cell = stateRef.current.grid[row]?.[col];
    if (!cell || cell.buildingId) return false;

    dispatch({ type: 'SPEND_RESOURCES', payload: def.cost });
    dispatch({ type: 'PLACE_BUILDING', payload: { row, col, buildingId } });
    return true;
  }, [canAfford]);

  const getHarvestProgress = useCallback((cell: GridCell): number => {
    if (!cell.buildingId) return 0;
    const def = BUILDING_DEFS.find((b) => b.id === cell.buildingId);
    if (!def?.produces) return 0;
    const lastTime = cell.lastHarvestedAt ? new Date(cell.lastHarvestedAt).getTime() : 0;
    const elapsed = (Date.now() - lastTime) / 1000 / 60; // 分
    return Math.min(1, elapsed / def.produces.intervalMinutes);
  }, []);

  const getHarvestReady = useCallback((cell: GridCell): boolean => {
    return getHarvestProgress(cell) >= 1;
  }, [getHarvestProgress]);

  const harvestCell = useCallback((row: number, col: number): { harvested: boolean; resources: Partial<Resources> } => {
    const cell = stateRef.current.grid[row]?.[col];
    if (!cell?.buildingId) return { harvested: false, resources: {} };
    const def = BUILDING_DEFS.find((b) => b.id === cell.buildingId);
    if (!def?.produces) return { harvested: false, resources: {} };
    if (!getHarvestReady(cell)) return { harvested: false, resources: {} };

    const earned: Partial<Resources> = { [def.produces.resource]: def.produces.amount };
    dispatch({ type: 'HARVEST_CELL', payload: { row, col, resources: earned } });
    return { harvested: true, resources: earned };
  }, [getHarvestReady]);

  const calculateOfflineReward = useCallback((minutes: number): Partial<Resources> => {
    const hours = minutes / 60;
    const reward: Partial<Resources> = {};
    for (const [key, rate] of Object.entries(OFFLINE_REWARD_RATE)) {
      reward[key as ResourceType] = Math.floor((rate ?? 0) * hours);
    }
    return reward;
  }, []);

  const calculateFocusReward = useCallback((minutes: number): Partial<Resources> => {
    const reward: Partial<Resources> = {};
    for (const [key, rate] of Object.entries(FOCUS_REWARD_RATE)) {
      reward[key as ResourceType] = Math.floor((rate ?? 0) * minutes);
    }
    return reward;
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        canAfford,
        placeBuilding,
        harvestCell,
        getHarvestProgress,
        getHarvestReady,
        calculateOfflineReward,
        calculateFocusReward,
        saveState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
