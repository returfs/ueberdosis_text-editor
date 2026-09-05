import { HocuspocusProvider } from '@hocuspocus/provider';
import { keymap } from '@codemirror/view';
import { CheckCircle, X } from '@phosphor-icons/react';
import {
  Button,
  EntranceHeader,
  SaveStatus,
  useExtensionMenuBar,
  useT,
  useUnsavedWork,
  type HeaderNode,
} from '@returfs/shared-external-react';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Doc, UndoManager, type Text as YText } from 'yjs';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { codeDocumentTypeFor } from './document-types';
import type { CodeDocumentType } from './document-types';
import { detectLineEnding } from './lib/codeFile';
import { codeChangeListener, codeExtensions } from './lib/codeSetup';
import { manifest } from './manifest';
import type { SaveState } from './hooks/useSaveStatus';
import { useSaveStatus } from './hooks/useSaveStatus';
import { CodeMirrorView } from './surfaces/CodeSurface';
import type { BlockEditorProps } from './types';

const SAVE_DEBOUNCE_MS = 800;

/** The Yjs field the sync server's `code` type stores the file in. */
const CODE_FIELD = 'codemirror';

/**
 * Editing a source file.
 *
 * The shape mirrors `BlockEditor` — probe for encryption, then either a
 * Hocuspocus room or a local editor writing through the host bridge — but the
 * document is a single shared `Y.Text` holding the file verbatim rather than a
 * ProseMirror tree. Nothing converts, so nothing can come back subtly changed:
 * tabs stay tabs, trailing whitespace survives, and a file that was never
 * touched is written back byte for byte.
 */
export default memo(function CodeEditor(props: BlockEditorProps) {
  const [reloadNonce, setReloadNonce] = useState(0);

  return (
    <CodeEditorInstance
      // Same discipline as BlockEditor: the Yjs doc, the provider and the
      // CodeMirror view are created together and must be replaced together, so
      // switching file (or asking for a reload) remounts all three.
      key={`${props.resourceItem?.id ?? 'none'}:${reloadNonce}`}
      {...props}
      onRequestReload={() => setReloadNonce(nonce => nonce + 1)}
    />
  );
});

interface CodeEditorInstanceProps extends BlockEditorProps {
  onRequestReload: () => void;
}

