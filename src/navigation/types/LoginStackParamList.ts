import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type LoginStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  TermsConsent: {
    email: string;
    password: string;
    nickname?: string;
  };
};

export type LoginStackNavigation = NativeStackNavigationProp<
  LoginStackParamList,
  keyof LoginStackParamList
>;
