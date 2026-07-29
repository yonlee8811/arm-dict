import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { GRAMMAR_HTML } from '../lib/grammarHtml';
import { isCoachDone, markCoachDone, measureRect, type Rect } from '../lib/coach';
import CoachMarks, { type CoachStep } from '../components/CoachMarks';

/* ------------------------------------------------------------------ */
/* WebView の中にあるタブ列の位置を測って送り返させる                    */
/*                                                                     */
/* HTML の構造に依存しないよう、セレクタでは指定しない。                 */
/*   ・画面上部にある                                                   */
/*   ・高さが低い（見出しの行やカード本体を拾わないため）                */
/*   ・中身が幅からはみ出している（＝横スクロールできる）                */
/* この3条件で最初に見つかった要素をタブ列とみなす。                     */
/*                                                                     */
/* viewport が width=device-width なら CSS px = dp なので、             */
/* 返ってきた値に WebView 自体の画面上の位置を足せば実座標になる。        */
/* ------------------------------------------------------------------ */

const PROBE = `
(function () {
  function findStrip() {
    var els = document.body.getElementsByTagName('*');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.scrollWidth <= el.clientWidth + 12) continue;
      var r = el.getBoundingClientRect();
      if (r.top < 280 && r.height > 24 && r.height < 130 && r.width > 120) return el;
    }
    return null;
  }
  function report() {
    var el = findStrip();
    var payload = { type: 'strip', rect: null };
    if (el) {
      var r = el.getBoundingClientRect();
      payload.rect = { x: r.left, y: r.top, width: r.width, height: r.height };
    }
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }
  if (document.readyState === 'complete') setTimeout(report, 250);
  else window.addEventListener('load', function () { setTimeout(report, 250); });
})();
true;
`;

export default function GrammarScreen() {
  const webWrapRef = useRef<View>(null);
  const [coachSteps, setCoachSteps] = useState<CoachStep[] | null>(null);
  const askedRef = useRef(false);

  useEffect(() => {
    isCoachDone('grammar').then((done) => { askedRef.current = done; });
  }, []);

  const onMessage = useCallback(async (e: WebViewMessageEvent) => {
    if (askedRef.current) return;
    let data: { type?: string; rect?: Rect | null };
    try {
      data = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (data.type !== 'strip') return;
    askedRef.current = true;

    const host = await measureRect(webWrapRef);
    const r = data.rect;

    const steps: CoachStep[] = [
      r && host
        ? {
            key: 'grammarTabs',
            title: '見出しは右へ続きます',
            text: 'このタブの列は横にスクロールできます。右へスワイプすると、否定・疑問、リエゾン、疑問詞などの項目が現れます。',
            rect: {
              x: host.x + r.x,
              y: host.y + r.y,
              width: r.width,
              height: r.height,
            },
            arrow: 'right',
            placement: 'insideEnd',
          }
        : {
            key: 'grammarTabsFallback',
            title: '見出しは右へ続きます',
            text: 'ページ上部のタブの列は横にスクロールできます。右へスワイプすると、否定・疑問、リエゾン、疑問詞などの項目が現れます。',
            rect: null,
          },
    ];
    setCoachSteps(steps);
  }, []);

  const closeCoach = useCallback(() => {
    setCoachSteps(null);
    markCoachDone('grammar');
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: '文法概説' }} />

      <View ref={webWrapRef} collapsable={false} style={styles.web}>
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
          injectedJavaScript={PROBE}
          onMessage={onMessage}
        />
      </View>

      <CoachMarks
        visible={coachSteps !== null}
        steps={coachSteps ?? []}
        onDone={closeCoach}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  web: { flex: 1, backgroundColor: '#ffffff' },
});
