import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ThemeProvider } from './src/core/theme';
import { UserProvider } from './src/core/UserContext';

const Stack = createNativeStackNavigator();

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Wendler 5/3/1' }}
              />
              <Stack.Screen
                name="Workout"
                component={WorkoutScreen}
                options={{ title: 'Workout' }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Settings' }}
              />
              <Stack.Screen
                name="History"
                component={HistoryScreen}
                options={{ title: 'History' }}
              />
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{ title: 'Setup', headerLeft: () => null }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
