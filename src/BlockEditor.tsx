import { HocuspocusProvider } from '@hocuspocus/provider';
import { EntranceHeader } from '@returfs/shared-external-react';
import { EditorContent } from '@tiptap/react';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Doc } from 'yjs';
import { ReconciliationDialog } from './components/ReconciliationDialog';
import { ContentItemMenu } from './components/menus/ContentItemMenu';
import { HeaderMenu } from './components/menus/HeaderMenu';
import LinkMenu from './components/menus/LinkMenu/LinkMenu';
import { ColumnsMenu } from './components/menus/MultiColumn/menus';
import ImageBlockMenu from './extensions/ImageBlock/components/ImageBlockMenu';
import { TableColumnMenu, TableRowMenu } from './extensions/Table/menus';
import { DEFAULT_DOCUMENT_TYPE } from './document-types';
import { useBlockEditor } from './hooks/useBlockEditor';
import { useReconciliation } from './hooks/useReconciliation';
import { BlockEditorProps } from './types';

// The document type this package operates as. The form-builder package (a
// separate package replicating this one) swaps this single descriptor; the
// editor core below stays generic.
const documentType = DEFAULT_DOCUMENT_TYPE;

/**
 * Thin wrapper that owns the reload nonce. "Reload external changes" bumps it,
 * which remounts the inner instance (via `key`) so the Yjs doc, provider and
 * Tiptap editor are all recreated and re-seed from the externally edited plain
 * file. Keeping this in a wrapper avoids the stale-doc problem of swapping the
 * doc under a long-lived `useEditor`.
 */
export default memo(function BlockEditor(props: BlockEditorProps) {
  const [reloadNonce, setReloadNonce] = useState(0);

  return (
    <BlockEditorInstance
      key={reloadNonce}
      {...props}
      onRequestReload={() => setReloadNonce(n => n + 1)}
    />
  );
});

interface BlockEditorInstanceProps extends BlockEditorProps {
  onRequestReload: () => void;
}

function BlockEditorInstance({
  resourceItem,
  resourceUser,
  onRequestReload,
}: BlockEditorInstanceProps) {
  const menuContainerRef = useRef(null);

  const doc = useMemo(() => new Doc(), []);

  // Get API key for developer mode authentication
  const apiKey = import.meta.env.VITE_RETURFS_API_KEY;

  const provider = useMemo(() => {
    if (!resourceItem?.id || !resourceItem?.route) {
      return null;
    }
    return new HocuspocusProvider({
      url: import.meta.env.VITE_HOCUSPOCUS_URL,
      name: resourceItem.id,
      document: doc,
      // No forceSyncInterval: it forces a full sync 5×/sec forever (constant
      // CPU even while idle — spins the fan). Yjs already syncs on changes.
      token: 'test-token',
      parameters: {
        resourceRoute: resourceItem.route,
        resourceUpdateRoute: resourceItem.updateRoute,
        apiKey: apiKey || '',
        documentType: documentType.id,
      },
    });
  }, [
    doc,
    resourceItem?.id,
    resourceItem?.route,
    resourceItem?.updateRoute,
    apiKey,
  ]);

  // Disconnect + free resources when this instance unmounts (e.g. on reload
  // remount or closing the tab). Destroy the provider first, then the Yjs doc,
  // so observers and the websocket are released and not leaked.
  useEffect(
    () => () => {
      provider?.destroy();
      doc.destroy();
    },
    [provider, doc],
  );

  const { editor } = useBlockEditor({
    doc,
    provider,
    resourceUser,
    documentType,
  });

  const { externalChange, busy, keepMine, reloadExternal } = useReconciliation({
    route: resourceItem?.route,
    updateRoute: resourceItem?.updateRoute,
    apiKey,
    documentType: documentType.id,
    editor,
    doc,
    onReload: onRequestReload,
  });

  if (!editor || !provider) {
    return null;
  }

  return (
    <div
      className="flex h-screen w-full flex-col overflow-y-auto"
      ref={menuContainerRef}
    >
      <EntranceHeader
        fullname={`${resourceItem?.name}.${resourceItem?.extension}`}
      >
        <HeaderMenu editor={editor} />
      </EntranceHeader>

      <div className="relative min-h-screen w-full flex-1 flex-col">
        <EditorContent className="flex-1" editor={editor} />
        <ContentItemMenu editor={editor} />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
        <TableRowMenu editor={editor} appendTo={menuContainerRef} />
        <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
        <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
      </div>

      <ReconciliationDialog
        open={externalChange}
        busy={busy}
        onKeepMine={keepMine}
        onReloadExternal={reloadExternal}
      />
    </div>
  );
}