function CodeEditorInstance({
  resourceItem,
  resourceUser,
  bridge,
  onDone,
  onRequestReload,
}: CodeEditorInstanceProps) {
  const t = useT('ext:text-editor');
  const resourceId = resourceItem?.id;
  const documentType = codeDocumentTypeFor(resourceItem?.extension);

  const collabTokenUrl = (
    resourceItem as { collabTokenUrl?: string } | undefined
  )?.collabTokenUrl;

  const devApiKey = import.meta.env.VITE_RETURFS_API_KEY as string | undefined;

  const getToken = useCallback(async (): Promise<string> => {
    if (!collabTokenUrl) return devApiKey ?? '';

    const response = await fetch(collabTokenUrl, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to obtain collaboration token');

    const json = await response.json();
    const token = json?.data?.token ?? json?.token;
    if (!token) throw new Error('Collaboration token missing in response');

    return token as string;
  }, [collabTokenUrl, devApiKey]);

  // Encrypted files never ride the sync server (it only handles plaintext), so
  // the token mint doubles as the probe for which mode this opens in.
  const [mode, setMode] = useState<'probing' | 'collab' | 'e2ee'>(
    collabTokenUrl ? 'probing' : 'collab',
  );

  useEffect(() => {
    if (!collabTokenUrl || !resourceId) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(collabTokenUrl, {
          method: 'POST',
          headers: { Accept: 'application/json' },
        });
        const json = await response.json();
        const isE2ee = Boolean(json?.data?.e2ee ?? json?.e2ee);
        if (!cancelled) setMode(isE2ee ? 'e2ee' : 'collab');
      } catch {
        // Best-effort: the collab path has its own failure UX.
        if (!cancelled) setMode('collab');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [collabTokenUrl, resourceId]);

  const [conn, setConn] = useState<{
    doc: Doc;
    provider: HocuspocusProvider;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!resourceId || mode !== 'collab') return;

    const doc = new Doc();
    const provider = new HocuspocusProvider({
      url: import.meta.env.VITE_HOCUSPOCUS_URL,
      name: resourceId,
      document: doc,
      token: getToken,
      parameters: { documentType: documentType.id },
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
      provider.destroy();
      doc.destroy();
      setConn(null);
      setReady(false);
    };
  }, [resourceId, getToken, mode, documentType.id]);

  if (!resourceId) return null;

  if (mode === 'probing') {
    return <CodeNotice message={t('editor.loading')} />;
  }

  if (mode === 'e2ee') {
    if (!bridge) {
      return <CodeNotice message={t('viewer.encryptedNeedsApp')} />;
    }

    return (
      <LocalCodeEditor
        resourceItem={resourceItem}
        bridge={bridge}
        documentType={documentType}
        onDone={onDone}
      />
    );
  }

  if (!ready && failed) {
    return (
      <CodeNotice
        message={t('editor.connectFailed')}
        onRetry={onRequestReload}
      />
    );
  }

  if (!conn || !ready) {
    return <CodeNotice message={t('editor.loading')} />;
  }

  return (
    <CollabCodeEditor
      doc={conn.doc}
      provider={conn.provider}
      resourceItem={resourceItem}
      resourceUser={resourceUser}
      documentType={documentType}
      onDone={onDone}
    />
  );
}

/**
 * The collaborative surface.
 *
 * Mounted only after the provider's first sync, so the shared text already
 * holds the file: binding CodeMirror to an empty document would let its initial
 * state merge with the arriving one and duplicate the file's first lines.
 */
function CollabCodeEditor({
  doc,
  provider,
  resourceItem,
  resourceUser,
  documentType,
  onDone,
}: {
  doc: Doc;
  provider: HocuspocusProvider;
  resourceItem: BlockEditorProps['resourceItem'];
  resourceUser: BlockEditorProps['resourceUser'];
  documentType: CodeDocumentType;
  onDone?: BlockEditorProps['onDone'];
}) {
  const saveState = useSaveStatus(provider);

  const text: YText = useMemo(() => doc.getText(CODE_FIELD), [doc]);

  /**
   * Yjs owns undo here. A plain local history would happily revert the other
   * person's typing; an UndoManager scoped to this text only ever takes back
   * changes this client made.
   *
   * It observes the shared text, so it is created once and destroyed on the way
   * out — building it inside the memo below would leave an observer behind
   * every time React discarded a render (which it does, in development, on
   * every mount).
   */
  const undoManager = useMemo(() => new UndoManager(text), [text]);

  useEffect(() => () => undoManager.destroy(), [undoManager]);

  // Who the other people in the room see. An effect, not a render-time write:
  // this reaches across the network to every other client.
  useEffect(() => {
    provider.awareness?.setLocalStateField('user', {
      name: resourceUser?.name ?? 'Anonymous',
      color:
        (resourceUser as { color?: string } | undefined)?.color ?? '#f59e0b',
    });
  }, [provider, resourceUser]);

  const { extensions, initialDoc } = useMemo(() => {
    const initial = text.toString();

    return {
      initialDoc: initial,
      extensions: [
        // Before the base keymap, so undo reaches the Yjs manager rather than
        // the (absent) local history.
        keymap.of(yUndoManagerKeymap),
        ...codeExtensions({
          collab: true,
          lineEnding: detectLineEnding(initial),
        }),
        yCollab(text, provider.awareness, { undoManager }),
      ],
    };
  }, [text, provider, undoManager]);

  const done = useCallback(() => {
    onDone?.({ plain: text.toString() });
  }, [onDone, text]);

  return (
    <CodeChrome
      resourceItem={resourceItem}
      documentType={documentType}
      saveState={saveState}
      onDone={onDone && done}
      connection
    >
      <CodeMirrorView
        initialDoc={initialDoc}
        extensions={extensions}
        filename={filenameOf(resourceItem, documentType)}
      />
    </CodeChrome>
  );
}

/**
 * The solo surface, for end-to-end encrypted files.
 *
 * These cannot ride the sync server, so the file is read and written through
 * the host bridge, which decrypts on the way in and encrypts on the way out.
 */
function LocalCodeEditor({
  resourceItem,
  bridge,
  documentType,
  onDone,
}: {
  resourceItem: BlockEditorProps['resourceItem'];
  bridge: NonNullable<BlockEditorProps['bridge']>;
  documentType: CodeDocumentType;
  onDone?: BlockEditorProps['onDone'];
}) {
  const t = useT('ext:text-editor');

  const [initialText, setInitialText] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');

  const current = useRef('');

  useUnsavedWork(`text-editor:${resourceItem?.id ?? 'document'}`, saveState);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const blob = await bridge.getResource();
        const decrypted = await blob.text();
        if (cancelled) return;

        current.current = decrypted;
        setInitialText(decrypted);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bridge]);

  // Saves are serialised and only the latest pending text is written, so a
  // burst of typing cannot land out of order.
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filename = filenameOf(resourceItem, documentType);

  const scheduleSave = useCallback(
    (value: string) => {
      current.current = value;
      pending.current = value;
      setSaveState('saving');

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        saveChain.current = saveChain.current.then(async () => {
          const next = pending.current;
          if (next === null) return;
          pending.current = null;

          try {
            await bridge.updateResource(
              new File([next], filename, { type: documentType.mimeType }),
            );
            if (pending.current === null) setSaveState('saved');
          } catch {
            setSaveState('error');
          }
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [bridge, documentType.mimeType, filename],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const extensions = useMemo(() => {
    if (initialText === null) return null;

    return [
      ...codeExtensions({ lineEnding: detectLineEnding(initialText) }),
      // The one place a change leaves CodeMirror: everything else about this
      // surface is the file's own bytes going straight back out.
      codeChangeListener(scheduleSave),
    ];
  }, [initialText, scheduleSave]);

  const done = useCallback(() => {
    onDone?.({ plain: current.current });
  }, [onDone]);

  if (loadFailed) return <CodeNotice message={t('viewer.failed')} />;
  if (initialText === null || extensions === null) {
    return <CodeNotice message={t('editor.loading')} />;
  }

  return (
    <CodeChrome
      resourceItem={resourceItem}
      documentType={documentType}
      saveState={saveState}
      onDone={onDone && done}
    >
      <CodeMirrorView
        initialDoc={initialText}
        extensions={extensions}
        filename={filename}
      />
    </CodeChrome>
  );
}

/** Header + body, shared by the two editing modes. */
function CodeChrome({
  resourceItem,
  documentType,
  saveState,
  onDone,
  connection = false,
  children,
}: {
  resourceItem: BlockEditorProps['resourceItem'];
  documentType: CodeDocumentType;
  saveState: SaveState;
  onDone?: () => void;
  /** Collab reports connection health; solo reports the write itself. */
  connection?: boolean;
  children: ReactNode;
}) {
  const t = useT('ext:text-editor');
  const { menubar, aboutDialog } = useExtensionMenuBar({ manifest });

  const menu = useMemo<HeaderNode[]>(
    () =>
      onDone
        ? [
            {
              type: 'action',
              id: 'done',
              label: t('mode.done'),
              icon: <CheckCircle className="size-4" />,
              pinned: true,
              display: 'both',
              onSelect: onDone,
            },
          ]
        : [],
    [onDone, t],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <EntranceHeader
        fullname={filenameOf(resourceItem, documentType)}
        menubar={menubar}
        menu={menu}
        end={
          <SaveStatus
            state={saveState}
            labels={
              connection ? { error: t('editor.connectionError') } : undefined
            }
          />
        }
      />
      {aboutDialog}
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/** A centred message, optionally with a way out of whatever went wrong. */
export function CodeNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const t = useT('ext:text-editor');

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
      <X className="size-5 opacity-60" />
      <span>{message}</span>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          {t('editor.retry')}
        </Button>
      )}
    </div>
  );
}

function filenameOf(
  resourceItem: BlockEditorProps['resourceItem'],
  documentType: CodeDocumentType,
): string {
  return `${resourceItem?.name ?? 'document'}.${documentType.exportExtension}`;
}
