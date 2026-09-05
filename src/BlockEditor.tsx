import { HocuspocusProvider } from '@hocuspocus/provider';
import {
  Button,
  EntranceHeader,
  SaveStatus,
  useExtensionMenuBar,
  useT,
  useUnsavedWork,
  type HeaderNode,
} from '@returfs/shared-external-react';
import { EditorContent, Editor } from '@tiptap/react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Doc } from 'yjs';
import { ReconciliationDialog } from './components/ReconciliationDialog';
import { ContentItemMenu } from './components/menus/ContentItemMenu';
import { useEditorMenuBarMenus } from './components/menus/HeaderMenu/useEditorMenuBarMenus';
import { useHeaderMenuNodes } from './components/menus/HeaderMenu/useHeaderMenuNodes';
import { manifest } from './manifest';
import CollabRelayEditor from './CollabRelayEditor';
import LinkMenu from './components/menus/LinkMenu/LinkMenu';
import { ColumnsMenu } from './components/menus/MultiColumn/menus';
import ImageBlockMenu from './extensions/ImageBlock/components/ImageBlockMenu';
import { TableColumnMenu, TableRowMenu } from './extensions/Table/menus';
import { richDocumentTypeFor, type RichDocumentType } from './document-types';
import { useBlockEditor } from './hooks/useBlockEditor';
import { useReconciliation } from './hooks/useReconciliation';
import { useSaveStatus } from './hooks/useSaveStatus';
import { SourceView } from './surfaces/SourceView';
import { useModeNodes, useSourceMode } from './surfaces/editorMode';
import { BlockEditorProps } from './types';

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
  bridge,
  onDone,
  onRequestReload,
}: BlockEditorInstanceProps) {
  const t = useT('ext:text-editor');
  const resourceId = resourceItem?.id;

  // Which kind of document this file is, decided by its extension. It selects
  // the editor's export format, the sync server's flatten/hydrate and the rich
  // sidecar, so every mode below has to read it from the same place.
  const documentType = richDocumentTypeFor(resourceItem?.extension);

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
    'https://project.test';

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

  // MODE (Phase 4E). E2EE files cannot ride Hocuspocus (the sync server only
  // handles plaintext), so the token mint answers `{e2ee: true}` instead of a
  // token and we switch to the bridge-backed local editor. Standalone dev
  // (no collabTokenUrl) is always collab.
  const [mode, setMode] = useState<'probing' | 'collab' | 'e2ee'>(
    collabTokenUrl ? 'probing' : 'collab',
  );

  useEffect(() => {
    if (!collabTokenUrl || !resourceId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(collabTokenUrl, {
          method: 'POST',
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        const isE2ee = Boolean(json?.data?.e2ee ?? json?.e2ee);
        if (!cancelled) setMode(isE2ee ? 'e2ee' : 'collab');
      } catch {
        // Probe is best-effort; the collab path has its own failure UX.
        if (!cancelled) setMode('collab');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [collabTokenUrl, resourceId]);

  // Gate the editor on the FIRST sync: mount Tiptap only after the provider has
  // synced so it binds to an already-populated Yjs doc. Mounting on an empty doc
  // makes the Collaboration extension seed an empty paragraph that then MERGES
  // with the incoming server state (stray blank line / duplicated content on
  // reopen). If sync never completes we show a Retry error, never mount empty.
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!resourceId || mode !== 'collab') return;

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
  }, [resourceId, getToken, mode]);

  if (!resourceId) {
    return null;
  }

  if (mode === 'probing') {
    return <EditorNotice message={t('editor.loading')} />;
  }

  if (mode === 'e2ee') {
    if (!bridge) {
      return <EditorNotice message={t('viewer.encryptedNeedsApp')} />;
    }

    // Phase 5A: hosts that offer the sealed relay get real-time collab for
    // e2ee documents; CollabRelayEditor degrades to LocalEditor when the
    // relay is unavailable or refuses the join.
    return (
      <CollabRelayEditor
        resourceItem={resourceItem}
        resourceUser={resourceUser}
        bridge={bridge}
        documentType={documentType}
        onDone={onDone}
        onRequestReload={onRequestReload}
      />
    );
  }

  if (!conn) {
    return <EditorNotice message={t('editor.loading')} />;
  }

  if (!ready && failed) {
    return (
      <EditorNotice
        message={t('editor.connectFailed')}
        onRetry={onRequestReload}
      />
    );
  }

  if (!ready) {
    return <EditorNotice message={t('editor.loading')} />;
  }

  return (
    <EditorSurface
      doc={conn.doc}
      provider={conn.provider}
      resourceItem={resourceItem}
      resourceUser={resourceUser}
      getToken={getToken}
      resourceRoute={resourceRoute}
      documentType={documentType}
      onDone={onDone}
      onRequestReload={onRequestReload}
    />
  );
}

/** A centred message, optionally with a way out of whatever went wrong. */
function EditorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const t = useT('ext:text-editor');

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-neutral-400">
      <span>{message}</span>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          {t('editor.retry')}
        </Button>
      )}
    </div>
  );
}

