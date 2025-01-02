import { IconNameMap, IconSymbol, IconType } from '@/components/ui/IconSymbol';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSetDrawerOpen } from '@/lib/contexts/DrawerContext';
import { Image } from 'expo-image';
import { Href, router } from 'expo-router';
import { NavigationOptions } from 'expo-router/build/global-state/routing';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type DrawerItem = {
  label: string;
  icon: {
    type?: IconType;
    name: IconNameMap[IconType];
  };
  path: Href;
  options?: NavigationOptions;
};

const groupedItems: Record<string, DrawerItem[]> = {
  main: [
    {
      label: '主页',
      icon: { name: 'home-outline' },
      path: '/(tabs)/(home)',
    },
    {
      label: '通知',
      icon: { name: 'notifications-outline' },
      path: '/(tabs)/(notifications)',
    },
    {
      label: '发现',
      icon: { name: 'compass-outline' },
      path: '/explore',
    },
    {
      label: '公告',
      icon: { name: 'megaphone-outline' },
      path: '/announcements',
    },
    {
      label: '搜索',
      icon: { name: 'search-outline' },
      path: '/(tabs)/(search)',
    },
  ],
  system: [
    {
      label: '设置',
      icon: { name: 'settings-outline' },
      path: '/settings',
    },
  ],
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
          <IconSymbol name={item.icon.name} type={item.icon.type} size={26} color="#111827" />
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
