import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { BeachBackground } from '../components/BeachBackground';
import { ProgressProvider } from '../lib/progress';
import { SettingsProvider, useSettings } from '../lib/settings';
import { SoundProvider } from '../lib/sounds';
import { beach, colors } from '../lib/theme';

function Sounds({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  return <SoundProvider enabled={settings.sound}>{children}</SoundProvider>;
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <Sounds>
          <StatusBar style="dark" />
          <Stack
            // Every screen sits on the lofi beach scene.
            // The palm tree only appears on the Home screen.
            screenLayout={({ children, route }) => (
              <View style={{ flex: 1 }}>
                <BeachBackground showPalm={route.name === 'index'} />
                {children}
              </View>
            )}
            screenOptions={{
              headerStyle: { backgroundColor: beach.header },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: beach.sky[2] },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="game/[size]" options={{ title: '' }} />
            <Stack.Screen name="adventure/index" options={{ title: 'Adventure' }} />
            <Stack.Screen name="adventure/[biome]" options={{ title: '' }} />
            <Stack.Screen name="level/[id]" options={{ title: '' }} />
            <Stack.Screen name="daily" options={{ title: 'Daily Puzzle' }} />
            <Stack.Screen name="sanctuary" options={{ title: 'Sanctuary' }} />
            <Stack.Screen name="collection" options={{ title: 'Collection' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="battle/index" options={{ title: 'Battle' }} />
            <Stack.Screen name="battle/race" options={{ title: 'Race' }} />
            <Stack.Screen name="battle/shared" options={{ title: 'Shared board' }} />
          </Stack>
        </Sounds>
      </ProgressProvider>
    </SettingsProvider>
  );
}
