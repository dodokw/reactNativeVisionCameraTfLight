import React, { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useTensorflowModel } from 'react-native-nitro-tflite';

type ModelState = 'loading' | 'loaded' | 'error' | undefined;

interface ModelContextProps {
  model: any;
  state: ModelState;
}

const ModelContext = createContext<ModelContextProps>({
  model: null,
  state: undefined,
});

export const ModelProvider = ({ children }: { children: ReactNode }) => {
  const { model, state } = useTensorflowModel(
    require('../assets/models/yolo26n-pose.tflite'),
    Platform.OS === 'ios' ? 'metal' : 'default',
  );

  return (
    <ModelContext.Provider value={{ model, state }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => useContext(ModelContext);
