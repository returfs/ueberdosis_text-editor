import {
  Button,
  EntranceHeader,
  SaveStatus,
  useExtensionMenuBar,
  useT,
  useUnsavedWork,
  type HeaderNode,
} from '@returfs/shared-external-react';
import type { SaveState } from './hooks/useSaveStatus';
import { EditorContent, Editor, useEditor } from '@tiptap/react';
import Collaboration, { isChangeOrigin } from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Doc, applyUpdate, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';
import { ContentItemMenu } from './components/menus/ContentItemMenu';
import { useEditorMenuBarMenus } from './components/menus/HeaderMenu/useEditorMenuBarMenus';
import { useHeaderMenuNodes } from './components/menus/HeaderMenu/useHeaderMenuNodes';
import { manifest } from './manifest';
import LocalEditor from './LocalEditor';
import LinkMenu from './components/menus/LinkMenu/LinkMenu';
import { ColumnsMenu } from './components/menus/MultiColumn/menus';
import ImageBlockMenu from './extensions/ImageBlock/components/ImageBlockMenu';
import { TableColumnMenu, TableRowMenu } from './extensions/Table/menus';
import type { RichDocumentType } from './document-types';
import { SourceView } from './surfaces/SourceView';
import { useModeNodes, useSourceMode } from './surfaces/editorMode';
import { BlockEditorProps, DocRelayConnection, EditorBridge } from './types';

/** Debounce between the last local keystroke and the encrypted save. */
const SAVE_DEBOUNCE_MS = 800;

/** How long a joiner listens for an existing peer before seeding itself. */
const HELLO_WAIT_MS = 1500;

/** How long a welcomed joiner waits for state before seeding as a fallback. */
const STATE_WAIT_MS = 8000;

/** Yjs transaction origin for changes applied from the relay. */
const RELAY_ORIGIN = 'e2ee-relay';

function u8ToB64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function b64ToU8(encoded: string): Uint8Array {
  return Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
}

function jsonPayload(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

function parseJsonPayload<T>(payload: Uint8Array): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(payload)) as T;
  } catch {
    return null;
  }
}

interface RelaySession {
  doc: Doc;
  awareness: Awareness;
  relay: DocRelayConnection;
  /** True when this peer was first in the room and must seed from the file. */
  seed: boolean;
}

/**
 * COLLAB editing mode for end-to-end encrypted files (Phase 5A).
 *
 * The collaboration server for plaintext documents (Hocuspocus) merges Yjs
 * state server-side, which e2ee forbids. Here the server is a blind relay:
 * peers whisper Yjs updates over a private channel, and the HOST seals every
 * message with the file's own key before it leaves the page — the extension
 * only ever holds plaintext bytes, never a key.
 *
 * Sync protocol (all messages sealed): a joiner announces `hello` with its
 * state vector. A peer that already has the document replies `welcome` and
 * then `state` (the diff against that vector); the joiner applies it before
 * the editor mounts, so Tiptap always binds to a populated doc. If nobody
 * answers, the joiner seeds the Yjs doc from the decrypted file itself. Two
 * simultaneous joiners tie-break on their random peer ids (lowest seeds) so
 * the document is never seeded twice. Live edits ride as incremental
 * `update` messages; cursors as `awareness`.
 *
 * Persistence is unchanged from local mode: the peer that made an edit
 * debounce-saves the full plaintext through the host bridge, which encrypts
 * before storing. Remote edits never trigger a save, so exactly the editing
 * peers write.
 */
