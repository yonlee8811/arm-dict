import { View, Text, ScrollView, Pressable, StyleSheet, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { DICT } from '../lib/useDict';
import { AUDIO_COUNT } from '../lib/wordAudio';

const GOLD = '#a07828';
const RED = '#c0392b';

const SITE = 'https://www.armenia-guide.pink/';
const PRIVACY = 'https://www.armenia-guide.pink/app-privacy.html';
const CONTACT = 'https://www.armenia-guide.pink/contact.html';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function LinkItem({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      style={styles.link}
      onPress={() => Linking.openURL(url).catch(() => {})}
      accessibilityRole="link"
    >
      <Text style={styles.linkTxt}>{label}</Text>
      <Text style={styles.linkArrow}>›</Text>
    </Pressable>
  );
}

export default function AboutScreen() {
  const total = DICT.entries.length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'このアプリについて' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* タイトル */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/about-logo.png')}
            style={styles.heroLogo}
            resizeMode="contain"
            accessibilityLabel="東アルメニア語辞書ロゴ"
          />
          <Text style={styles.heroTitle}>東アルメニア語辞書</Text>
          <Text style={styles.heroSub}>ネイティブ発音つきオフライン辞書</Text>
        </View>

        {/* 音声クレジット */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>音声</Text>
          <Text style={styles.creditName}>Elen Davtyan</Text>
          <Text style={styles.creditRole}>
            東アルメニア語ネイティブスピーカー
          </Text>
          <Text style={styles.creditNote}>
            収録されている単語の発音は、すべて Elen Davtyan さんに録音していただきました。
            見出し語の選定や表現の自然さについても、多くの助言をいただいています。
          </Text>
        </View>

        {/* 収録内容 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>収録内容</Text>
          <Row label="見出し語" value={`${total.toLocaleString()} 語`} />
          <Row label="音声収録済み" value={`${AUDIO_COUNT.toLocaleString()} 語`} />
          <Row label="アルメニア文字" value="39 文字（発音つき）" />
          <Text style={styles.cardNote}>
            音声は今後のアップデートで順次追加していきます。
          </Text>
        </View>

        {/* リンク */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>リンク</Text>
          <LinkItem label="アルメニア完全ガイド（Web）" url={SITE} />
          <LinkItem label="プライバシーポリシー" url={PRIVACY} />
          <LinkItem label="お問い合わせ・誤りのご指摘" url={CONTACT} />
        </View>

        <Text style={styles.footer}>© 2026 Yeongho Lee</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdfcf9' },
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 20 },
  heroLogo: { width: 96, height: 96, marginBottom: 2 },
  heroTitle: { fontSize: 20, color: '#2a2118', fontWeight: '600', marginTop: 4 },
  heroSub: { fontSize: 13, color: '#8a7a5c', marginTop: 4 },

  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.22)',
  },
  cardTitle: {
    fontSize: 12,
    color: RED,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  cardNote: {
    fontSize: 12,
    color: '#8a7a5c',
    marginTop: 12,
    lineHeight: 19,
  },

  creditName: { fontSize: 22, color: '#2a2118', fontWeight: '600' },
  creditRole: { fontSize: 13, color: GOLD, marginTop: 3 },
  creditNote: {
    fontSize: 13,
    color: '#5a4d38',
    lineHeight: 22,
    marginTop: 12,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  rowLabel: { fontSize: 14, color: '#5a4d38' },
  rowValue: { fontSize: 14, color: '#2a2118', fontWeight: '600' },

  link: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(160,120,40,0.12)',
  },
  linkTxt: { fontSize: 14, color: GOLD, flex: 1 },
  linkArrow: { fontSize: 20, color: 'rgba(160,120,40,0.5)' },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#a2957c',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
