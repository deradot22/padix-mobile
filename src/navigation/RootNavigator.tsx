import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import LoginScreen from '../screens/LoginScreen';
import GamesScreen from '../screens/GamesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RatingScreen from '../screens/RatingScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import EditEventScreen from '../screens/EditEventScreen';
import HistoryEventScreen from '../screens/HistoryEventScreen';
import InvitesScreen from '../screens/InvitesScreen';
import RatingNotificationModal from '../components/RatingNotificationModal';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { api } from '../api/client';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, color: focused ? colors.primary : colors.textDim }}>
      {label}
    </Text>
  );
}

function useInviteCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    const tick = () => api.invites().then((d) => { if (mounted) setCount(d.length); }).catch(() => {});
    tick();
    const id = setInterval(tick, 60000);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') tick(); });
    return () => { mounted = false; clearInterval(id); sub.remove(); };
  }, []);
  return count;
}

function MainTabs() {
  const inviteCount = useInviteCount();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgElevated },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tabs.Screen
        name="Games"
        component={GamesScreen}
        options={{
          title: 'Игры',
          tabBarIcon: ({ focused }) => <TabIcon label="🎾" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="Rating"
        component={RatingScreen}
        options={{
          title: 'Рейтинг',
          tabBarIcon: ({ focused }) => <TabIcon label="🏆" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="Invites"
        component={InvitesScreen}
        options={{
          title: 'Приглашения',
          tabBarIcon: ({ focused }) => <TabIcon label="📨" focused={focused} />,
          tabBarBadge: inviteCount > 0 ? inviteCount : undefined,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="EventDetails"
              component={EventDetailsScreen}
              options={{ title: 'Игра' }}
            />
            <Stack.Screen
              name="CreateEvent"
              component={CreateEventScreen}
              options={{ title: 'Создать игру' }}
            />
            <Stack.Screen
              name="EditEvent"
              component={EditEventScreen}
              options={{ title: 'Редактировать' }}
            />
            <Stack.Screen
              name="HistoryEvent"
              component={HistoryEventScreen}
              options={{ title: 'Матчи' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
      {user && <RatingNotificationModal />}
    </NavigationContainer>
  );
}