export default memo(function CollabRelayEditor({
  resourceItem,
  resourceUser,
  bridge,
  documentType,
  onDone,
  onRequestReload,
}: BlockEditorProps & {
  bridge: EditorBridge;
  documentType: RichDocumentType;
  onRequestReload: () => void;
}) {
  const t = useT('ext:text-editor');
  const [initialText, setInitialText] = useState<string | null>(null);
  const [session, setSession] = useState<RelaySession | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'solo' | 'failed'>(
    'loading',
  );

  useEffect(() => {
    if (!bridge.joinDocRelay) {
      setPhase('solo');
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      let text: string;
      try {
        text = await (await bridge.getResource()).text();
      } catch {
        if (!cancelled) setPhase('failed');
        return;
      }
      if (cancelled) return;
      setInitialText(text);

      // Best-effort rich state (formatting) from the client-encrypted
      // sidecar; the host ignores it unless it matches the plain text.
      let richSeed: Uint8Array | null = null;
      if (bridge.readDocSidecar) {
        try {
          richSeed = await bridge.readDocSidecar(text);
        } catch {
          richSeed = null;
        }
      }
      if (cancelled) return;

      const doc = new Doc();
      const awareness = new Awareness(doc);
      const peerId = crypto.randomUUID();
      const timers: Array<ReturnType<typeof setTimeout>> = [];
      const queuedHellos: Array<{ peer: string; sv: string }> = [];
      let relay: DocRelayConnection | null = null;
      let ready = false;
      let welcomed = false;
      let lowestCompetitor: string | null = null;

      const sendState = (to: string, sv: string) => {
        relay?.send(
          'state',
          jsonPayload({
            peer: peerId,
            to,
            update: u8ToB64(encodeStateAsUpdate(doc, b64ToU8(sv))),
          }),
        );
      };

      const becomeReady = (seed: boolean) => {
        if (ready || cancelled) return;
        ready = true;
        timers.forEach(clearTimeout);

        // Seed from the rich sidecar when it exists: full formatting comes
        // back, and the update broadcasts to any peer that joined mid-seed.
        let seedFromText = seed;
        if (seed && richSeed !== null) {
          applyUpdate(doc, richSeed);
          seedFromText = false;
        }

        for (const hello of queuedHellos) {
          relay?.send('welcome', jsonPayload({ peer: peerId, to: hello.peer }));
          sendState(hello.peer, hello.sv);
        }
        queuedHellos.length = 0;

        setSession({ doc, awareness, relay: relay!, seed: seedFromText });
        setPhase('ready');
      };

      const onMessage = (kind: string, payload: Uint8Array) => {
        if (cancelled) return;

        if (kind === 'update') {
          applyUpdate(doc, payload, RELAY_ORIGIN);
          return;
        }

        if (kind === 'awareness') {
          applyAwarenessUpdate(awareness, payload, RELAY_ORIGIN);
          return;
        }

        if (kind === 'hello') {
          const hello = parseJsonPayload<{ peer: string; sv: string }>(payload);
          if (!hello || hello.peer === peerId) return;

          if (ready) {
            relay?.send(
              'welcome',
              jsonPayload({ peer: peerId, to: hello.peer }),
            );
            sendState(hello.peer, hello.sv);
          } else {
            queuedHellos.push(hello);
            if (lowestCompetitor === null || hello.peer < lowestCompetitor) {
              lowestCompetitor = hello.peer;
            }
          }
          return;
        }

        if (kind === 'welcome') {
          const welcome = parseJsonPayload<{ to: string }>(payload);
          if (welcome?.to === peerId) welcomed = true;
          return;
        }

        if (kind === 'state') {
          const state = parseJsonPayload<{ to?: string; update: string }>(
            payload,
          );
          if (!state) return;
          // Apply regardless of the target: state is just document history
          // and applying it is idempotent, which helps convergence.
          applyUpdate(doc, b64ToU8(state.update), RELAY_ORIGIN);
          if (!ready && state.to === peerId) becomeReady(false);
        }
      };

      try {
        relay = await bridge.joinDocRelay!({ onMessage });
      } catch {
        // No relay (locked vault, refused channel, older host): degrade to
        // solo editing, which is exactly the Phase 4E behavior.
        doc.destroy();
        if (!cancelled) setPhase('solo');
        return;
      }

      if (cancelled) {
        relay.leave();
        doc.destroy();
        return;
      }

      // Broadcast every local doc change. Attached before the editor mounts
      // so even the seeding transaction reaches peers that join mid-seed.
      doc.on('update', (update: Uint8Array, origin: unknown) => {
        if (origin !== RELAY_ORIGIN) relay?.send('update', update);
      });

      awareness.on(
        'update',
        (
          changes: { added: number[]; updated: number[]; removed: number[] },
          origin: unknown,
        ) => {
          if (origin === RELAY_ORIGIN) return;
          const changed = [
            ...changes.added,
            ...changes.updated,
            ...changes.removed,
          ];
          if (changed.length === 0) return;
          relay?.send('awareness', encodeAwarenessUpdate(awareness, changed));
        },
      );

      const hello = () =>
        relay?.send(
          'hello',
          jsonPayload({ peer: peerId, sv: u8ToB64(encodeStateVector(doc)) }),
        );

      hello();

      timers.push(
        setTimeout(() => {
          if (ready || cancelled) return;
          const someoneElseSeeds =
            welcomed ||
            (lowestCompetitor !== null && lowestCompetitor < peerId);

          if (!someoneElseSeeds) {
            becomeReady(true);
            return;
          }

          // Someone has (or will have) the doc: re-ask halfway, and seed
          // anyway if state never arrives, so the editor cannot hang.
          timers.push(setTimeout(hello, STATE_WAIT_MS / 2));
          timers.push(setTimeout(() => becomeReady(true), STATE_WAIT_MS));
        }, HELLO_WAIT_MS),
      );

      cleanup = () => {
        timers.forEach(clearTimeout);
        // Announce departure so peers drop this cursor immediately.
        awareness.setLocalState(null);
        awareness.destroy();
        relay?.leave();
        doc.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [bridge]);

  if (phase === 'solo') {
    return (
      <LocalEditor
        resourceItem={resourceItem}
        resourceUser={resourceUser}
        bridge={bridge}
        documentType={documentType}
        onDone={onDone}
        onRequestReload={onRequestReload}
      />
    );
  }

  if (phase === 'failed') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-neutral-400">
        <span>{t('editor.encryptedFailed')}</span>
        <Button type="button" variant="outline" onClick={onRequestReload}>
          {t('editor.retry')}
        </Button>
      </div>
    );
  }

  if (phase !== 'ready' || session === null || initialText === null) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
        {t('editor.loading')}
      </div>
    );
  }

  return (
    <RelaySurface
      resourceItem={resourceItem}
      resourceUser={resourceUser}
      bridge={bridge}
      session={session}
      documentType={documentType}
      onDone={onDone}
      initialText={initialText}
    />
  );
});

