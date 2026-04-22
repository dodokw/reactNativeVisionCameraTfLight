import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { ExerciseListScreen } from '../screens/ExerciseListScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { MyPageScreen } from '../screens/MyPageScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { RoutineCreateScreen } from '../screens/RoutineCreateScreen';
import { WorkoutRecordScreen } from '../screens/WorkoutRecordScreen';
import { AppSettingsScreen } from '../screens/AppSettingsScreen';

import { Colors } from '../tools/Colors';
import { HomeIcon, ProfileIcon, StatesIcon, WorkoutIcon } from '../tools/Svg';
import { TabStackParamList } from './types';

const Tab = createBottomTabNavigator<TabStackParamList>();

type TabBarIconProps = {
  color: string;
  size: number;
};

const renderHomeIcon = ({ color, size }: TabBarIconProps) => (
  <HomeIcon width={size} height={size} color={color} />
);

const renderStatesIcon = ({ color, size }: TabBarIconProps) => (
  <StatesIcon width={size} height={size} color={color} />
);

const renderWorkoutIcon = ({ color, size }: TabBarIconProps) => (
  <WorkoutIcon width={size} height={size} color={color} />
);

const renderProfileIcon = ({ color, size }: TabBarIconProps) => (
  <ProfileIcon width={size} height={size} color={color} />
);

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.kinetic.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: Colors.kinetic.background,
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tab.Screen
        name="StatsScreen"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: renderStatesIcon,
        }}
      />
      <Tab.Screen
        name="ExerciseListScreen"
        component={ExerciseListScreen}
        options={{
          tabBarLabel: 'Exercises',
          tabBarIcon: renderWorkoutIcon,
        }}
      />
      <Tab.Screen
        name="MyPageScreen"
        component={MyPageScreen}
        options={{
          tabBarLabel: 'My Page',
          tabBarIcon: renderProfileIcon,
        }}
      />
      <Tab.Screen
        name="ProfileSettingsScreen"
        component={ProfileSettingsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="RoutineCreateScreen"
        component={RoutineCreateScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="WorkoutRecordScreen"
        component={WorkoutRecordScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="AppSettingsScreen"
        component={AppSettingsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
};
