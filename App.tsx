import 'react-native-gesture-handler'; // Importante: debe ser la primera línea
import React, { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// Importamos nuestras pantallas
import FunsionScreen from './src/screens/FunsionScreen';
import GameScreen from './src/screens/GameScreen';
import EggSelectionScreen from './src/screens/EggSelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
import { InfoScreen } from './src/screens/InfoScreen';
import { SoundProvider } from './src/context/SoundContext';

// Prevenimos que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
  // Cargamos las fuentes AQUÍ, una sola vez para toda la app
  const [fontsLoaded] = useFonts({
    'Minecraft': require('./src/assets/fonts/minecraft_font.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SoundProvider>
      <NavigationContainer onReady={onLayoutRootView}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false, // Ocultamos la barra superior por defecto
            cardStyle: { backgroundColor: '#121212' }
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="EggSelection" component={EggSelectionScreen} />
          <Stack.Screen name="Funsion" component={FunsionScreen} />
          <Stack.Screen name="Info" component={InfoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SoundProvider>
  );
}