import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Profile() {
  const { user } = useLocalSearchParams();
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: top }}>
      <Text>user: {user}</Text>
    </View>
  );
}
