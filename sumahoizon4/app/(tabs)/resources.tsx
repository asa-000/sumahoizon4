import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useGame } from '@/lib/game-context';
import { RESOURCE_INFO, ResourceType, OFFLINE_REWARD_RATE, FOCUS_REWARD_RATE } from '@/lib/game-types';

const ALL_RESOURCES: ResourceType[] = ['wood', 'iron', 'seeds', 'roadMat', 'coins', 'parts', 'crops'];

export default function ResourcesScreen() {
  const { state } = useGame();

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>🌿 資源一覧</Text>
        <Text style={styles.screenSubtitle}>集めた資源を使って街を発展させよう</Text>

        {/* 資源カード一覧 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>現在の保有量</Text>
          {ALL_RESOURCES.map((key) => {
            const info = RESOURCE_INFO[key];
            const amount = Math.floor(state.resources[key]);
            const offlineRate = OFFLINE_REWARD_RATE[key];
            const focusRate = FOCUS_REWARD_RATE[key];

            return (
              <View key={key} style={styles.resourceCard}>
                <View style={styles.resourceLeft}>
                  <Text style={styles.resourceEmoji}>{info.emoji}</Text>
                  <View>
                    <Text style={styles.resourceName}>{info.name}</Text>
                    <View style={styles.rateRow}>
                      {offlineRate && (
                        <Text style={styles.rateText}>🌙 +{offlineRate}/時間</Text>
                      )}
                      {focusRate && (
                        <Text style={styles.rateText}>⏱ +{focusRate}/分</Text>
                      )}
                      {!offlineRate && !focusRate && (
                        <Text style={styles.rateText}>生産で獲得</Text>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.resourceRight}>
                  <Text style={[styles.resourceAmount, { color: info.color }]}>{amount}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 獲得方法の説明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>資源の獲得方法</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🌙 スマホを離れる</Text>
            <Text style={styles.infoDesc}>
              アプリを閉じてスマホを置いておくと、時間に応じて木材・鉄・種・道路材料・コインが自動で貯まります。
              次にアプリを開いたときにまとめて受け取れます。
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>⏱ 集中タイマー</Text>
            <Text style={styles.infoDesc}>
              「集中」タブでタイマーをセットして勉強・仕事に集中すると、集中した時間に応じてより多くの資源が手に入ります。
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🏭 工場・畑の生産</Text>
            <Text style={styles.infoDesc}>
              工場を建設すると部品を、畑を建設すると農作物を時間経過で生産できます。
              街マップで建物をタップして収穫しましょう。
            </Text>
          </View>
        </View>

        {/* 資源の用途 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>資源の用途</Text>
          <View style={styles.usageTable}>
            <View style={styles.usageHeader}>
              <Text style={[styles.usageCell, styles.usageHeaderText, { flex: 1.2 }]}>資源</Text>
              <Text style={[styles.usageCell, styles.usageHeaderText, { flex: 2 }]}>主な用途</Text>
            </View>
            {[
              { emoji: '🪵', name: '木材', usage: '家・畑・公園の建設' },
              { emoji: '⛏️', name: '鉄', usage: '工場・道路・高層建物' },
              { emoji: '🌱', name: '種', usage: '畑・温室の建設' },
              { emoji: '🧱', name: '道路材料', usage: '道路・橋・工場' },
              { emoji: '🪙', name: 'コイン', usage: '各種建物のアップグレード' },
              { emoji: '⚙️', name: '部品', usage: '高度な建物の建設' },
              { emoji: '🌽', name: '農作物', usage: 'コインへの変換・食料' },
            ].map((item) => (
              <View key={item.name} style={styles.usageRow}>
                <Text style={[styles.usageCell, { flex: 1.2 }]}>
                  {item.emoji} {item.name}
                </Text>
                <Text style={[styles.usageCell, styles.usageUsage, { flex: 2 }]}>{item.usage}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B2B0A',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#6B7C5A',
    marginTop: -12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2B0A',
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C8D8B0',
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  resourceEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  resourceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2B0A',
  },
  rateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  rateText: {
    fontSize: 11,
    color: '#6B7C5A',
  },
  resourceRight: {
    alignItems: 'flex-end',
  },
  resourceAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#C8D8B0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2B0A',
  },
  infoDesc: {
    fontSize: 13,
    color: '#6B7C5A',
    lineHeight: 19,
  },
  usageTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C8D8B0',
  },
  usageHeader: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  usageHeaderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  usageRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0D8',
  },
  usageCell: {
    fontSize: 13,
    color: '#1B2B0A',
  },
  usageUsage: {
    color: '#6B7C5A',
  },
});
