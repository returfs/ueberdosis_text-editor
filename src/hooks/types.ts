import { HocuspocusProvider } from '@hocuspocus/provider';
import { ResourceUser } from '@returfs/shared-external-react';
import { Editor } from '@tiptap/core';
import { Doc } from 'yjs';
import type { RichDocumentType } from '@/document-types';

declare global {
  interface Window {
    editor: Editor | null;
  }
}

export interface UseBlockEditorProps {
  doc: Doc;
  provider?: HocuspocusProvider;
  resourceUser?: ResourceUser;
  /** Active document type — its `extensions()` define the editor schema. */
  documentType: RichDocumentType;
}
