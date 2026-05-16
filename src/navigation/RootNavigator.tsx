import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Home, Trophy, Mail, User, Gamepad2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import LoginScreen from '../screens/LoginScreen';
import GamesScreen from '../screens/GamesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RatingScreen from '../screens/RatingScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import EditEventScreen from '../screens/EditEventScreen';
import HistoryEventScreen from '../screens/HistoryEventScreen';
import InvitesScreen from '../screens/InvitesScreen';
import SurveyScreen from '../screens/SurveyScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import RatingNotificationModal from '../components/RatingNotificationModal';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgCard,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

function useInviteCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    const tick = () =>
      api.invites().then((d) => { if (mounted) setCount(d.length); }).catch(() => {});
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
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Games"
        component={GamesScreen}
        options={{
          title: 'Игры',
          tabBarIcon: ({ color, size }) => <Gamepad2 size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Rating"
        component={RatingScreen}
        options={{
          title: 'Рейтинг',
          tabBarIcon: ({ color, size }) => <Trophy size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Invites"
        component={InvitesScreen}
        options={{
          title: 'Приглашения',
          tabBarIcon: ({ color, size }) => <Mail size={size - 2} color={color} />,
          tabBarBadge: inviteCount > 0 ? inviteCount : undefined,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />,
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
          headerStyle: { backgroundColor: colors.bgCard },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
        }}
      >
        {user && !user.surveyCompleted ? (
          <Stack.Screen name="Survey" component={SurveyScreen} options={{ headerShown: false }} />
        ) : user ? (
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
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Профиль' }}
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
