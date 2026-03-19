import { useEditor } from '@tiptap/react';
import type { AnyExtension } from '@tiptap/core';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import ExtensionKit from '@/extensions/extension-kit';
import { UseBlockEditorProps } from './types';

export const useBlockEditor = ({
  doc,
  provider,
  resourceUser,
}: UseBlockEditorProps) => {
  const editor = useEditor(
    {
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      autofocus: true,
      onCreate: ctx => {
        if (ctx.editor.isEmpty) {
          ctx.editor.commands.focus('start', { scrollIntoView: true });
        }
      },
      extensions: [
        ...ExtensionKit(),
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

  window.editor = editor;

  return { editor };
};
