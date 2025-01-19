import { Profile } from '@/components/Profile';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

export default function ProfilePage() {
  const { id } = useLocalSearchParams();
  const { misskeyApi } = useAuth();

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => misskeyApi?.request('users/show', { userId: id as string }),
  });

  if (!user) return null;

  return <Profile user={user} />;
}
