import { useNoteUpdated } from '@/hooks/useNoteUpdated';
import { useMisskeyApi } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getEmoji } from '@/lib/utils/emojis';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Image as HighPriorityImage } from 'expo-image';
import type { Note as NoteType } from 'misskey-js/built/entities';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import AutoResizingImage from './AutoResizingImage';
import ImageLayoutGrid from './ImageView/ImageLayoutGrid';
import ReactionPicker from './ReactionPicker';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface NoteProps {
  note: NoteType;
  onReply?: () => void;
  endpoint: string;
}

const NoteRender = (note: NoteType) => {
  const customEmojis = note.emojis;
  const text = note.text;

  if (!text) return text;

  const parts = text.split(/(:[\w-]+:)/g).map((part, index) => {
    const emojiMatch = part.match(/^:([\w-]+):$/);
    if (emojiMatch && customEmojis?.[emojiMatch[1]]) {
      return (
        <AutoResizingImage
          key={index}
          uri={customEmojis[emojiMatch[1]]}
          height={20}
          style={{
            transform: [{ translateY: 6 }],
          }}
        />
      );
    }
    return <Text key={index}>{part}</Text>;
  });

  return <>{parts}</>;
};

const NoteContent = ({ note, size = 'normal' }: { note: NoteType; size?: 'small' | 'normal' }) => {
  const contentNote = note.text ? note : note.renote;
  if (!contentNote) return null;

  return (
    <>
      <ThemedText
        style={{
          fontSize: size === 'small' ? 13 : 14,
          lineHeight: size === 'small' ? 18 : 20,
        }}
      >
        {NoteRender(contentNote)}
      </ThemedText>
      {contentNote.files?.length && contentNote.files.length > 0 ? (
        <ImageLayoutGrid
          images={contentNote.files.map((file) => ({
            uri: file.url,
            thumbnailUrl: file.thumbnailUrl,
            width: file.properties.width,
            height: file.properties.height,
          }))}
          style={{ marginVertical: 8 }}
        />
      ) : null}
    </>
  );
};

export function Note({ note, onReply, endpoint }: NoteProps) {
  const [reactions, setReactions] = useState(note.reactions || {});
  const [myReaction, setMyReaction] = useState(note.myReaction);
  const api = useMisskeyApi();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { serverInfo } = useAuth();

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
        await api?.request('notes/reactions/delete', {
          noteId: note.id,
        });
        if (reaction !== myReaction) {
          await api?.request('notes/reactions/create', {
            noteId: note.id,
            reaction,
          });
        }
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
        if (reaction !== myReaction) {
          setReactions((prev) => ({
            ...prev,
            [reaction]: (prev[reaction] || 0) + 1,
          }));
          setMyReaction(reaction);
        } else {
          setMyReaction(null);
        }
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

  const handleReactionSelect = (reaction: string) => {
    reactionMutation.mutate(reaction);
    setShowReactionPicker(false);
  };

  const renderRenote = () => {
    if (!note.renote) return null;
    return (
      <ThemedView style={styles.renoteContainer}>
        <View style={styles.renoteUserInfo}>
          <HighPriorityImage
            source={{ uri: note.renote.user.avatarUrl || '' }}
            style={styles.renoteAvatar}
          />
          <ThemedText numberOfLines={1}>
            <ThemedText type="defaultSemiBold" style={styles.name}>
              {note.renote?.user.name}
            </ThemedText>
            {'  '}
            <ThemedText style={styles.username}>@{note.renote?.user.username}</ThemedText>
          </ThemedText>
        </View>
        <NoteContent note={note.renote} size="small" />
      </ThemedView>
    );
  };

  const renderReactions = () => {
    return (
      <View style={styles.reactions}>
        {Object.entries(reactions).map(([reaction, count]) => {
          if (count <= 0) return null;

          const customEmoji = note.reactionEmojis?.[reaction.slice(1, -1)];
          const localEmoji = getEmoji(serverInfo?.emojis, reaction.slice(1, -1));

          return (
            <Pressable
              key={reaction}
              style={[
                styles.reactionButton,
                myReaction === reaction && styles.reactionButtonActive,
                customEmoji && {
                  backgroundColor: 'transparent',
                },
              ]}
              disabled={!!customEmoji}
              onPress={() => reactionMutation.mutate(reaction)}
            >
              {customEmoji || localEmoji ? (
                <AutoResizingImage uri={customEmoji || localEmoji || ''} height={20} />
              ) : (
                <ThemedText>{reaction}</ThemedText>
              )}
              <ThemedText style={styles.reactionCount}>{count}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderRenoteHeader = () => {
    if (!note.renote || note.text) return null;
    return (
      <View style={styles.renoteHeaderContainer}>
        <Ionicons name="repeat-outline" size={16} color="#666" />
        <ThemedText style={styles.renoteHeaderText}>{note.user.name} 已转贴</ThemedText>
      </View>
    );
  };

  return (
    <ThemedView
      style={[
        {
          paddingTop: 8,
          borderBottomWidth: 1,
          borderBottomColor: colorScheme === 'dark' ? '#111' : '#eee',
        },
      ]}
    >
      {renderRenoteHeader()}
      <View style={styles.noteContainer}>
        <HighPriorityImage
          source={{ uri: note.text ? note.user.avatarUrl : note.renote?.user.avatarUrl || '' }}
          style={styles.avatar}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <ThemedText numberOfLines={1}>
                <ThemedText type="defaultSemiBold" style={styles.name}>
                  {note.text ? note.user.name : note.renote?.user.name}
                </ThemedText>
                {'  '}
                <ThemedText style={styles.username}>
                  @{note.text ? note.user.username : note.renote?.user.username}
                </ThemedText>
              </ThemedText>
            </View>
            <ThemedText style={styles.time}>
              {formatDistanceToNow(new Date(note.createdAt), { locale: zhCN, addSuffix: true })}
            </ThemedText>
          </View>

          <NoteContent note={note} />
          {note.text && renderRenote()}

          <View style={reactions.length > 0 && styles.reactionsContainer}>{renderReactions()}</View>

          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={onReply}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleRenote}>
              <Ionicons name="repeat-outline" size={20} color="#666" />
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => setShowReactionPicker(true)}>
              <Ionicons name="add-outline" size={20} color="#666" />
            </Pressable>
          </View>
          <ReactionPicker
            isVisible={showReactionPicker}
            onClose={() => setShowReactionPicker(false)}
            onEmojiSelect={handleReactionSelect}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  noteContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 2,
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
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 48,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  renoteContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  renoteUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  renoteAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  renoteName: {
    fontSize: 13,
  },
  renoteUsername: {
    fontSize: 13,
    color: '#666',
  },
  renoteText: {
    fontSize: 13,
    lineHeight: 18,
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
  renoteHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingLeft: 52,
  },
  renoteHeaderText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
});
