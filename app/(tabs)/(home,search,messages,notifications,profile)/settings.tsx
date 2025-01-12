import { Mfm } from '@/components/Mfm';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Settings() {
  const { top } = useSafeAreaInsets();

  return (
    <ScrollView style={{ paddingTop: top, marginHorizontal: 16 }}>
      <View style={{ marginBottom: 60 }}>
        <Mfm
          text="> 1231 :ohapoyoo: `123`"
          style={{ lineHeight: 24 }}
          onTextLayout={(e) => {
            console.log(e.nativeEvent.lines);
          }}
        />
      </View>
      <View style={{ marginBottom: 80 }}>
        <Mfm
          text="123:ohapoyoo: 123"
          style={{ lineHeight: 24 }}
          onTextLayout={(e) => {
            console.log(e.nativeEvent.lines);
          }}
        />
      </View>
      <View style={{ marginBottom: 80 }}>
        <Mfm
          text=":ohapoyoo: 123"
          style={{ lineHeight: 24 }}
          onTextLayout={(e) => {
            console.log(e.nativeEvent.lines);
          }}
        />
      </View>
      <View style={{ marginBottom: 80 }}>
        <Mfm
          text="123:ohapoyoo:"
          style={{ lineHeight: 24 }}
          onTextLayout={(e) => {
            console.log(e.nativeEvent.lines);
          }}
        />
      </View>
      <View style={{ marginBottom: 80 }}>
        <Mfm
          text=":ohapoyoo:"
          style={{ lineHeight: 24 }}
          onTextLayout={(e) => {
            console.log(e.nativeEvent.lines);
          }}
        />
      </View>
      <View style={{ marginBottom: 160 }}>
        <Mfm
          text="さむくて頭痛が… :oyasu_mint: さむくて頭痛が…さむくて頭痛が…さむくて頭痛が…:oyasu_mint:さむくて頭痛が…さむくて頭痛が…"
          style={{ lineHeight: 24 }}
          onTextLayout={(e) => {
            console.log(e.nativeEvent.lines);
          }}
        />
      </View>
      <View style={{ marginBottom: 160 }}>
        <Mfm text="さむくて頭痛が… 123" />
      </View>
    </ScrollView>
  );
}
