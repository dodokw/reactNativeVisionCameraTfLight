import React, { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useTensorflowModel } from 'react-native-nitro-tflite';

type ModelState = 'loading' | 'loaded' | 'error' | undefined;

interface ModelContextProps {
  model: any;
  rppgModel: any;
  state: ModelState;
  rppgState: ModelState;
}

const ModelContext = createContext<ModelContextProps>({
  model: null,
  rppgModel: null,
  state: undefined,
  rppgState: undefined,
});

export const ModelProvider = ({ children }: { children: ReactNode }) => {
  const { model: poseModel, state: poseState } = useTensorflowModel(
    require('../assets/models/yolo26n-pose.tflite'),
    Platform.OS === 'android' ? 'android-gpu' : 'default',
  );
  const { model: rppgModel, state: rppgState } = useTensorflowModel(
    require('../assets/models/tscan_mobile_fp32.tflite'),
    'default',
  );

  return (
    <ModelContext.Provider
      value={{
        model: poseModel,
        rppgModel,
        state: poseState,
        rppgState,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => useContext(ModelContext);
