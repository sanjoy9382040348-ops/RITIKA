import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Home, Library, Search } from 'lucide-react-native';
import { HomeScreen } from '@features/home/HomeScreen';
import { SearchScreen } from '@features/search/SearchScreen';
import { LibraryScreen } from '@features/library/LibraryScreen';
import { PlayerScreen } from '@features/player/PlayerScreen';
import { SettingsScreen } from '@features/settings/SettingsScreen';
import { MiniPlayer } from '@components/MiniPlayer';
import { AdBanner } from '@components/AdBanner';
import { palettes } from '@theme/tokens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const colors = palettes.dark;

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <View style={{ backgroundColor: colors.bg }}>
          <AdBanner />
          <MiniPlayer onOpenFullPlayer={() => navigation.navigate('Player')} />
          <BottomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 62, paddingBottom: 8 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.home'), tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: t('tabs.search'), tabBarIcon: ({ color }) => <Search color={color} size={22} /> }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: t('tabs.library'), tabBarIcon: ({ color }) => <Library color={color} size={22} /> }} />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Player" component={PlayerScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
