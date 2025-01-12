import { Colors } from '@/constants/Colors';
import { useNoteUpdated } from '@/hooks/useNoteUpdated';
import { useMisskeyApi } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getEmoji } from '@/lib/utils/emojis';
import { isAndroid } from '@/lib/utils/platform';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Image, useImage } from 'expo-image';
import _ from 'lodash';
import type { Note as NoteType } from 'misskey-js/built/entities';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ImageStyle,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import AutoResizingImage from './AutoResizingImage';
import ImageLayoutGrid from './ImageView/ImageLayoutGrid';
import { Mfm } from './Mfm';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface NoteProps {
  note: NoteType;
  onReply?: () => void;
  endpoint: string;
}

const UserAvatar = ({ avatarUrl, style }: { avatarUrl: string; style?: StyleProp<ImageStyle> }) => {
  const image = useImage(avatarUrl, {
    onError: (error) => {
      console.log(error);
    },
  });

  return (
    <Image
      source={{ uri: avatarUrl || '' }}
      style={[style, !image && { backgroundColor: Colors.common.loadingBg }]}
      transition={200}
    />
  );
};

const ReactionViewer = ({
  note,
  onReaction,
  disabled,
}: {
  note: NoteType;
  onReaction: (reaction: string) => void;
  disabled?: boolean;
}) => {
  const { serverInfo } = useAuth();
  const { reactions, myReaction } = note;
  const [showAll, setShowAll] = useState(false);
  const colorScheme = useColorScheme();

  const sortedReactions = React.useMemo(() => {
    const sorted = Object.entries(reactions)
      .filter(([, count]) => count > 0)
      .sort(([, countA], [, countB]) => countB - countA);

    return showAll ? sorted : sorted.slice(0, 10);
  }, [reactions, showAll]);

  const debouncedReaction = React.useCallback(
    _.debounce((reaction: string) => {
      onReaction(reaction);
    }, 300),
    [onReaction],
  );

  return (
    <View style={styles.reactions}>
      {sortedReactions.map(([reaction, count]) => {
        const customEmoji = note.reactionEmojis?.[reaction.slice(1, -1)];
        const localEmoji = getEmoji(serverInfo?.emojis, reaction.slice(1, -1).replace('@.', ''));

        const isCustomEmoji = !localEmoji && !!customEmoji;

        return (
          <Pressable
            key={reaction}
            style={[
              styles.reactionButton,
              {
                backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
              },
              isCustomEmoji && {
                backgroundColor: 'transparent',
              },
              myReaction === reaction && {
                backgroundColor: Colors.common.accentedBg,
                borderColor: Colors.common.accent,
              },
            ]}
            disabled={disabled || isCustomEmoji}
            onPress={() => debouncedReaction(reaction)}
          >
            {customEmoji || localEmoji ? (
              <AutoResizingImage source={{ uri: localEmoji ?? customEmoji }} height={20} />
            ) : (
              <ThemedText>{reaction}</ThemedText>
            )}
            <Text
              style={[styles.reactionCount, { color: colorScheme === 'dark' ? '#999' : '#666' }]}
            >
              {count}
            </Text>
          </Pressable>
        );
      })}
      {Object.keys(reactions).length > 10 && (
        <Pressable
          style={[styles.reactionButton, styles.expandButton]}
          onPress={() => setShowAll(!showAll)}
        >
          <ThemedText style={styles.expandButtonText}>
            {showAll ? '收起' : `+${Object.keys(reactions).length - 10}`}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
};

const NoteContent = ({ note, size = 'normal' }: { note: NoteType; size?: 'small' | 'normal' }) => {
  const isRenote = !!note.renote;
  const contentNote = isRenote ? note.renote : note;
  const { serverInfo } = useAuth();
  const emojiUrls = Object.fromEntries(
    Object.entries(serverInfo?.emojis || {}).map(([, emoji]) => [emoji.name, emoji.url]),
  );

  const textStyle = {
    fontSize: size === 'small' ? 13 : 16,
    lineHeight: size === 'small' ? 18 : 24,
  };

  return (
    <>
      {contentNote?.text ? (
        <Mfm
          style={textStyle}
          text={contentNote.text}
          emojiUrls={emojiUrls}
          author={contentNote.user}
        />
      ) : null}
      {contentNote?.files?.length && contentNote.files.length > 0 ? (
        <ImageLayoutGrid
          images={contentNote.files.map((file) => ({
            uri: file.url,
            thumbnailUrl: file.thumbnailUrl,
            width: file.properties.width,
            height: file.properties.height,
            isSensitive: file.isSensitive,
          }))}
          style={{ marginVertical: 8 }}
        />
      ) : null}
    </>
  );
};

const UserHeader = ({ note, showTime = true }: { note: NoteType; showTime?: boolean }) => {
  return (
    <View
      style={[showTime ? styles.header : { flexDirection: 'row', flex: 1, alignItems: 'center' }]}
    >
      <View style={styles.userInfo}>
        <Text
          style={{
            transform: [{ translateY: isAndroid ? -2.5 : 0 }],
            height: 24,
          }}
        >
          <ThemedText type="defaultSemiBold" style={[styles.name]}>
            <Mfm
              text={note.user.name ?? note.user.username}
              author={note.user}
              emojiUrls={note.user.emojis}
              isName
            />
          </ThemedText>
          <ThemedText style={styles.username} numberOfLines={1}>
            @{note.user.username}
          </ThemedText>
        </Text>
      </View>
      {showTime ? (
        <View>
          <ThemedText style={styles.time}>
            {formatDistanceToNow(new Date(note.createdAt), { locale: zhCN, addSuffix: true })}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
};

const NoteRoot = ({
  note,
  onReply,
  endpoint,
  originalNote,
}: NoteProps & { originalNote?: NoteType }) => {
  const { user } = useAuth();
  const [noteData, setNoteData] = useState(note);
  const api = useMisskeyApi();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const { serverInfo } = useAuth();

  useEffect(() => {
    setNoteData(note);
  }, [note]);

  useNoteUpdated({
    endpoint,
    note,
    onReacted: (reaction, userId, emoji) => {
      setNoteData((prev) => ({
        ...prev,
        reactions: {
          ...prev.reactions,
          [reaction]: (prev.reactions[reaction] || 0) + 1,
        },
        reactionEmojis:
          emoji && !getEmoji(serverInfo?.emojis, emoji?.name.slice(1, -1).replace('@.', ''))
            ? { ...prev.reactionEmojis, [emoji.name]: emoji.url }
            : prev.reactionEmojis,
      }));
      if (userId === user?.id) {
        setNoteData((prev) => ({
          ...prev,
          myReaction: reaction,
        }));
      }
    },
    onUnreacted: (reaction, userId) => {
      setNoteData((prev) => ({
        ...prev,
        reactions: {
          ...prev.reactions,
          [reaction]: Math.max((prev.reactions[reaction] || 0) - 1, 0),
        },
      }));
      if (userId === user?.id) {
        setNoteData((prev) => ({
          ...prev,
          myReaction: null,
        }));
      }
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async (reaction: string) => {
      if (noteData.myReaction) {
        await api?.request('notes/reactions/delete', {
          noteId: note.id,
        });
        if (reaction !== noteData.myReaction) {
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
  };

  const renderRenote = () => {
    if (!note.renote) return null;
    return (
      <ThemedView style={styles.renoteContainer}>
        <View style={styles.renoteUserInfo}>
          <UserAvatar avatarUrl={note.renote.user.avatarUrl || ''} style={styles.renoteAvatar} />
          <UserHeader note={note.renote} showTime={false} />
        </View>
        <NoteContent note={note.renote} size="small" />
      </ThemedView>
    );
  };

  const renderRenoteHeader = () => {
    if (!originalNote) return null;
    return (
      <View style={styles.renoteHeaderContainer}>
        <Ionicons name="repeat-outline" size={16} color="#666" />
        <ThemedText style={styles.renoteHeaderText}>
          <Mfm
            text={originalNote.user.name ?? originalNote.user.username}
            author={originalNote.user}
            emojiUrls={originalNote.user.emojis}
            style={styles.renoteHeaderText}
            isName
          />
          已转贴
        </ThemedText>
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
        <UserAvatar avatarUrl={note.user.avatarUrl || ''} style={styles.avatar} />
        <View style={styles.content}>
          <UserHeader note={noteData} />
          <NoteContent note={noteData} />
          {renderRenote()}

          <ReactionViewer
            note={noteData}
            onReaction={handleReactionSelect}
            disabled={reactionMutation.isPending}
          />

          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={onReply}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleRenote}>
              <Ionicons name="repeat-outline" size={20} color="#666" />
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => {}}>
              <Ionicons name="add-outline" size={20} color="#666" />
            </Pressable>
          </View>
        </View>
      </View>
    </ThemedView>
  );
};

export function Note({ note, onReply, endpoint }: NoteProps) {
  const isOnlyRenote = !!note.renote && !note.text;
  const currentNote = isOnlyRenote && note.renote ? note.renote : note;

  return (
    <NoteRoot
      note={currentNote}
      onReply={onReply}
      endpoint={endpoint}
      originalNote={isOnlyRenote ? note : undefined}
    />
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
    marginRight: 8,
    overflow: 'hidden',
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
  reactions: {
    marginTop: 8,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionCount: {
    marginLeft: 4,
    fontSize: 12,
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
  expandButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  expandButtonText: {
    fontSize: 12,
    color: '#666',
  },
});
