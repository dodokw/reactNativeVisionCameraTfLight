import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type TabStackParamList = {
  Home: undefined;
  StatsScreen: undefined;
  ExerciseListScreen: undefined;
  MyPageScreen: undefined;
  ProfileSettingsScreen: undefined;
  RoutineCreateScreen: undefined;
  WorkoutRecordScreen: undefined;
  AppSettingsScreen: undefined;
};

export type TabStackNavigation = BottomTabNavigationProp<
  TabStackParamList,
  keyof TabStackParamList
>;
