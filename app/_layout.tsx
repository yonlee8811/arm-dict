import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text } from 'react-native';

const GOLD = '#a07828';

export default function RootLayout() {
  const router = useRouter();

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
        <Stack.Screen
          name="index"
          options={{
            title: '東アルメニア語辞書',
            headerRight: () => (
              <Pressable
                onPress={() => router.push('/about')}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="このアプリについて"
              >
                <Text style={{ color: '#fff', fontSize: 20 }}>ⓘ</Text>
              </Pressable>
            ),
          }}
        />
        <Stack.Screen name="entry/[id]" options={{ title: '語の詳細' }} />
        <Stack.Screen name="letters" options={{ title: 'アルメニア文字' }} />
        <Stack.Screen name="grammar" options={{ title: '文法' }} />
        <Stack.Screen name="favorites" options={{ title: 'お気に入り' }} />
        <Stack.Screen name="about" options={{ title: 'このアプリについて' }} />
      </Stack>
    </>
  );
}
