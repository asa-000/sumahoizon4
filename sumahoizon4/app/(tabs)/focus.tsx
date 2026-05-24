import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useGame } from '@/lib/game-context';
import { RESOURCE_INFO, FocusSession, Resources } from '@/lib/game-types';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

const PRESET_MINUTES = [10, 25, 50, 90];

type TimerState = 'idle' | 'running' | 'paused' | 'done';

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0');
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

export default function FocusScreen() {
  const { calculateFocusReward, dispatch, state } = useGame();
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [earnedResources, setEarnedResources] = useState<Partial<Resources>>({});
  const [showReward, setShowReward] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalSecondsRef = useRef<number>(25 * 60);

  // タイマー動作中はスクリーンを常時点灯
  useKeepAwake();

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleStart = useCallback(() => {
    const totalSecs = selectedMinutes * 60;
    totalSecondsRef.current = totalSecs;
    setRemainingSeconds(totalSecs);
    setTimerState('running');
    setShowReward(false);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, totalSecs - elapsed);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearTimer();
        setTimerState('done');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }, 500);
  }, [selectedMinutes, clearTimer]);

  const handlePause = useCallback(() => {
    clearTimer();
    setTimerState('paused');
  }, [clearTimer]);

  const handleResume = useCallback(() => {
    const remaining = remainingSeconds;
    startTimeRef.current = Date.now() - (totalSecondsRef.current - remaining) * 1000;
    setTimerState('running');

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const rem = Math.max(0, totalSecondsRef.current - elapsed);
      setRemainingSeconds(rem);
      if (rem <= 0) {
        clearTimer();
        setTimerState('done');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }, 500);
  }, [remainingSeconds, clearTimer]);

  const handleStop = useCallback(() => {
    Alert.alert(
      '集中を終了しますか？',
      'タイマーを途中で止めると報酬は得られません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '終了する',
          style: 'destructive',
          onPress: () => {
            clearTimer();
            setTimerState('idle');
            setRemainingSeconds(selectedMinutes * 60);
          },
        },
      ]
    );
  }, [clearTimer, selectedMinutes]);

  const handleClaimReward = useCallback(() => {
    const elapsed = totalSecondsRef.current - remainingSeconds;
    const elapsedMinutes = elapsed / 60;
    const actualMinutes = timerState === 'done' ? selectedMinutes : Math.floor(elapsedMinutes);

    if (actualMinutes < 1) {
      Alert.alert('報酬なし', '1分以上集中してから報酬を受け取れます');
      return;
    }

    const reward = calculateFocusReward(actualMinutes);
    const session: FocusSession = {
      id: Date.now().toString(),
      startedAt: new Date(Date.now() - actualMinutes * 60 * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationMinutes: actualMinutes,
      resourcesEarned: reward,
    };

    dispatch({ type: 'ADD_FOCUS_SESSION', payload: session });
    setEarnedResources(reward);
    setShowReward(true);
    setTimerState('idle');
    setRemainingSeconds(selectedMinutes * 60);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [timerState, remainingSeconds, selectedMinutes, calculateFocusReward, dispatch]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progress = 1 - remainingSeconds / (totalSecondsRef.current || 1);

  // 最近のセッション（最大5件）
  const recentSessions = state.focusSessions.slice(0, 5);

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>⏱ 集中タイマー</Text>
        <Text style={styles.screenSubtitle}>スマホを置いて集中すると資源が手に入る！</Text>

        {/* タイマーサークル */}
        <View style={styles.timerCircle}>
          <View style={styles.timerInner}>
            {timerState === 'idle' ? (
              <Text style={styles.timerIdleText}>{selectedMinutes}:00</Text>
            ) : (
              <Text style={styles.timerText}>
                {pad(minutes)}:{pad(seconds)}
              </Text>
            )}
            {timerState !== 'idle' && (
              <Text style={styles.timerLabel}>
                {timerState === 'running' ? '集中中...' : timerState === 'paused' ? '一時停止' : '完了！'}
              </Text>
            )}
          </View>
        </View>

        {/* プリセット選択（idle時のみ） */}
        {timerState === 'idle' && (
          <View style={styles.presetRow}>
            {PRESET_MINUTES.map((min) => (
              <Pressable
                key={min}
                style={[styles.presetBtn, selectedMinutes === min && styles.presetBtnActive]}
                onPress={() => {
                  setSelectedMinutes(min);
                  setRemainingSeconds(min * 60);
                  totalSecondsRef.current = min * 60;
                }}
              >
                <Text style={[styles.presetText, selectedMinutes === min && styles.presetTextActive]}>
                  {min}分
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* 報酬プレビュー（idle時） */}
        {timerState === 'idle' && !showReward && (
          <View style={styles.rewardPreview}>
            <Text style={styles.rewardPreviewTitle}>獲得できる資源（目安）</Text>
            <View style={styles.rewardPreviewRow}>
              {Object.entries(calculateFocusReward(selectedMinutes)).map(([key, val]) => {
                if ((val ?? 0) <= 0) return null;
                const info = RESOURCE_INFO[key as keyof typeof RESOURCE_INFO];
                return (
                  <View key={key} style={styles.rewardPreviewItem}>
                    <Text style={styles.rewardPreviewEmoji}>{info?.emoji}</Text>
                    <Text style={styles.rewardPreviewVal}>+{val}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 報酬受け取り表示 */}
        {showReward && (
          <View style={styles.rewardBox}>
            <Text style={styles.rewardBoxTitle}>🎉 お疲れ様でした！</Text>
            <Text style={styles.rewardBoxSubtitle}>集中した分だけ資源を獲得！</Text>
            <View style={styles.rewardRow}>
              {Object.entries(earnedResources).map(([key, val]) => {
                if ((val ?? 0) <= 0) return null;
                const info = RESOURCE_INFO[key as keyof typeof RESOURCE_INFO];
                return (
                  <View key={key} style={styles.rewardItem}>
                    <Text style={styles.rewardEmoji}>{info?.emoji}</Text>
                    <Text style={styles.rewardVal}>+{val}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* コントロールボタン */}
        <View style={styles.controlRow}>
          {timerState === 'idle' && (
            <Pressable
              style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}
              onPress={handleStart}
            >
              <Text style={styles.startBtnText}>▶ 集中開始</Text>
            </Pressable>
          )}
          {timerState === 'running' && (
            <>
              <Pressable style={styles.pauseBtn} onPress={handlePause}>
                <Text style={styles.pauseBtnText}>⏸ 一時停止</Text>
              </Pressable>
              <Pressable style={styles.stopBtn} onPress={handleStop}>
                <Text style={styles.stopBtnText}>■ 終了</Text>
              </Pressable>
            </>
          )}
          {timerState === 'paused' && (
            <>
              <Pressable style={styles.startBtn} onPress={handleResume}>
                <Text style={styles.startBtnText}>▶ 再開</Text>
              </Pressable>
              <Pressable style={styles.stopBtn} onPress={handleStop}>
                <Text style={styles.stopBtnText}>■ 終了</Text>
              </Pressable>
            </>
          )}
          {timerState === 'done' && (
            <Pressable
              style={({ pressed }) => [styles.claimBtn, pressed && { opacity: 0.85 }]}
              onPress={handleClaimReward}
            >
              <Text style={styles.claimBtnText}>✨ 報酬を受け取る</Text>
            </Pressable>
          )}
        </View>

        {/* 最近の集中セッション */}
        {recentSessions.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>📋 最近の集中記録</Text>
            {recentSessions.map((session) => (
              <View key={session.id} style={styles.historyItem}>
                <Text style={styles.historyDuration}>⏱ {formatDuration(session.durationMinutes)}</Text>
                <Text style={styles.historyDate}>
                  {new Date(session.endedAt).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  timerInner: {
    alignItems: 'center',
  },
  timerIdleText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  timerLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E8F0D8',
    borderWidth: 1.5,
    borderColor: '#C8D8B0',
  },
  presetBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7C5A',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  rewardPreview: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C8D8B0',
  },
  rewardPreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7C5A',
  },
  rewardPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rewardPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F4E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardPreviewEmoji: {
    fontSize: 16,
  },
  rewardPreviewVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  rewardBox: {
    width: '100%',
    backgroundColor: '#E8F8E8',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
  },
  rewardBoxTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B2B0A',
  },
  rewardBoxSubtitle: {
    fontSize: 13,
    color: '#6B7C5A',
  },
  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rewardEmoji: {
    fontSize: 20,
  },
  rewardVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4CAF50',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  startBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pauseBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  stopBtn: {
    backgroundColor: '#E8F0D8',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8D8B0',
  },
  stopBtnText: {
    color: '#6B7C5A',
    fontWeight: '700',
    fontSize: 16,
  },
  claimBtn: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  historySection: {
    width: '100%',
    gap: 8,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2B0A',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C8D8B0',
  },
  historyDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7C5A',
  },
});
