import { useMisskeyStream } from '@/lib/api';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import type { Note as NoteType } from 'misskey-js/built/entities';
import { NoteUpdatedEvent } from 'misskey-js/built/streaming.types';
import { useEffect } from 'react';

type NoteUpdatedProps = {
  endpoint: string;
  note: NoteType;
  onDeleted?: () => void;
  onReacted?: (reaction: string) => void;
  onUnreacted?: (reaction: string) => void;
  onPollVoted?: () => void;
};

export const useNoteUpdated = ({
  endpoint,
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

      console.log('noteData', noteData);

      switch (type) {
        case 'deleted': {
          queryClient.setQueryData([endpoint], (oldData: InfiniteData<NoteType[]>) => {
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
          onReacted?.(reaction);
          break;
        }
        case 'unreacted': {
          const reaction = body.reaction;
          onUnreacted?.(reaction);
          break;
        }
        case 'pollVoted': {
          queryClient.invalidateQueries({ queryKey: [endpoint] });
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
  }, [stream, endpoint, note.id, onDeleted, onReacted, onUnreacted, onPollVoted, queryClient]);
};
