import { Profile } from '@/components/Profile';
import useRefresh from '@/hooks/useRefresh';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { refreshing, onRefresh } = useRefresh(refresh);

  if (!user) {
    return null;
  }

  return <Profile user={user} onRefresh={onRefresh} isRefreshing={refreshing} />;
}
