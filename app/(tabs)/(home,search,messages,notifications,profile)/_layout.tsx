import { useSetDrawerSwipeDisabled } from '@/lib/contexts/DrawerContext';
import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';

export default function SharedLayout() {
  const pathname = usePathname();
  const setIsSwipeDisabled = useSetDrawerSwipeDisabled();

  useEffect(() => {
    setIsSwipeDisabled(pathname !== '/');
  }, [pathname, setIsSwipeDisabled]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[user]" options={{ headerShown: false }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}
