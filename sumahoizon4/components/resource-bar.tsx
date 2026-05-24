import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useGame } from '@/lib/game-context';
import { RESOURCE_INFO, ResourceType } from '@/lib/game-types';

const DISPLAY_RESOURCES: ResourceType[] = ['wood', 'iron', 'seeds', 'roadMat', 'coins'];

export function ResourceBar() {
  const { state } = useGame();

  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderBottomWidth: 1,
        borderBottomColor: '#C8D8B0',
        paddingHorizontal: 8,
        paddingVertical: 6,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
      >
        {DISPLAY_RESOURCES.map((key) => {
          const info = RESOURCE_INFO[key];
          return (
            <View key={key} style={{ alignItems: 'center', minWidth: 48 }}>
              <Text style={{ fontSize: 18 }}>{info.emoji}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: info.color,
                  marginTop: 1,
                }}
              >
                {Math.floor(state.resources[key])}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
