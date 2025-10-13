import { HocuspocusProvider } from '@hocuspocus/provider';
import { ResourceUser } from '@returfs/shared-external-react';
import { Editor } from '@tiptap/core';
import { Doc } from 'yjs';

declare global {
  interface Window {
    editor: Editor | null;
  }
}

export interface UseBlockEditorProps {
  doc: Doc;
  provider?: HocuspocusProvider;
  resourceUser?: ResourceUser;
}
