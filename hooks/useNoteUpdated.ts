import { useMisskeyStream } from '@/lib/api';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import type { Note as NoteType } from 'misskey-js/built/entities';
import { NoteUpdatedEvent } from 'misskey-js/built/streaming.types';
import { useEffect } from 'react';

type NoteUpdatedProps = {
  queryKey: string[];
  note: NoteType;
  onDeleted?: () => void;
  onReacted?: (reaction: string, userId: string, emoji?: { name: string; url: string }) => void;
  onUnreacted?: (reaction: string, userId: string) => void;
  onPollVoted?: () => void;
};

export const useNoteUpdated = ({
  queryKey,
  note,
  onDeleted,
  onReacted,
  onUnreacted,
  onPollVoted,
}: NoteUpdatedProps) => {
  const queryClient = useQueryClient();
  const stream = useMisskeyStream();

  useEffect(() => {
    const onStreamNoteUpdated = (noteData: NoteUpdatedEvent) => {
      const { type, id, body } = noteData;

      if (id !== note.id) return;

      switch (type) {
        case 'deleted': {
          queryClient.setQueryData([queryKey], (oldData: InfiniteData<NoteType[]>) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => page.filter((n) => n.id !== note.id)),
            };
          });
          onDeleted?.();
          break;
        }
        case 'reacted': {
          const reaction = body.reaction;
          // type assertion to avoid type error, the type is not completely defined in misskey-js
          const emoji = body.emoji as unknown as {
            name: string;
            url: string;
          };

          onReacted?.(reaction, body.userId, emoji);
          break;
        }
        case 'unreacted': {
          const reaction = body.reaction;
          onUnreacted?.(reaction, body.userId);
          break;
        }
        case 'pollVoted': {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
          onPollVoted?.();
          break;
        }
      }
    };

    stream.send('s', { id: note.id });
    stream.on('noteUpdated', onStreamNoteUpdated);

    return () => {
      stream.send('un', { id: note.id });
      stream.off('noteUpdated', onStreamNoteUpdated);
    };
  }, [stream, queryKey, note.id, onDeleted, onReacted, onUnreacted, onPollVoted, queryClient]);
};
