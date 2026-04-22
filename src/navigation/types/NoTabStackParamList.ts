import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type NoTabStackParamList = {
  Camera: {
    exerciseIds: string[];
  };
};

export type NoTabStackNavigation = NativeStackNavigationProp<
  NoTabStackParamList,
  keyof NoTabStackParamList
>;
