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
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'flash' : 'flash-outline'} size={22} color={String(color)} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={21} color={String(color)} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={21} color={String(color)} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { position: 'absolute', height: 85, backgroundColor: '#0D100E', borderTopColor: colors.line, paddingTop: 9 },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2 },
});
