import { Profile } from '@/components/Profile';
import { useAuth } from '@/lib/contexts/AuthContext';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfilePage() {
  const { user } = useAuth();
  const { top } = useSafeAreaInsets();

  if (!user) {
    return null;
  }

  return (
    <View style={{ paddingTop: top }}>
      <Profile user={user?.name} />
    </View>
  );
}
