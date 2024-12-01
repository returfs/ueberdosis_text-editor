import { useEditor } from '@tiptap/react';
import type { AnyExtension, Editor } from '@tiptap/core';

import ExtensionKit from '@/extensions/extension-kit';
import { initialContent } from '@/lib/data/initialContent';

declare global {
  interface Window {
    editor: Editor | null;
  }
}

export const useBlockEditor = (content: string) => {
  const editor = useEditor(
    {
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      autofocus: true,
      onCreate: ctx => {
        if (ctx.editor.isEmpty) {
          ctx.editor.commands.setContent(content);
          ctx.editor.commands.focus('start', { scrollIntoView: true });
        }
      },
      extensions: [...ExtensionKit()].filter(
        (e): e is AnyExtension => e !== undefined,
      ),
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
