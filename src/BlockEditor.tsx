import { HocuspocusProvider } from '@hocuspocus/provider';
import { EntranceHeader } from '@returfs/shared-external-react';
import { EditorContent } from '@tiptap/react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Doc } from 'yjs';
import { ReconciliationDialog } from './components/ReconciliationDialog';
import { SaveStatus } from './components/SaveStatus';
import { ContentItemMenu } from './components/menus/ContentItemMenu';
import { HeaderMenu } from './components/menus/HeaderMenu';
import LinkMenu from './components/menus/LinkMenu/LinkMenu';
import { ColumnsMenu } from './components/menus/MultiColumn/menus';
import ImageBlockMenu from './extensions/ImageBlock/components/ImageBlockMenu';
import { TableColumnMenu, TableRowMenu } from './extensions/Table/menus';
import { DEFAULT_DOCUMENT_TYPE } from './document-types';
import { useBlockEditor } from './hooks/useBlockEditor';
import { useReconciliation } from './hooks/useReconciliation';
import { useSaveStatus } from './hooks/useSaveStatus';
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
 *
 * CRITICAL: the key also includes the resource id. The inner instance's Yjs doc
 * is `useMemo(() => new Doc(), [])` (created once), while its provider is keyed
 * on `resourceItem.id`. If we keyed only on the nonce, switching documents
 * (without unmounting this component) would keep the PREVIOUS file's doc and
 * bind a NEW provider to it — pushing one document's content into another (cross
 * -document contamination) and racing the synced gate. Keying on the id forces a
 * full remount per file so the doc/provider/editor are always in lockstep.
 */
export default memo(function BlockEditor(props: BlockEditorProps) {
  const [reloadNonce, setReloadNonce] = useState(0);

  return (
    <BlockEditorInstance
      key={`${props.resourceItem?.id ?? 'none'}:${reloadNonce}`}
      {...props}
      onRequestReload={() => setReloadNonce(n => n + 1)}
    />
  );
});

interface BlockEditorInstanceProps extends BlockEditorProps {
  onRequestReload: () => void;
}

/**
 * Owns the Yjs doc + Hocuspocus provider, and gates the editor on the FIRST
 * sync. Creating the Tiptap editor only after the provider has synced means it
 * binds to an already-populated Yjs document — instead of binding to an empty
 * one whose default empty paragraph then MERGES with the incoming server state,
 * which is what left a stray blank line above the content on (re)open.
 */
