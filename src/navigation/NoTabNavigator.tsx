import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CameraScreen } from '../screens/CameraScreen';
import { NoTabStackParamList } from './types';

const Stack = createNativeStackNavigator<NoTabStackParamList>();

export const NoTabNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Camera" component={CameraScreen} />
    </Stack.Navigator>
  );
};
