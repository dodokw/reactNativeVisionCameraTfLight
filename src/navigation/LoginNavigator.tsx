import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SplashScreen from '../screens/SplashScreen';
import TermsConsentScreen from '../screens/TermsConsentScreen';
import { LoginStackParamList } from './types';

const Stack = createNativeStackNavigator<LoginStackParamList>();

export const LoginNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="TermsConsent" component={TermsConsentScreen} />
    </Stack.Navigator>
  );
};
