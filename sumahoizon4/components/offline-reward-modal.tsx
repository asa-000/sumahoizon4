import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Resources, RESOURCE_INFO, ResourceType } from '@/lib/game-types';

interface OfflineRewardModalProps {
  visible: boolean;
  offlineMinutes: number;
  rewards: Partial<Resources>;
  onClaim: () => void;
}

export function OfflineRewardModal({ visible, offlineMinutes, rewards, onClaim }: OfflineRewardModalProps) {
  const hours = Math.floor(offlineMinutes / 60);
  const mins = Math.floor(offlineMinutes % 60);
  const timeLabel = hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;

  const rewardEntries = Object.entries(rewards).filter(([, v]) => (v ?? 0) > 0);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.wave}>🌙</Text>
          <Text style={styles.title}>おかえり！</Text>
          <Text style={styles.subtitle}>
            {timeLabel}スマホを離れていましたね。{'\n'}その間に資源が集まりました！
          </Text>

          <View style={styles.rewardBox}>
            {rewardEntries.map(([key, val]) => {
              const info = RESOURCE_INFO[key as ResourceType];
              return (
                <View key={key} style={styles.rewardItem}>
                  <Text style={styles.rewardEmoji}>{info?.emoji ?? '?'}</Text>
                  <Text style={styles.rewardName}>{info?.name ?? key}</Text>
                  <Text style={styles.rewardVal}>+{Math.floor(val ?? 0)}</Text>
                </View>
              );
            })}
          </View>

          <Pressable style={styles.claimBtn} onPress={onClaim}>
            <Text style={styles.claimBtnText}>✨ 受け取る</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#F0F4E8',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 12,
  },
  wave: {
    fontSize: 52,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B2B0A',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7C5A',
    textAlign: 'center',
    lineHeight: 20,
  },
  rewardBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardEmoji: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  rewardName: {
    flex: 1,
    fontSize: 14,
    color: '#1B2B0A',
    fontWeight: '600',
  },
  rewardVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4CAF50',
  },
  claimBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 4,
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
  },
});
