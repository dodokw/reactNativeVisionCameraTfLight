import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { store, persistor } from './src/store';
import { ModelProvider } from './src/contexts/ModelContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StatusBar barStyle={'dark-content'} />
        <SafeAreaProvider>
          <SafeAreaView
            style={{ flex: 1, backgroundColor: '#000'}}
            edges={['bottom', 'top']}
          >
            <ModelProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </ModelProvider>
          </SafeAreaView>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
