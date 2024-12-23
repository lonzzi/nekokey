import { useNoteUpdated } from '@/hooks/useNoteUpdated';
import { useMisskeyApi } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Image as HighPriorityImage } from 'expo-image';
import type { Note as NoteType } from 'misskey-js/built/entities';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, useColorScheme, View } from 'react-native';

import ImageLayoutGrid from './ImageView/ImageLayoutGrid';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface NoteProps {
  note: NoteType;
  onReply?: () => void;
  endpoint: string;
}

export function Note({ note, onReply, endpoint }: NoteProps) {
  const [reactions, setReactions] = useState(note.reactions || {});
  const [myReaction, setMyReaction] = useState(note.myReaction);
  const api = useMisskeyApi();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();

  useNoteUpdated({
    endpoint,
    note,
    onReacted: (reaction) => {
      setReactions((prev) => ({
        ...prev,
        [reaction]: (prev[reaction] || 0) + 1,
      }));
      setMyReaction(reaction);
    },
    onUnreacted: (reaction) => {
      setReactions((prev) => ({
        ...prev,
        [reaction]: Math.max((prev[reaction] || 0) - 1, 0),
      }));
      setMyReaction(null);
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async (reaction: string) => {
      if (myReaction) {
        return api?.request('notes/reactions/delete', {
          noteId: note.id,
        });
      } else {
        return api?.request('notes/reactions/create', {
          noteId: note.id,
          reaction,
        });
      }
    },
    onMutate: (reaction) => {
      if (myReaction) {
        setReactions((prev) => ({
          ...prev,
          [myReaction]: Math.max((prev[myReaction] || 0) - 1, 0),
        }));
        setMyReaction(null);
      } else {
        setReactions((prev) => ({
          ...prev,
          [reaction]: (prev[reaction] || 0) + 1,
        }));
        setMyReaction(reaction);
      }
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
      Alert.alert('转发失败', '请稍后重试');
    },
  });

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

    return <ImageLayoutGrid images={images} />;
  };

  const renderReactions = () => {
    return (
      <View style={styles.reactions}>
        {Object.entries(reactions).map(
          ([reaction, count]) =>
            count > 0 && (
              <Pressable
                key={reaction}
                style={[
                  styles.reactionButton,
                  myReaction === reaction && styles.reactionButtonActive,
                ]}
                onPress={() => reactionMutation.mutate(reaction)}
              >
                <ThemedText>{reaction}</ThemedText>
                <ThemedText style={styles.reactionCount}>{count}</ThemedText>
              </Pressable>
            ),
        )}
      </View>
    );
  };

  return (
    <ThemedView
      style={[styles.container, { borderBottomColor: colorScheme === 'dark' ? '#111' : '#eee' }]}
    >
      <HighPriorityImage source={{ uri: note.user.avatarUrl || '' }} style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <ThemedText numberOfLines={1}>
              <ThemedText type="defaultSemiBold" style={styles.name}>
                {note.user.name}
              </ThemedText>
              {'  '}
              <ThemedText style={styles.username}>@{note.user.username}</ThemedText>
            </ThemedText>
          </View>
          <ThemedText style={styles.time}>
            {formatDistanceToNow(new Date(note.createdAt), { locale: zhCN, addSuffix: true })}
          </ThemedText>
        </View>

        <ThemedText style={styles.text}>{note.text}</ThemedText>
        {renderImages()}
        {renderRenote()}

        <View style={styles.reactionsContainer}>{renderReactions()}</View>

        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onReply}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <ThemedText style={styles.actionText}>回复</ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={handleRenote}>
            <Ionicons name="repeat-outline" size={20} color="#666" />
            <ThemedText style={styles.actionText}>转发</ThemedText>
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
  name: {
    fontSize: 14,
    marginRight: 4,
  },
  username: {
    color: '#666',
    fontSize: 14,
    flexShrink: 1,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 16,
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
  reactionsContainer: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  reactionButtonActive: {
    backgroundColor: '#e0e0e0',
  },
  reactionCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
});
