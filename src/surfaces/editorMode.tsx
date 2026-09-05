import { Article, Check, CodeSimple } from '@phosphor-icons/react';
import { type HeaderNode, useT } from '@returfs/shared-external-react';
import type { Editor } from '@tiptap/react';
import { useCallback, useMemo, useState } from 'react';
import type { RichDocumentType } from '../document-types';

/**
 * The two controls every editing mode shares: leaving the editor, and — for
 * markdown — dropping to the source.
 *
 * There are three editing modes (collaborative, encrypted-relay, encrypted-
 * solo), each with its own header because each has its own save semantics.
 * Their mode controls behave identically, so they live here once.
 */
export function useSourceMode(
  documentType: RichDocumentType,
  editor: Editor | null,
) {
  /** The markdown being edited by hand. Null means the rich editor is up. */
  const [draft, setDraft] = useState<string | null>(null);

  const isMarkdown = documentType.id === 'markdown';

  const open = useCallback(() => {
    // Re-reading the editor while the textarea is already open would throw the
    // hand edits away.
    if (!editor || draft !== null) return;
    setDraft(documentType.fromDoc(editor));
  }, [documentType, draft, editor]);

  const close = useCallback(() => {
    // Applying the source as one replacement is what lets a hand edit reach the
    // file at all: what gets saved is the document, not the textarea. In a
    // collaborative session this lands as a single large change, so it is
    // applied on the way back rather than on every keystroke.
    //
    // Deliberately NOT inside a `setDraft` updater: React may run an updater
    // twice, and this one edits the document.
    if (draft !== null && editor) {
      editor.commands.setContent(documentType.toDoc(draft));
    }

    setDraft(null);
  }, [documentType, draft, editor]);

  return {
    isMarkdown,
    draft,
    setDraft,
    open,
    close,
    active: draft !== null,
  };
}

export type SourceMode = ReturnType<typeof useSourceMode>;

/**
 * Header nodes for those controls, meant to sit in front of the editor's own
 * formatting toolbar. Declared first so they are the last to collapse into the
 * overflow menu: leaving is the one action that must always be reachable.
 */
export function useModeNodes({
  sourceMode,
  onDone,
}: {
  sourceMode: SourceMode;
  onDone?: () => void;
}): HeaderNode[] {
  const t = useT('ext:text-editor');
  const { isMarkdown, active, open, close } = sourceMode;

  return useMemo(() => {
    const nodes: HeaderNode[] = [];

    if (onDone) {
      nodes.push({
        type: 'action',
        id: 'done',
        label: t('mode.done'),
        icon: <Check className="size-4" />,
        pinned: true,
        display: 'both',
        onSelect: onDone,
      });
    }

    if (isMarkdown) {
      nodes.push(
        {
          type: 'action',
          id: 'rich',
          label: t('mode.rendered'),
          icon: <Article className="size-4" />,
          pinned: true,
          active: !active,
          onSelect: close,
        },
        {
          type: 'action',
          id: 'source',
          label: t('mode.source'),
          icon: <CodeSimple className="size-4" />,
          pinned: true,
          active,
          onSelect: open,
        },
      );
    }

    return nodes;
    // Depends on the pieces rather than the object: `useSourceMode` returns a
    // fresh one each render, and the headers below this are memoised.
  }, [active, close, isMarkdown, onDone, open, t]);
}
