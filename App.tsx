import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppShell } from './src/redesign/AppShell';
import { NativeToastProvider } from './src/redesign/Toast';

export default function App() {
  if (Platform.OS === 'web') {
    // Bản web nạp riêng để native không kéo GSAP/Lenis vào runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebApp } = require('./src/web/WebApp') as typeof import('./src/web/WebApp');
    return <WebApp />;
  }

  return (
    <SafeAreaProvider>
      <NativeToastProvider>
        <StatusBar style="light" />
        <AppShell />
      </NativeToastProvider>
    </SafeAreaProvider>
  );
}
