import { useEditor } from '@tiptap/react';
import type { AnyExtension } from '@tiptap/core';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useEffect } from 'react';
import { UseBlockEditorProps } from './types';

export const useBlockEditor = ({
  doc,
  provider,
  resourceUser,
  documentType,
}: UseBlockEditorProps) => {
  const editor = useEditor(
    {
      // MUST be false with the Collaboration extension: rendering an empty doc
      // immediately and then hydrating from Yjs races, leaving stray empty
      // paragraphs above the synced content. Let Yjs be the source of truth.
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      autofocus: true,
      onCreate: ctx => {
        if (ctx.editor.isEmpty) {
          ctx.editor.commands.focus('start', { scrollIntoView: true });
        }
      },
      extensions: [
        ...documentType.extensions(),
        provider
          ? Collaboration.configure({
              document: doc,
            })
          : undefined,
        provider
          ? CollaborationCursor.configure({
              provider,
              user: {
                name: resourceUser?.name,
                // color: resourceUser?.color,
              },
            })
          : undefined,
      ].filter((e): e is AnyExtension => e !== undefined),
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class: 'min-h-full',
        },
      },
    },
    [],
  );

  // Debug handle. Clear it on unmount so we don't pin a destroyed editor (and
  // its document/state) in memory for the lifetime of the page.
  window.editor = editor;
  useEffect(() => {
    return () => {
      window.editor = null;
    };
  }, []);

  return { editor };
};
