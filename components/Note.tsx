import { useNoteUpdated } from '@/hooks/useNoteUpdated';
import { useMisskeyApi } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Image as HighPriorityImage } from 'expo-image';
import type { Note as NoteType } from 'misskey-js/built/entities';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import ImagePreview from './ImagePreview';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface NoteProps {
  note: NoteType;
  onReply?: () => void;
  endpoint: string;
}

export function Note({ note, onReply, endpoint }: NoteProps) {
  const [isLiked, setIsLiked] = useState(!!note.myReaction);
  const [likeCount, setLikeCount] = useState(note.reactions?.['👍'] || 0);
  const api = useMisskeyApi();
  const queryClient = useQueryClient();

  useNoteUpdated({
    endpoint,
    note,
    onReacted: () => {
      setLikeCount((prev) => prev + 1);
      setIsLiked(true);
    },
    onUnreacted: () => {
      setLikeCount((prev) => prev - 1);
      setIsLiked(false);
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        return api?.request('notes/reactions/delete', {
          noteId: note.id,
        });
      } else {
        return api?.request('notes/reactions/create', {
          noteId: note.id,
          reaction: '👍',
        });
      }
    },
    onMutate: () => {
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
      setIsLiked(!isLiked);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: () => {
      Alert.alert('操作失败', '请稍后重试');
    },
  });

  const renoteMutation = useMutation({
    mutationFn: () => {
      if (!api) throw new Error('API not initialized');
      return api.request('notes/create', {
        renoteId: note.id,
      });
    },
    onSuccess: () => {
      Alert.alert('转发成功');
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: () => {
      Alert.alert('���发失败', '请稍后重试');
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleRenote = () => {
    renoteMutation.mutate();
  };

  const renderRenote = () => {
    if (!note.renote) return null;
    return (
      <ThemedView style={styles.renoteContainer}>
        <ThemedText style={styles.renoteHeader}>转发自 @{note.renote.user.username}</ThemedText>
        <ThemedText>{note.renote.text}</ThemedText>
      </ThemedView>
    );
  };

  const renderImages = () => {
    if (!note.files?.length) return null;

    const images = note.files.map((file) => ({
      uri: file.url,
      thumbnailUrl: file.thumbnailUrl,
      width: file.properties.width,
      height: file.properties.height,
    }));

    return <ImagePreview images={images} />;
  };

  return (
    <ThemedView style={styles.container}>
      <HighPriorityImage source={{ uri: note.user.avatarUrl || '' }} style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.nameContainer}>
              <ThemedText type="defaultSemiBold" style={styles.name} numberOfLines={1}>
                {note.user.name}
              </ThemedText>
              <ThemedText style={styles.username} numberOfLines={1}>
                @{note.user.username}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.time}>
            {formatDistanceToNow(new Date(note.createdAt), { locale: zhCN, addSuffix: true })}
          </ThemedText>
        </View>

        <ThemedText style={styles.text}>{note.text}</ThemedText>
        {renderImages()}
        {renderRenote()}

        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onReply}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <ThemedText style={styles.actionText}>回复</ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={handleRenote}>
            <Ionicons name="repeat-outline" size={20} color="#666" />
            <ThemedText style={styles.actionText}>转发</ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? '#ff4081' : '#666'}
            />
            {likeCount > 0 && <ThemedText style={styles.actionText}>{likeCount}</ThemedText>}
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  name: {
    fontSize: 14,
    marginRight: 4,
  },
  username: {
    color: '#666',
    fontSize: 14,
  },
  time: {
    color: '#666',
    fontSize: 14,
    // flexShrink: 0,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    marginVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  renoteContainer: {
    padding: 8,
    marginVertical: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#666',
  },
  renoteHeader: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
