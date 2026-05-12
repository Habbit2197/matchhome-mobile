import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, View, Text } from 'react-native'
import { useAuth } from '../hooks/useAuth'

import LoginScreen    from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import FeedScreen     from '../screens/FeedScreen'
import MatchesScreen  from '../screens/MatchesScreen'
import ProfileScreen  from '../screens/ProfileScreen'
import ChatScreen     from '../screens/ChatScreen'
import PropertyDetailScreen from "../screens/PropertyDetailScreen"
import NotificationsScreen  from '../screens/NotificationsScreen'
import { useNotifications } from '../hooks/useNotifications'

const Stack = createNativeStackNavigator()
const Tab   = createBottomTabNavigator()

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#0f172a',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          height:  64,
          paddingTop:    6,
          paddingBottom: 8,
          borderTopColor: '#f1f5f9',
        },
        tabBarIcon: ({ color, focused, size }) => {
          let icon: any = 'home'
          if (route.name === 'Feed')     icon = focused ? 'sparkles'     : 'sparkles-outline'
          if (route.name === 'Matches')  icon = focused ? 'heart'        : 'heart-outline'
          if (route.name === 'Profile')  icon = focused ? 'person'       : 'person-outline'
          return <Ionicons name={icon} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Feed"    component={FeedScreen}    options={{ title: 'Descubrir' }} />
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ title: 'Solicitudes' }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color, size, focused }) => (
            <NotifTabIcon color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  )
}


/**
 * Icono de la tab Notificaciones con badge dinámico.
 * Vive aquí porque el badge se calcula desde el hook useNotifications.
 */
function NotifTabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const { unreadCount } = useNotifications()
  const name = focused ? 'notifications' : 'notifications-outline'
  return (
    <View>
      <Ionicons name={name as any} size={size} color={color} />
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
    </View>
  )
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    </Stack.Navigator>
  )
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  )
}
