import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { ResourceBar } from '@/components/resource-bar';
import { BuildMenu } from '@/components/build-menu';
import { BuildingDetail } from '@/components/building-detail';
import { OfflineRewardModal } from '@/components/offline-reward-modal';
import { useGame } from '@/lib/game-context';
import { BUILDING_DEFS, GRID_ROWS, GRID_COLS, GridCell, Resources } from '@/lib/game-types';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const CELL_SIZE = 44;
const CELL_GAP = 2;

export default function MapScreen() {
  const {
    state,
    dispatch,
    calculateOfflineReward,
    getHarvestReady,
    saveState,
    placeBuilding,
  } = useGame();

  const [buildMenuVisible, setBuildMenuVisible] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [detailCell, setDetailCell] = useState<GridCell | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [offlineReward, setOfflineReward] = useState<Partial<Resources>>({});
  const [offlineMinutes, setOfflineMinutes] = useState(0);
  const [offlineModalVisible, setOfflineModalVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // アプリ起動時のオフライン報酬チェック（ゲーム状態ロード後）
  useEffect(() => {
    if (initialized) return;
    // 少し待ってからチェック（AsyncStorageのロードを待つ）
    const timer = setTimeout(() => {
      if (state.lastClosedAt) {
        const closedAt = new Date(state.lastClosedAt).getTime();
        const now = Date.now();
        const diffMinutes = (now - closedAt) / 1000 / 60;
        if (diffMinutes >= 5) {
          const reward = calculateOfflineReward(diffMinutes);
          const hasReward = Object.values(reward).some((v) => (v ?? 0) > 0);
          if (hasReward) {
            setOfflineReward(reward);
            setOfflineMinutes(diffMinutes);
            setOfflineModalVisible(true);
          }
        }
      }
      dispatch({ type: 'SET_LAST_CLOSED', payload: new Date().toISOString() });
      setInitialized(true);
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lastClosedAt]);

  // AppStateの変化でlastClosedAtを更新
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        dispatch({ type: 'SET_LAST_CLOSED', payload: new Date().toISOString() });
        saveState();
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [dispatch, saveState]);

  const handleClaimOfflineReward = useCallback(() => {
    dispatch({ type: 'ADD_RESOURCES', payload: offlineReward });
    setOfflineModalVisible(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [dispatch, offlineReward]);

  const handleCellPress = useCallback((cell: GridCell) => {
    if (selectedBuilding) {
      // 建物配置モード
      if (cell.buildingId) {
        Alert.alert('配置できません', 'すでに建物があります');
        return;
      }
      const success = placeBuilding(cell.row, cell.col, selectedBuilding);
      if (success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setSelectedBuilding(null);
      } else {
        Alert.alert('資源が足りません', '必要な資源を集めてから建設してください');
      }
    } else if (cell.buildingId) {
      // 建物詳細表示
      setDetailCell(cell);
      setDetailVisible(true);
    }
  }, [selectedBuilding, placeBuilding]);

  const handleSelectBuilding = useCallback((buildingId: string) => {
    setSelectedBuilding(buildingId);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const def = selectedBuilding ? BUILDING_DEFS.find((b) => b.id === selectedBuilding) : null;

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <ResourceBar />

      {/* 建物選択中のバナー */}
      {selectedBuilding && def && (
        <View style={styles.placeBanner}>
          <Text style={styles.placeBannerText}>
            {def.emoji} {def.name} を配置する場所をタップ
          </Text>
          <Pressable onPress={() => setSelectedBuilding(null)} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>キャンセル</Text>
          </Pressable>
        </View>
      )}

      {/* グリッドマップ */}
      <ScrollView
        style={styles.mapScroll}
        contentContainerStyle={styles.mapContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.grid}>
            {state.grid.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {row.map((cell, colIdx) => {
                  const buildingDef = cell.buildingId
                    ? BUILDING_DEFS.find((b) => b.id === cell.buildingId)
                    : null;
                  const harvestReady = cell.buildingId ? getHarvestReady(cell) : false;
                  const isSelectable = selectedBuilding !== null && !cell.buildingId;

                  return (
                    <Pressable
                      key={colIdx}
                      style={({ pressed }) => [
                        styles.cell,
                        buildingDef ? styles.cellBuilt : styles.cellEmpty,
                        isSelectable && styles.cellSelectable,
                        harvestReady && styles.cellHarvestReady,
                        pressed && styles.cellPressed,
                      ]}
                      onPress={() => handleCellPress(cell)}
                    >
                      {buildingDef ? (
                        <View style={styles.cellContent}>
                          <Text style={styles.cellEmoji}>{buildingDef.emoji}</Text>
                          {harvestReady && (
                            <View style={styles.harvestDot} />
                          )}
                        </View>
                      ) : (
                        <Text style={styles.cellGrass}>
                          {(rowIdx + colIdx) % 5 === 0 ? '🌿' : (rowIdx * colIdx) % 7 === 0 ? '🌱' : ''}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* 建設ボタン */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.buildBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={() => setBuildMenuVisible(true)}
        >
          <Text style={styles.buildBtnText}>🏗️ 建設する</Text>
        </Pressable>
      </View>

      {/* モーダル類 */}
      <BuildMenu
        visible={buildMenuVisible}
        onClose={() => setBuildMenuVisible(false)}
        onSelectBuilding={handleSelectBuilding}
      />
      <BuildingDetail
        cell={detailCell}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
      <OfflineRewardModal
        visible={offlineModalVisible}
        offlineMinutes={offlineMinutes}
        rewards={offlineReward}
        onClaim={handleClaimOfflineReward}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapScroll: {
    flex: 1,
  },
  mapContent: {
    padding: 8,
    alignItems: 'center',
  },
  grid: {
    gap: CELL_GAP,
  },
  gridRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cellEmpty: {
    backgroundColor: '#D4E8B0',
    borderColor: '#C8D8B0',
  },
  cellBuilt: {
    backgroundColor: '#E8F0D8',
    borderColor: '#4CAF50',
    borderWidth: 1.5,
  },
  cellSelectable: {
    backgroundColor: '#B8E8B0',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  cellHarvestReady: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  cellPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  cellContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmoji: {
    fontSize: 26,
  },
  cellGrass: {
    fontSize: 14,
  },
  harvestDot: {
    position: 'absolute',
    top: -14,
    right: -14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
  },
  placeBanner: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeBannerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  bottomBar: {
    padding: 12,
    paddingBottom: 8,
    backgroundColor: '#F0F4E8',
    borderTopWidth: 1,
    borderTopColor: '#C8D8B0',
  },
  buildBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buildBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
  },
});
