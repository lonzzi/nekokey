import { Profile } from '@/components/Profile';
import { useLocalSearchParams } from 'expo-router';

export default function ProfilePage() {
  const { id } = useLocalSearchParams();

  return <Profile id={id as string} />;
}
