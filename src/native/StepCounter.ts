import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

type StepCounterNativeModule = {
  addListener(eventName: string): void;
  removeListeners(count: number): void;
  isStepCountingAvailable(): Promise<boolean>;
  requestPermission?: () => Promise<boolean>;
  getTodaySteps(): Promise<number>;
  startStepUpdates(): void;
  stopStepUpdates(): void;
};

const nativeStepCounter = NativeModules.StepCounter as
  | StepCounterNativeModule
  | undefined;

const STEP_COUNTER_CHANGE_EVENT = 'StepCounterChange';

const getNativeStepCounter = () => {
  if (!nativeStepCounter) {
    throw new Error('StepCounter native module is not linked.');
  }

  return nativeStepCounter;
};

export const StepCounter = {
  async isAvailable() {
    return getNativeStepCounter().isStepCountingAvailable();
  },

  async requestPermission() {
    if (Platform.OS === 'android') {
      if (Platform.Version < 29) {
        return true;
      }

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    const module = getNativeStepCounter();
    return module.requestPermission ? module.requestPermission() : true;
  },

  async getTodaySteps() {
    return getNativeStepCounter().getTodaySteps();
  },

  startStepUpdates(onChange: (steps: number) => void) {
    const module = getNativeStepCounter();
    const eventEmitter = new NativeEventEmitter(module);
    const subscription = eventEmitter.addListener(
      STEP_COUNTER_CHANGE_EVENT,
      steps => {
        onChange(Number(steps) || 0);
      },
    );

    module.startStepUpdates();

    return () => {
      subscription.remove();
      module.stopStepUpdates();
    };
  },
};
