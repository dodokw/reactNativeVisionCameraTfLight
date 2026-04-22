import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { LoginNavigator } from './LoginNavigator';
import { NoTabNavigator } from './NoTabNavigator';
import { TabNavigator } from './TabNavigator';
import { RootStackParamList } from './types';
import { RootState } from '../store';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.user.isAuthenticated,
  );

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'TabNavigation' : 'LoginNavigation'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="LoginNavigation" component={LoginNavigator} />
      <Stack.Screen name="NoTabNavigation" component={NoTabNavigator} />
      <Stack.Screen name="TabNavigation" component={TabNavigator} />
    </Stack.Navigator>
  );
};
