import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'play-circle' : 'play-circle-outline'} size={24} color={String(color)} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'My wins', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={22} color={String(color)} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Settings', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={String(color)} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { position: 'absolute', height: 86, backgroundColor: colors.surface, borderTopColor: colors.line, paddingTop: 8 },
  label: { fontSize: 11, fontWeight: '800', marginTop: 2 },
});
