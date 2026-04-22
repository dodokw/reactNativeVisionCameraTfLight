import { NavigatorScreenParams } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { LoginStackParamList } from './LoginStackParamList';
import { NoTabStackParamList } from './NoTabStackParamList';
import { TabStackParamList } from './TabStackParamList';

export type RootStackParamList = {
  LoginNavigation: NavigatorScreenParams<LoginStackParamList> | undefined;
  NoTabNavigation: NavigatorScreenParams<NoTabStackParamList> | undefined;
  TabNavigation: NavigatorScreenParams<TabStackParamList> | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type RootStackNavigation = NativeStackNavigationProp<
  RootStackParamList,
  keyof RootStackParamList
>;
