import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular: require('@/assets/fonts/BebasNeue_400Regular.ttf'),
    SpaceGrotesk_300Light: require('@/assets/fonts/SpaceGrotesk_300Light.ttf'),
    SpaceGrotesk_400Regular: require('@/assets/fonts/SpaceGrotesk_400Regular.ttf'),
    SpaceGrotesk_500Medium: require('@/assets/fonts/SpaceGrotesk_500Medium.ttf'),
    SpaceGrotesk_600SemiBold: require('@/assets/fonts/SpaceGrotesk_600SemiBold.ttf'),
    SpaceGrotesk_700Bold: require('@/assets/fonts/SpaceGrotesk_700Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0d0d0d' },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="proyectos" />
        <Stack.Screen name="calidad" />
        <Stack.Screen name="pm" />
      </Stack>
    </>
  );
}
