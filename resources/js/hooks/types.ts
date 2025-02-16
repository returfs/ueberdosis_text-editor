import { TiptapCollabProvider } from '@hocuspocus/provider';
import { Editor } from '@tiptap/core';
import { Doc } from 'yjs';

declare global {
  interface Window {
    editor: Editor | null;
  }
}

export interface UseBlockEditorProps {
  ydoc: Doc;
  provider?: TiptapCollabProvider | null | undefined;
}
