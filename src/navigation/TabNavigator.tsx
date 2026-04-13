import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ExerciseListScreen } from '../screens/ExerciseListScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      {/* CameraScreen */}
      <Tab.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{ tabBarLabel: 'CameraScreen' }}
      />
      <Tab.Screen
        name="ExerciseListScreen"
        component={ExerciseListScreen}
        options={{ tabBarLabel: 'ExerciseListScreen' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};
