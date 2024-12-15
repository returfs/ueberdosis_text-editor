import { useEditor } from '@tiptap/react';
import type { AnyExtension, Editor } from '@tiptap/core';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import ExtensionKit from '@/extensions/extension-kit';

declare global {
  interface Window {
    editor: Editor | null;
  }
}

export const useBlockEditor = (
  content: string | null,
  onUpdate,
  ydoc,
  provider,
) => {
  const editor = useEditor(
    {
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      autofocus: true,
      onCreate: ctx => {
        if (ctx.editor.isEmpty) {
          //   ctx.editor.commands.setContent(content);
          ctx.editor.commands.focus('start', { scrollIntoView: true });
        }
      },
      extensions: [
        ...ExtensionKit({ provider }),
        provider
          ? Collaboration.configure({
              document: ydoc,
            })
          : undefined,
        provider
          ? CollaborationCursor.configure({
              provider,
              user: {
                name: 'badasukerubin',
                color: '#fb7185',
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
      onUpdate: ({ editor }) => {
        const content = editor.getHTML();
        // console.log('content', content);
        // onUpdate();
      },
    },
    [content],
  );

  window.editor = editor;

  return { editor };
};
