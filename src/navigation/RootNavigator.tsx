import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../hooks/useAuth'

import LoginScreen    from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import FeedScreen     from '../screens/FeedScreen'
import MatchesScreen  from '../screens/MatchesScreen'
import ProfileScreen  from '../screens/ProfileScreen'

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
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
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
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  )
}
