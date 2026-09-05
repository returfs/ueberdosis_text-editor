import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import { CircleNotch } from '@phosphor-icons/react';
import { Button, useT } from '@returfs/shared-external-react';
import { useMemo } from 'react';
import type { RichDocumentType } from '../document-types';
import { SourceView } from './SourceView';

/**
 * Read-only view of an opened document.
 *
 * It renders through the SAME schema the editor uses, deliberately: a viewer
 * with its own reduced set of nodes would show a document one way and then
 * shift it the moment you pressed Edit. What it drops is everything that makes
 * the editor an editor — the collaboration session, the bubble menus, the drag
 * handles, the caret — so opening a file to read it costs a GET rather than a
 * websocket and a Yjs room.
 */
export function ViewerSurface({
  documentType,
  text,
  document,
  source,
}: {
  documentType: RichDocumentType;
  /** The file's own bytes. Null while a handed-down document is being shown. */
  text: string | null;
  /**
   * The document to render, when we already have one — set on the way back
   * from editing, so the view shows what was just typed rather than re-reading
   * a file the sync server may not have written yet.
   */
  document?: JSONContent | null;
  /** Show the markdown behind the document instead of the document. */
  source: boolean;
}) {
  const content = useMemo(
    () => document ?? documentType.toDoc(text ?? ''),
    [document, documentType, text],
  );

  const editor = useEditor(
    {
      editable: false,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      extensions: documentType.extensions(),
      content,
      editorProps: {
        attributes: { class: 'min-h-full' },
      },
    },
    [content],
  );

  if (source) {
    return <SourceView value={text ?? ''} readOnly />;
  }

  if (!editor) {
    return (
      <div className="flex h-full w-full items-center justify-center text-neutral-500 dark:text-neutral-400">
        <CircleNotch size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      <EditorContent className="flex-1" editor={editor} />
    </div>
  );
}

/** The states a document can be in before there is anything to render. */
export function ViewerNotice({
  message,
  onRetry,
  spinning = false,
}: {
  message: string;
  onRetry?: () => void;
  spinning?: boolean;
}) {
  const t = useT('ext:text-editor');

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
      {spinning && <CircleNotch size={24} className="animate-spin" />}
      <span>{message}</span>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          {t('viewer.retry')}
        </Button>
      )}
    </div>
  );
}
