import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { GRAMMAR_HTML } from '../lib/grammarHtml';

export default function GrammarScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: '文法概説' }} />
      <WebView
        originWhitelist={['*']}
        source={{ html: GRAMMAR_HTML }}
        style={styles.web}
        onShouldStartLoadWithRequest={(req) => {
          return req.url === 'about:blank' || req.url.startsWith('data:') || req.url.includes('#');
        }}
        javaScriptEnabled
        domStorageEnabled={false}
        allowsBackForwardNavigationGestures={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  web: { flex: 1, backgroundColor: '#ffffff' },
});
