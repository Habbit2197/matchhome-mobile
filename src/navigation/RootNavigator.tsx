/**
 * RootNavigator — con transiciones de pantalla animadas.
 * Stack: slide desde derecha (estándar iOS/Android)
 * Auth: fade suave
 * Tab: animación de shift en iconos
 */
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, View, Text, Animated } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { useEffect, useRef, useState } from 'react'

import LoginScreen          from '../screens/LoginScreen'
import RegisterScreen       from '../screens/RegisterScreen'
import FeedScreen           from '../screens/FeedScreen'
import MatchesScreen        from '../screens/MatchesScreen'
import ProfileScreen        from '../screens/ProfileScreen'
import ChatScreen           from '../screens/ChatScreen'
import PropertyDetailScreen from '../screens/PropertyDetailScreen'
import PublicProfileScreen  from '../screens/PublicProfileScreen'
import NotificationsScreen  from '../screens/NotificationsScreen'
import { useNotifications } from '../hooks/useNotifications'
import WelcomeOverlay       from '../components/animations/WelcomeOverlay'

const Stack = createNativeStackNavigator()
const Tab   = createBottomTabNavigator()

// ── Auth stack — transición fade ─────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      animation: 'fade',
    }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen}
        options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  )
}

// ── Tab icon con animación ────────────────────────────────────────
function AnimatedTabIcon({ name, focused, color, size }: {
  name: string; focused: boolean; color: string; size: number
}) {
  const scale = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      friction: 6, tension: 200, useNativeDriver: true,
    }).start()
  }, [focused])

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name as any} size={size} color={color} />
    </Animated.View>
  )
}

// ── Notif badge ───────────────────────────────────────────────────
function NotifTabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const { unreadCount } = useNotifications()
  const bounce = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(bounce, { toValue:  0, duration: 300, useNativeDriver: true }),
        ]),
        { iterations: 2 }
      ).start()
    }
  }, [unreadCount])

  return (
    <Animated.View style={{ transform: [{ translateY: bounce }] }}>
      <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />
      {unreadCount > 0 && (
        <View style={{
          position: 'absolute', top: -3, right: -8,
          minWidth: 16, height: 16, paddingHorizontal: 4,
          borderRadius: 8, backgroundColor: '#ef4444',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: '#fff',
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
            {unreadCount > 9 ? '9+' : String(unreadCount)}
          </Text>
        </View>
      )}
    </Animated.View>
  )
}

// ── Main tabs ─────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#7c3aed',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          height: 64, paddingTop: 6, paddingBottom: 8,
          borderTopColor: '#f1f5f9',
          backgroundColor: '#fff',
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icons: Record<string, [string, string]> = {
            Feed:          ['sparkles',      'sparkles-outline'],
            Matches:       ['heart',         'heart-outline'],
            Notifications: ['notifications', 'notifications-outline'],
            Profile:       ['person',        'person-outline'],
          }
          const [active, inactive] = icons[route.name] ?? ['home', 'home-outline']
          if (route.name === 'Notifications') {
            return <NotifTabIcon color={color} size={size} focused={focused} />
          }
          return <AnimatedTabIcon name={focused ? active : inactive} focused={focused} color={color} size={size} />
        },
      })}
    >
      <Tab.Screen name="Feed"          component={FeedScreen}          options={{ title: 'Descubrir' }} />
      <Tab.Screen name="Matches"       component={MatchesScreen}       options={{ title: 'Solicitudes' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Avisos' }} />
      <Tab.Screen name="Profile"       component={ProfileScreen}       options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  )
}

// ── Main stack con transiciones ───────────────────────────────────
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
    }}>
      <Stack.Screen name="Tabs"           component={MainTabs} options={{ animation: 'none' }} />
      <Stack.Screen name="Chat"           component={ChatScreen}
        options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen name="PublicProfile"  component={PublicProfileScreen}
        options={{ headerShown: true, headerBackTitle: 'Volver', headerTintColor: '#7c3aed' }} />
    </Stack.Navigator>
  )
}

// ── Root ──────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [showWelcome, setShowWelcome] = useState(false)
  const wasAuthRef = useRef(false)
  const fadeAnim   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isAuthenticated && !wasAuthRef.current && user) {
      setShowWelcome(true)
    }
    wasAuthRef.current = isAuthenticated
  }, [isAuthenticated, user])

  // Fade in al cargar
  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }
  }, [isLoading])

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#7c3aed" />
    </View>
  )

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <NavigationContainer>
        {isAuthenticated ? <MainStack /> : <AuthStack />}
        {showWelcome && user && (
          <WelcomeOverlay userName={user.name} onFinish={() => setShowWelcome(false)} />
        )}
      </NavigationContainer>
    </Animated.View>
  )
}
