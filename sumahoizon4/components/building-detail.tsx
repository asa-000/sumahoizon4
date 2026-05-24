import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useGame } from '@/lib/game-context';
import { BUILDING_DEFS, RESOURCE_INFO, GridCell } from '@/lib/game-types';

interface BuildingDetailProps {
  cell: GridCell | null;
  visible: boolean;
  onClose: () => void;
}

export function BuildingDetail({ cell, visible, onClose }: BuildingDetailProps) {
  const { harvestCell, getHarvestProgress, getHarvestReady } = useGame();

  if (!cell?.buildingId) return null;
  const def = BUILDING_DEFS.find((b) => b.id === cell.buildingId);
  if (!def) return null;

  const progress = getHarvestProgress(cell);
  const ready = getHarvestReady(cell);

  const handleHarvest = () => {
    harvestCell(cell.row, cell.col);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{def.emoji}</Text>
          <Text style={styles.name}>{def.name}</Text>
          <Text style={styles.desc}>{def.description}</Text>

          {def.produces && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>生産状況</Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
              </View>
              <Text style={styles.progressLabel}>
                {ready
                  ? '✅ 収穫できます！'
                  : `⏳ ${Math.round(progress * 100)}% 完了`}
              </Text>
              <Text style={styles.produceInfo}>
                {RESOURCE_INFO[def.produces.resource].emoji} ×{def.produces.amount} /{def.produces.intervalMinutes}分
              </Text>
              {ready && (
                <Pressable style={styles.harvestBtn} onPress={handleHarvest}>
                  <Text style={styles.harvestBtnText}>🌾 収穫する</Text>
                </Pressable>
              )}
            </View>
          )}

          {def.coinPerHour && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>収益</Text>
              <Text style={styles.coinInfo}>🪙 +{def.coinPerHour} コイン/時間</Text>
            </View>
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#F0F4E8',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 52,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B2B0A',
  },
  desc: {
    fontSize: 14,
    color: '#6B7C5A',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
  },
  progressBg: {
    height: 10,
    backgroundColor: '#E8F0D8',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: 13,
    color: '#1B2B0A',
    fontWeight: '600',
  },
  produceInfo: {
    fontSize: 13,
    color: '#6B7C5A',
  },
  harvestBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  harvestBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  coinInfo: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: '#C8D8B0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  closeBtnText: {
    color: '#1B2B0A',
    fontWeight: '700',
    fontSize: 15,
  },
});
