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
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ContentItemMenu } from './components/menus/ContentItemMenu';
import { useEditorMenuBarMenus } from './components/menus/HeaderMenu/useEditorMenuBarMenus';
import { useHeaderMenuNodes } from './components/menus/HeaderMenu/useHeaderMenuNodes';
import { manifest } from './manifest';
import LinkMenu from './components/menus/LinkMenu/LinkMenu';
import { ColumnsMenu } from './components/menus/MultiColumn/menus';
import ImageBlockMenu from './extensions/ImageBlock/components/ImageBlockMenu';
import { TableColumnMenu, TableRowMenu } from './extensions/Table/menus';
import type { RichDocumentType } from './document-types';
import { SourceView } from './surfaces/SourceView';
import { useModeNodes, useSourceMode } from './surfaces/editorMode';
import { BlockEditorProps, EditorBridge } from './types';

/** Debounce between the last keystroke and the encrypted save. */
const SAVE_DEBOUNCE_MS = 800;

/**
 * LOCAL editing mode for end-to-end encrypted files (Phase 4E).
 *
 * The collaboration server only ever sees plaintext, so e2ee documents cannot
 * ride Hocuspocus. Instead the host bridge does the crypto at its choke
 * points: `getResource()` hands us decrypted bytes, `updateResource()`
 * encrypts what we save before it is stored. No Yjs doc, no rich sidecar —
 * the plain file is the single source of truth, so formatting beyond plain
 * text is NOT preserved across reopens (the honest v1 trade-off; the header
 * label says so).
 */
export default memo(function LocalEditor({
  resourceItem,
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const blob = await bridge.getResource();
        const text = await blob.text();
        if (!cancelled) setInitialText(text);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bridge]);

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-neutral-400">
        <span>{t('editor.encryptedFailed')}</span>
        <Button type="button" variant="outline" onClick={onRequestReload}>
          {t('editor.retry')}
        </Button>
      </div>
    );
  }

  if (initialText === null) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
        {t('editor.loading')}
      </div>
    );
  }

  return (
    <LocalEditorSurface
      resourceItem={resourceItem}
      bridge={bridge}
      documentType={documentType}
      onDone={onDone}
      initialText={initialText}
    />
  );
});

function LocalEditorSurface({
  resourceItem,
  bridge,
  documentType,
  onDone,
  initialText,
}: {
  resourceItem: BlockEditorProps['resourceItem'];
  bridge: EditorBridge;
  documentType: RichDocumentType;
  onDone?: BlockEditorProps['onDone'];
  initialText: string;
}) {
  const menuContainerRef = useRef(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');

  // Edits live only in this tab until the debounced save lands, so the app
  // warns before leaving while one is pending.
  useUnsavedWork(`text-editor:${resourceItem?.id ?? 'document'}`, saveState);

  // Serialize saves: a save that starts while one is in flight waits for it,
  // and only the LATEST pending text is written (intermediate states skip).
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const pendingText = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    autofocus: true,
    extensions: documentType.extensions({ history: true }),
    content: documentType.toDoc(initialText),
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: 'min-h-full',
      },
    },
    onUpdate: ({ editor: current }) => {
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
  if (!editor) return null;

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      ref={menuContainerRef}
    >
      <LocalEditorHeader
        editor={editor}
        fullname={`${resourceItem?.name}.${resourceItem?.extension}`}
        fileBaseName={resourceItem?.name ?? 'document'}
        saveState={saveState}
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

const LocalEditorHeader = memo(function LocalEditorHeader({
  editor,
  fullname,
  fileBaseName,
  saveState,
  modeNodes,
}: {
  editor: Editor;
  fullname: string;
  fileBaseName: string;
  saveState: SaveState;
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
          <SaveStatus
            state={saveState}
            labels={{ error: t('editor.saveFailed') }}
          />
        }
      />
      {aboutDialog}
    </>
  );
});