function BlockEditorInstance({
  resourceItem,
  resourceUser,
  onRequestReload,
}: BlockEditorInstanceProps) {
  const resourceId = resourceItem?.id;

  // AUTH (Phase 4). Two paths, decided by whether the host supplied a collab
  // token URL:
  //  - Production (installed/federated): the host passes `collabTokenUrl`. We
  //    POST it (same-origin, the host's BFF adds the user's session cookie) to
  //    mint a short-lived, per-user, per-resource token — no key in the bundle.
  //  - Standalone dev: a developer testing their own extension uses their own
  //    rfsk_ developer key (VITE_RETURFS_API_KEY) as the token.
  // getToken is passed to HocuspocusProvider, which calls it on connect AND
  // reconnect, so an expired token is transparently refreshed.
  const collabTokenUrl = (
    resourceItem as { collabTokenUrl?: string } | undefined
  )?.collabTokenUrl;
  const devApiKey = import.meta.env.VITE_RETURFS_API_KEY as string | undefined;
  const apiBase =
    (import.meta.env.VITE_RETURFS_API_URL as string | undefined) ||
    'http://project.test';

  const getToken = useCallback(async (): Promise<string> => {
    if (collabTokenUrl) {
      const res = await fetch(collabTokenUrl, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error('Failed to obtain collaboration token');
      }
      const json = await res.json();
      const token = json?.data?.token ?? json?.token;
      if (!token) {
        throw new Error('Collaboration token missing in response');
      }
      return token as string;
    }
    return devApiKey ?? '';
  }, [collabTokenUrl, devApiKey]);

  // Resource route the CLIENT (reconciliation) hits directly: the collab API in
  // production, the developer API in standalone dev. The Hocuspocus server builds
  // its OWN routes from the document id — it never trusts a client-supplied one.
  const resourceRoute = collabTokenUrl
    ? `${apiBase}/api/v1/collab/item-instances/${resourceId}/resource`
    : `${apiBase}/api/v1/developer/item-instances/${resourceId}/resource`;

  // The Yjs doc + Hocuspocus provider are created INSIDE the effect below (not
  // useMemo) and held in state, so their lifecycle is tied to that effect's
  // cleanup. This is StrictMode-safe: React 18 dev mounts → unmounts → remounts,
  // and the cleanup calls provider.destroy(). With useMemo the SAME (now dead)
  // provider would be reused on the remount (useMemo isn't recomputed) → a
  // destroyed socket that never syncs → permanent "Couldn't connect". Creating a
  // fresh pair per effect run guarantees the live provider is always connected.
  const [conn, setConn] = useState<{
    doc: Doc;
    provider: HocuspocusProvider;
  } | null>(null);

  // Gate the editor on the FIRST sync: mount Tiptap only after the provider has
  // synced so it binds to an already-populated Yjs doc. Mounting on an empty doc
  // makes the Collaboration extension seed an empty paragraph that then MERGES
  // with the incoming server state (stray blank line / duplicated content on
  // reopen). If sync never completes we show a Retry error, never mount empty.
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!resourceId) return;

    const doc = new Doc();
    const provider = new HocuspocusProvider({
      url: import.meta.env.VITE_HOCUSPOCUS_URL,
      name: resourceId,
      document: doc,
      // No forceSyncInterval: it forces a full sync 5×/sec forever (constant
      // CPU even while idle — spins the fan). Yjs already syncs on changes.
      // token is a function → Hocuspocus refreshes it on each (re)connect.
      token: getToken,
      // Only the document type is sent; auth + route are derived server-side
      // from the verified token (the client can't point us at another resource).
      parameters: {
        documentType: documentType.id,
      },
    });

    setConn({ doc, provider });
    setReady(provider.isSynced);
    setFailed(false);

    const onSynced = () => setReady(true);
    provider.on('synced', onSynced);
    const timeout = setTimeout(() => setFailed(true), 10000);

    return () => {
      clearTimeout(timeout);
      provider.off('synced', onSynced);
      // Destroy the provider first (closes the socket + releases observers),
      // then the Yjs doc. Reset state so a remount rebuilds from scratch.
      provider.destroy();
      doc.destroy();
      setConn(null);
      setReady(false);
    };
  }, [resourceId, getToken]);

  if (!resourceId) {
    return null;
  }

  if (!conn) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-sm text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!ready && failed) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-sm text-neutral-400">
        <span>Couldn’t connect to the collaboration server.</span>
        <button
          type="button"
          onClick={onRequestReload}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-sm text-neutral-400">
        Loading…
      </div>
    );
  }

  return (
    <EditorSurface
      doc={conn.doc}
      provider={conn.provider}
      resourceItem={resourceItem}
      resourceUser={resourceUser}
      getToken={getToken}
      resourceRoute={resourceRoute}
      onRequestReload={onRequestReload}
    />
  );
}

interface EditorSurfaceProps extends BlockEditorInstanceProps {
  doc: Doc;
  provider: HocuspocusProvider;
  /** Async auth-token getter (collab token in prod, dev rfsk_ key standalone). */
  getToken: () => Promise<string>;
  /** Absolute resource route the client reconciliation calls (collab/dev). */
  resourceRoute: string;
}

function EditorSurface({
  doc,
  provider,
  resourceItem,
  resourceUser,
  getToken,
  resourceRoute,
  onRequestReload,
}: EditorSurfaceProps) {
  const menuContainerRef = useRef(null);

  const { editor } = useBlockEditor({
    doc,
    provider,
    resourceUser,
    documentType,
  });

  const { externalChange, busy, keepMine, reloadExternal } = useReconciliation({
    route: resourceRoute,
    updateRoute: resourceRoute,
    getToken,
    documentType: documentType.id,
    editor,
    doc,
    onReload: onRequestReload,
  });

  const saveState = useSaveStatus(provider);

  if (!editor) {
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
        <SaveStatus state={saveState} />
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
