import { Profile } from '@/components/Profile';
import useRefresh from '@/hooks/useRefresh';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { refreshing, onRefresh } = useRefresh(refresh);

  return <Profile id={user?.id || ''} onRefresh={onRefresh} isRefreshing={refreshing} />;
}
