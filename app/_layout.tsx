import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const GOLD = '#a07828';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: GOLD },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'アルメニア語辞書' }} />
        <Stack.Screen name="entry/[id]" options={{ title: '語の詳細' }} />
        <Stack.Screen name="letters" options={{ title: 'アルメニア文字' }} />
        <Stack.Screen name="favorites" options={{ title: 'お気に入り' }} />
        <Stack.Screen name="grammar" options={{ title: '文法概説' }} />
      </Stack>
    </>
  );
}
