import { useParallaxScroll } from '@/components/ParallaxFlatList/useParallaxScroll';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import type { Note as NoteType, UserDetailed } from 'misskey-js/built/entities';
import { useEffect } from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { Mfm } from './Mfm';
import { Note } from './Note';
import ParallaxFlatList from './ParallaxFlatList';
import { ThemedText } from './ThemedText';

interface ProfileProps {
  user: UserDetailed;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Profile = ({ user, onRefresh, isRefreshing = false }: ProfileProps) => {
  const { misskeyApi, serverInfo, user: authUser } = useAuth();
  const bottomTabHeight = useBottomTabBarHeight();
  const colorScheme = useColorScheme() ?? 'light';
  const { scrollOffset } = useParallaxScroll();

  useEffect(() => {
    scrollOffset.value = 0;
  }, []);

  const avatarAnimatedStyle = useAnimatedStyle(() => {
    const avatarSize = interpolate(scrollOffset.value, [-25, 0, 25], [1, 1, 0.6], 'clamp');

    return {
      transform: [{ scale: avatarSize }],
    };
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', user.id],
    queryFn: () => misskeyApi?.request('users/notes', { userId: user.id }),
  });

  const renderNote = ({ item }: { item: NoteType }) => (
    <Note note={item} queryKey={['notes', user.id]} style={styles.note} />
  );

  return (
    <ParallaxFlatList
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image
          source={{ uri: user.bannerUrl || '' }}
          style={styles.bannerImage}
          contentFit="cover"
        />
      }
      staticHeaderComponent={
        <View style={styles.container}>
          <View style={styles.avatarContainer}>
            <Animated.View style={[styles.avatar, avatarAnimatedStyle]}>
              <Image
                source={{ uri: user.avatarUrl || '' }}
                style={{ height: '100%', width: '100%' }}
                contentFit="cover"
              />
            </Animated.View>
            <View style={styles.followButtonContainer}>
              <View style={styles.followButton}>
                <Pressable>
                  <ThemedText style={{ fontWeight: 'bold' }}>
                    {authUser?.id === user.id ? '编辑资料' : '关注'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.userInfo}>
            <ThemedText>
              <Mfm text={user.name || ''} plain style={styles.displayName} />
            </ThemedText>
            <ThemedText style={styles.username}>
              @{user.username}
              {user.host && serverInfo?.meta.uri !== user.host ? `@${user.host}` : ''}
            </ThemedText>
            {user.description && (
              <View style={{ marginTop: 12 }}>
                <Mfm text={user.description || ''} author={user} style={styles.bio} />
              </View>
            )}
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{user.followingCount}</ThemedText>
              <ThemedText style={styles.statLabel}>正在关注</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{user.followersCount}</ThemedText>
              <ThemedText style={styles.statLabel}>关注者</ThemedText>
            </View>
          </View>
        </View>
      }
      stickyHeaderComponent={
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: Colors[colorScheme].background,
          }}
        >
          <ThemedText type="defaultSemiBold">最近动态</ThemedText>
        </View>
      }
      data={notes || []}
      renderItem={renderNote}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomTabHeight }}
      keyExtractor={(item: NoteType) => item.id}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 16,
    marginTop: -24,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    color: '#808080',
  },
  avatarContainer: {
    marginTop: -40,
    flexDirection: 'row',
  },
  followButtonContainer: {
    marginTop: 48,
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  followButton: {
    backgroundColor: 'white',
    borderRadius: 160,
    paddingVertical: 2,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    alignItems: 'center',
  },
  avatar: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 9999,
    borderWidth: 4,
    borderColor: 'white',
    overflow: 'hidden',
    transformOrigin: 'bottom',
  },
  userInfo: {
    marginTop: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  username: {
    fontSize: 15,
    color: '#657786',
    marginTop: 2,
  },
  bio: {
    fontSize: 15,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statItem: {
    marginRight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#657786',
  },
  mainContainer: {
    marginTop: 12,
  },
  note: {
    paddingTop: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
