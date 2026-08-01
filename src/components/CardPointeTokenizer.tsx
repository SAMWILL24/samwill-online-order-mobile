import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { theme } from '../theme';

interface Props {
  site: string;
  testMode: boolean;
  onToken: (token: string) => void;
}

// CardPointe's Hosted iFrame Tokenizer is designed to be embedded inside a
// page via an <iframe>, which then relays the generated token to its parent
// window with postMessage. React Native's WebView only bridges out messages
// sent via window.ReactNativeWebView.postMessage, not the browser's generic
// postMessage - so this loads a small local HTML wrapper that nests the real
// tokenizer iframe and relays its message out to React Native.
// See https://developer.cardpointe.com/hosted-iframe-tokenizer.
export function CardPointeTokenizer({ site, testMode, onToken }: Props) {
  const [error, setError] = useState<string | null>(null);

  const host = testMode ? `${site}-uat` : site;
  const params = new URLSearchParams({
    useexpiry: 'true',
    usecvv: 'true',
    formatinput: 'true',
    orientation: 'vertical',
    enhancedresponse: 'true',
    invalidcreditcardevent: 'true',
    invalidexpiryevent: 'true',
    invalidcvvevent: 'true',
    tokenizewheninactive: 'true',
    fullmobilekeyboard: 'true',
    placeholder: 'Card number',
    placeholdermonth: 'MM',
    placeholderyear: 'YYYY',
    placeholdercvv: 'CVV',
  });
  const tokenizerSrc = `https://${host}.cardconnect.com/itoke/ajax-tokenizer.html?${params.toString()}`;

  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:${theme.surface};">
<iframe id="tokenFrame" src="${tokenizerSrc}" frameborder="0" scrolling="no" style="width:100%;height:220px;border:none;"></iframe>
<script>
  window.addEventListener('message', function (event) {
    try {
      var data = JSON.parse(event.data);
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    } catch (e) {}
  });
</script>
</body></html>`;

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: { token?: string; message?: string; validationError?: string };
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (data.validationError) {
        setError(data.validationError);
        return;
      }
      const token = data.token || data.message;
      if (token) {
        setError(null);
        onToken(token);
      }
    },
    [onToken]
  );

  return (
    <View>
      <View style={styles.container}>
        <WebView
          source={{ html }}
          onMessage={handleMessage}
          style={styles.webview}
          javaScriptEnabled
          scrollEnabled={false}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 220, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
  webview: { backgroundColor: 'transparent' },
  error: { color: theme.error, fontSize: 13, marginTop: 6 },
});