function RelaySurface({
  resourceItem,
  resourceUser,
  bridge,
  session,
  documentType,
  onDone,
  initialText,
}: {
  resourceItem: BlockEditorProps['resourceItem'];
  resourceUser: BlockEditorProps['resourceUser'];
  bridge: EditorBridge;
  session: RelaySession;
  documentType: RichDocumentType;
  onDone?: BlockEditorProps['onDone'];
  initialText: string;
}) {
  const menuContainerRef = useRef(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [others, setOthers] = useState(0);

  // Edits live only in this tab until the debounced save lands, so the app
  // warns before leaving while one is pending.
  useUnsavedWork(`text-editor:${resourceItem?.id ?? 'document'}`, saveState);

  // Serialize saves: a save that starts while one is in flight waits for it,
  // and only the LATEST pending text is written (intermediate states skip).
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const pendingText = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seeding = useRef(false);

  useEffect(() => {
    const { awareness } = session;
    const update = () => setOthers(Math.max(0, awareness.getStates().size - 1));

    update();
    awareness.on('change', update);
    awareness.setLocalStateField('user', {
      name: resourceUser?.name ?? 'Anonymous',
      color:
        (resourceUser as { color?: string } | undefined)?.color ?? '#f59e0b',
    });

    return () => {
      awareness.off('change', update);
    };
  }, [session, resourceUser]);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    autofocus: true,
    extensions: [
      ...documentType.extensions({ history: false }),
      Collaboration.configure({ document: session.doc }),
      CollaborationCursor.configure({
        // The cursor extension only reads `provider.awareness`; ours rides
        // the sealed relay instead of a Hocuspocus socket.
        provider: { awareness: session.awareness } as never,
        user: {
          name: resourceUser?.name ?? 'Anonymous',
          color:
            (resourceUser as { color?: string } | undefined)?.color ??
            '#f59e0b',
        },
      }),
    ],
    onCreate: ({ editor: current }) => {
      if (session.seed && initialText.length > 0 && current.isEmpty) {
        seeding.current = true;
        current.commands.setContent(documentType.toDoc(initialText));
        seeding.current = false;
      }
    },
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: 'min-h-full',
      },
    },
    onUpdate: ({ editor: current, transaction }) => {
      // Remote transactions (and the seed, which mirrors the stored file)
      // must not save: exactly the peer that typed writes the file.
      if (seeding.current || isChangeOrigin(transaction)) return;

      pendingText.current = documentType.fromDoc(current);
      setSaveState('saving');

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        saveChain.current = saveChain.current.then(async () => {
          const text = pendingText.current;
          if (text === null) return;
          pendingText.current = null;

          try {
            await bridge.updateResource(
              new File(
                [text],
                `${resourceItem?.name ?? 'document'}.${documentType.exportExtension}`,
                { type: documentType.mimeType },
              ),
            );

            // Rich state follows the plain save (hash-bound to it), so
            // formatting survives reopens. Best effort: a miss only costs
            // formatting, never content.
            if (bridge.writeDocSidecar) {
              void bridge
                .writeDocSidecar(encodeStateAsUpdate(session.doc), text)
                .catch(() => undefined);
            }

            if (pendingText.current === null) setSaveState('saved');
          } catch {
            setSaveState('error');
          }
        });
      }, SAVE_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

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

  // The header reads editor state, so it waits for one. Every hook above runs
  // regardless — the editor is null only on the first render.
  if (!editor) {
    return null;
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      ref={menuContainerRef}
    >
      <RelayHeader
        editor={editor}
        fullname={`${resourceItem?.name}.${resourceItem?.extension}`}
        fileBaseName={resourceItem?.name ?? 'document'}
        saveState={saveState}
        others={others}
        modeNodes={modeNodes}
      />

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
    </div>
  );
}

const RelayHeader = memo(function RelayHeader({
  editor,
  fullname,
  fileBaseName,
  saveState,
  others,
  modeNodes,
}: {
  editor: Editor;
  fullname: string;
  fileBaseName: string;
  saveState: SaveState;
  others: number;
  modeNodes: HeaderNode[];
}) {
  const t = useT('ext:text-editor');
  const menu = useHeaderMenuNodes(editor);
  const menus = useEditorMenuBarMenus(editor, fileBaseName);
  const { menubar, aboutDialog } = useExtensionMenuBar({ manifest, menus });

  return (
    <>
      <EntranceHeader
        fullname={`${fullname} · ${t('editor.encryptedLabel')}`}
        menubar={menubar}
        menu={[...modeNodes, ...menu]}
        end={
          <div className="flex items-center gap-3">
            {others > 0 && (
              <span className="text-xs text-neutral-400">
                {t('editor.othersOnline', { count: others })}
              </span>
            )}
            <SaveStatus
              state={saveState}
              labels={{ error: t('editor.saveFailed') }}
            />
          </div>
        }
      />
      {aboutDialog}
    </>
  );
});
