import { Profile } from '@/components/Profile';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfilePage() {
  const { user } = useLocalSearchParams();
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: top }}>
      <Profile user={user} />
    </View>
  );
}
