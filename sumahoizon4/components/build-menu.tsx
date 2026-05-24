import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useGame } from '@/lib/game-context';
import { BUILDING_DEFS, BuildingCategory, RESOURCE_INFO, BuildingDef } from '@/lib/game-types';

const CATEGORIES: { id: BuildingCategory; label: string; emoji: string }[] = [
  { id: 'housing', label: '住宅', emoji: '🏠' },
  { id: 'farm', label: '農業', emoji: '🌾' },
  { id: 'factory', label: '工業', emoji: '🏭' },
  { id: 'commerce', label: '商業', emoji: '🏪' },
  { id: 'infra', label: 'インフラ', emoji: '🛣️' },
];

interface BuildMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelectBuilding: (buildingId: string) => void;
}

export function BuildMenu({ visible, onClose, onSelectBuilding }: BuildMenuProps) {
  const { canAfford } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory>('housing');

  const filtered = BUILDING_DEFS.filter((b) => b.category === selectedCategory);

  const renderBuilding = ({ item }: { item: BuildingDef }) => {
    const affordable = canAfford(item.cost);
    return (
      <Pressable
        style={[styles.buildingCard, !affordable && styles.buildingCardDisabled]}
        onPress={() => {
          if (affordable) {
            onSelectBuilding(item.id);
            onClose();
          }
        }}
      >
        <Text style={styles.buildingEmoji}>{item.emoji}</Text>
        <View style={styles.buildingInfo}>
          <Text style={[styles.buildingName, !affordable && styles.textDisabled]}>
            {item.name}
          </Text>
          <Text style={styles.buildingDesc} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.costRow}>
            {Object.entries(item.cost).map(([key, val]) => {
              const info = RESOURCE_INFO[key as keyof typeof RESOURCE_INFO];
              return (
                <View key={key} style={styles.costItem}>
                  <Text style={styles.costEmoji}>{info?.emoji ?? '?'}</Text>
                  <Text style={[styles.costVal, !affordable && styles.textDisabled]}>
                    {val}
                  </Text>
                </View>
              );
            })}
          </View>
          {item.produces && (
            <Text style={styles.produceText}>
              ⏱ {item.produces.intervalMinutes}分ごとに {RESOURCE_INFO[item.produces.resource].emoji} ×{item.produces.amount}
            </Text>
          )}
          {item.coinPerHour && (
            <Text style={styles.produceText}>🪙 +{item.coinPerHour}/時間</Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>🏗️ 建設メニュー</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* カテゴリタブ */}
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === cat.id && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.id && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 建物リスト */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderBuilding}
            contentContainerStyle={{ padding: 12, gap: 10 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F0F4E8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#C8D8B0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2B0A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C8D8B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#1B2B0A',
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  categoryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#E8F0D8',
  },
  categoryTabActive: {
    backgroundColor: '#4CAF50',
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 10,
    color: '#6B7C5A',
    marginTop: 2,
  },
  categoryLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buildingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C8D8B0',
    gap: 12,
  },
  buildingCardDisabled: {
    opacity: 0.5,
  },
  buildingEmoji: {
    fontSize: 36,
    width: 44,
    textAlign: 'center',
  },
  buildingInfo: {
    flex: 1,
    gap: 3,
  },
  buildingName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2B0A',
  },
  buildingDesc: {
    fontSize: 12,
    color: '#6B7C5A',
    lineHeight: 16,
  },
  costRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F0F4E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  costEmoji: {
    fontSize: 12,
  },
  costVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2B0A',
  },
  textDisabled: {
    color: '#9AB08A',
  },
  produceText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
});
