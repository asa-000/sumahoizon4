import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useGame } from '@/lib/game-context';
import { BUILDING_DEFS } from '@/lib/game-types';

function formatTotalTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  check: (data: { totalFocusMinutes: number; buildingCount: number; sessionCount: number }) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_focus',
    title: '初めての集中',
    desc: '初めてフォーカスタイマーを完了した',
    emoji: '⏱',
    check: ({ sessionCount }) => sessionCount >= 1,
  },
  {
    id: 'focus_1h',
    title: '1時間の集中',
    desc: '累計1時間以上集中した',
    emoji: '🎯',
    check: ({ totalFocusMinutes }) => totalFocusMinutes >= 60,
  },
  {
    id: 'focus_10h',
    title: '10時間の集中',
    desc: '累計10時間以上集中した',
    emoji: '🏆',
    check: ({ totalFocusMinutes }) => totalFocusMinutes >= 600,
  },
  {
    id: 'first_building',
    title: '最初の建物',
    desc: '最初の建物を建設した',
    emoji: '🏠',
    check: ({ buildingCount }) => buildingCount >= 1,
  },
  {
    id: 'buildings_5',
    title: '小さな街',
    desc: '5つ以上の建物を建設した',
    emoji: '🏘',
    check: ({ buildingCount }) => buildingCount >= 5,
  },
  {
    id: 'buildings_20',
    title: '発展する街',
    desc: '20以上の建物を建設した',
    emoji: '🌆',
    check: ({ buildingCount }) => buildingCount >= 20,
  },
  {
    id: 'focus_5sessions',
    title: '習慣化',
    desc: '5回以上フォーカスセッションを完了した',
    emoji: '📚',
    check: ({ sessionCount }) => sessionCount >= 5,
  },
  {
    id: 'focus_20sessions',
    title: '集中の達人',
    desc: '20回以上フォーカスセッションを完了した',
    emoji: '🧠',
    check: ({ sessionCount }) => sessionCount >= 20,
  },
];

export default function ProgressScreen() {
  const { state } = useGame();

  const buildingCount = useMemo(() => {
    return state.grid.flat().filter((cell) => cell.buildingId !== null).length;
  }, [state.grid]);

  const sessionCount = state.focusSessions.length;
  const totalFocusMinutes = state.totalFocusMinutes;

  const achievementData = { totalFocusMinutes, buildingCount, sessionCount };

  // 建物カテゴリ別の数
  const buildingsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    state.grid.flat().forEach((cell) => {
      if (!cell.buildingId) return;
      const def = BUILDING_DEFS.find((b) => b.id === cell.buildingId);
      if (!def) return;
      counts[def.category] = (counts[def.category] ?? 0) + 1;
    });
    return counts;
  }, [state.grid]);

  const categoryLabels: Record<string, { label: string; emoji: string }> = {
    housing: { label: '住宅', emoji: '🏠' },
    farm: { label: '農業', emoji: '🌾' },
    factory: { label: '工業', emoji: '🏭' },
    commerce: { label: '商業', emoji: '🏪' },
    infra: { label: 'インフラ', emoji: '🛣️' },
  };

  // 街のレベル（建物数に応じて）
  const cityLevel = Math.floor(buildingCount / 5) + 1;
  const cityLevelLabel =
    cityLevel <= 1 ? '🌱 草原の村' :
    cityLevel <= 3 ? '🏘 小さな集落' :
    cityLevel <= 5 ? '🏙 発展する街' :
    cityLevel <= 8 ? '🌆 繁栄する都市' :
    '🌇 大都市';

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>📊 進捗・実績</Text>

        {/* 街のレベル */}
        <View style={styles.cityLevelCard}>
          <Text style={styles.cityLevelEmoji}>🌆</Text>
          <View>
            <Text style={styles.cityLevelLabel}>街のレベル {cityLevel}</Text>
            <Text style={styles.cityLevelName}>{cityLevelLabel}</Text>
          </View>
        </View>

        {/* 統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⏱</Text>
              <Text style={styles.statValue}>{formatTotalTime(totalFocusMinutes)}</Text>
              <Text style={styles.statLabel}>累計集中時間</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📋</Text>
              <Text style={styles.statValue}>{sessionCount}回</Text>
              <Text style={styles.statLabel}>集中セッション</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🏠</Text>
              <Text style={styles.statValue}>{buildingCount}棟</Text>
              <Text style={styles.statLabel}>建設した建物</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📅</Text>
              <Text style={styles.statValue}>
                {Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000 / 60 / 60 / 24) + 1}日目
              </Text>
              <Text style={styles.statLabel}>プレイ日数</Text>
            </View>
          </View>
        </View>

        {/* 建物内訳 */}
        {buildingCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏗️ 建物内訳</Text>
            <View style={styles.categoryList}>
              {Object.entries(categoryLabels).map(([catId, catInfo]) => {
                const count = buildingsByCategory[catId] ?? 0;
                if (count === 0) return null;
                return (
                  <View key={catId} style={styles.categoryItem}>
                    <Text style={styles.categoryEmoji}>{catInfo.emoji}</Text>
                    <Text style={styles.categoryLabel}>{catInfo.label}</Text>
                    <Text style={styles.categoryCount}>{count}棟</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 実績 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 実績</Text>
          <View style={styles.achievementList}>
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = ach.check(achievementData);
              return (
                <View key={ach.id} style={[styles.achievementCard, !unlocked && styles.achievementLocked]}>
                  <Text style={[styles.achievementEmoji, !unlocked && styles.achievementEmojiLocked]}>
                    {unlocked ? ach.emoji : '🔒'}
                  </Text>
                  <View style={styles.achievementInfo}>
                    <Text style={[styles.achievementTitle, !unlocked && styles.achievementTitleLocked]}>
                      {ach.title}
                    </Text>
                    <Text style={styles.achievementDesc}>{ach.desc}</Text>
                  </View>
                  {unlocked && (
                    <View style={styles.unlockedBadge}>
                      <Text style={styles.unlockedBadgeText}>達成！</Text>
                    </View>
                  )}
                </View>
              );
            })}
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
  cityLevelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 20,
  },
  cityLevelEmoji: {
    fontSize: 44,
  },
  cityLevelLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  cityLevelName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2B0A',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#C8D8B0',
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B2B0A',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7C5A',
    textAlign: 'center',
  },
  categoryList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C8D8B0',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0D8',
    gap: 10,
  },
  categoryEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#1B2B0A',
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  achievementList: {
    gap: 8,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C8D8B0',
  },
  achievementLocked: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  achievementEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  achievementEmojiLocked: {
    opacity: 0.4,
  },
  achievementInfo: {
    flex: 1,
    gap: 2,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2B0A',
  },
  achievementTitleLocked: {
    color: '#9AB08A',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#6B7C5A',
  },
  unlockedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unlockedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
