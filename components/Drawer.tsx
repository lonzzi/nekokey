import { useAuth } from '@/lib/contexts/AuthContext';
import { useSetDrawerOpen } from '@/lib/contexts/DrawerContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Href, router } from 'expo-router';
import { NavigationOptions } from 'expo-router/build/global-state/routing';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DrawerItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: Href;
  options?: NavigationOptions;
};

const groupedItems: Record<string, DrawerItem[]> = {
  main: [
    { label: '主页', icon: 'home-outline', path: '/' },
    // { label: '通知', icon: 'notifications-outline', path: '/my/notifications' },
    // { label: '便签', icon: 'bookmark-outline', path: '/my/clips' },
    { label: '发现', icon: 'compass-outline', path: '/explore' },
    { label: '公告', icon: 'megaphone-outline', path: '/announcements' },
    { label: '搜索', icon: 'search-outline', path: '/search' },
  ],
  system: [{ label: '设置', icon: 'settings-outline', path: '/settings' }],
};

export const DrawerContent = () => {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const setIsOpen = useSetDrawerOpen();

  if (!user) {
    return null;
  }

  const renderDrawerGroup = (items: DrawerItem[]) => (
    <View className="mb-4">
      {items.map((item) => (
        <Pressable
          key={item.path as string}
          onPress={() => {
            router.push(item.path);
            setIsOpen(false);
          }}
          className="flex-row items-center py-4"
        >
          <Ionicons name={item.icon} size={26} className="text-gray-900" />
          <Text className="ml-4 text-2xl font-medium">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={{ paddingTop: top }} className="flex-1 px-8">
      <View className="py-4">
        <View className="mb-2">
          <Image
            source={{ uri: user.avatarUrl }}
            style={{ width: 40, height: 40, borderRadius: 100 }}
          />
        </View>

        <View className="gap-1">
          <Text className="font-bold text-lg">{user.name}</Text>
          <Text className="text-gray-500">@{user.username}</Text>
        </View>

        <View className="flex-row gap-4 mt-3">
          <Pressable>
            <View className="flex-row gap-1 items-center">
              <Text className="font-medium">{user.followingCount}</Text>
              <Text className="text-gray-500">正在关注</Text>
            </View>
          </Pressable>
          <Pressable>
            <View className="flex-row gap-1 items-center">
              <Text className="font-medium">{user.followersCount}</Text>
              <Text className="text-gray-500">关注者</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View className="mt-6">
        {Object.entries(groupedItems).map(([key, items], index, array) => (
          <View key={key}>
            {renderDrawerGroup(items)}
            {index < array.length - 1 && <View className="h-px bg-gray-200 my-6" />}
          </View>
        ))}
      </View>
    </View>
  );
};