/**
 * Header bar, split into its own component so the declarative-menu hook
 * (`useHeaderMenuNodes`, which reads editor state) only runs once a non-null
 * editor exists — keeping it out of `EditorSurface`'s pre-guard hook order.
 */
const EditorHeader = memo(function EditorHeader({
  editor,
  fullname,
  fileBaseName,
  saveState,
  modeNodes,
}: {
  editor: Editor;
  fullname: string;
  fileBaseName: string;
  saveState: ReturnType<typeof useSaveStatus>;
  modeNodes: HeaderNode[];
}) {
  const t = useT('ext:text-editor');
  const menu = useHeaderMenuNodes(editor);
  const menus = useEditorMenuBarMenus(editor, fileBaseName);
  // returfs owns the App menu (name + About); the extension fills File/Edit/View.
  const { menubar, aboutDialog } = useExtensionMenuBar({ manifest, menus });
  return (
    <>
      <EntranceHeader
        fullname={fullname}
        menubar={menubar}
        // Done and the source toggle lead, so they are the last things to
        // collapse into the overflow menu as the formatting toolbar grows.
        menu={[...modeNodes, ...menu]}
        end={
          // Collab semantics: an error here is the connection, not a write.
          <SaveStatus
            state={saveState}
            labels={{ error: t('editor.connectionError') }}
          />
        }
      />
      {aboutDialog}
    </>
  );
});

interface EditorSurfaceProps extends BlockEditorInstanceProps {
  doc: Doc;
  provider: HocuspocusProvider;
  /** Async auth-token getter (collab token in prod, dev rfsk_ key standalone). */
  getToken: () => Promise<string>;
  /** Absolute resource route the client reconciliation calls (collab/dev). */
  resourceRoute: string;
  /** The kind of document this file is (see documentTypeFor). */
  documentType: RichDocumentType;
}

function EditorSurface({
  doc,
  provider,
  resourceItem,
  resourceUser,
  getToken,
  resourceRoute,
  documentType,
  onDone,
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
    documentType,
    editor,
    doc,
    onReload: onRequestReload,
  });

  const saveState = useSaveStatus(provider);

  const sourceMode = useSourceMode(documentType, editor);
  const { close: closeSource } = sourceMode;

  const done = useCallback(() => {
    // Apply a pending source edit before leaving, or the view would render the
    // document as it was before the user typed into the textarea.
    closeSource();
    if (editor && onDone)
      onDone({
        document: editor.getJSON(),
        plain: documentType.fromDoc(editor),
      });
  }, [closeSource, documentType, editor, onDone]);

  const modeNodes = useModeNodes({
    sourceMode,
    onDone: onDone && done,
  });

  // Keep the app from closing on edits the collaboration server has not
  // acknowledged yet ("Warn before leaving").
  useUnsavedWork(`text-editor:${resourceItem?.id ?? 'document'}`, saveState);

  if (!editor) {
    return null;
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      ref={menuContainerRef}
    >
      <EditorHeader
        editor={editor}
        fullname={`${resourceItem?.name}.${resourceItem?.extension}`}
        fileBaseName={resourceItem?.name ?? 'document'}
        saveState={saveState}
        modeNodes={modeNodes}
      />

      {/* The ONLY scroll area. The header above is a flex sibling (outside this
          container) so it stays fixed. The surface itself is h-full + overflow
          -hidden, so it fits the portal exactly and the host no longer adds a
          second scrollbar — only this inner area scrolls. flex-1 keeps the
          editor filling the height so the empty area stays clickable. */}
      {sourceMode.active ? (
        <SourceView
          value={sourceMode.draft ?? ''}
          onChange={sourceMode.setDraft}
        />
      ) : (
        <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
          <EditorContent className="flex-1" editor={editor} />
          <ContentItemMenu editor={editor} />
          <LinkMenu editor={editor} appendTo={menuContainerRef} />
          <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
          <TableRowMenu editor={editor} appendTo={menuContainerRef} />
          <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
          <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
        </div>
      )}

      <ReconciliationDialog
        open={externalChange}
        busy={busy}
        onKeepMine={keepMine}
        onReloadExternal={reloadExternal}
      />
    </div>
  );
}
