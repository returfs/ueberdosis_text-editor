import { Article, CodeSimple, PencilSimple } from '@phosphor-icons/react';
import {
  EntranceHeader,
  useExtensionMenuBar,
  useT,
  type HeaderNode,
} from '@returfs/shared-external-react';
import type { JSONContent } from '@tiptap/react';
import { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { documentTypeFor } from './document-types';
import { inspectCodeFile } from './lib/codeFile';
import { useResourceText } from './lib/resource';
import { manifest } from './manifest';
import { ViewerNotice, ViewerSurface } from './surfaces/ViewerSurface';
import type { BlockEditorProps } from './types';

/**
 * The editors are loaded only when someone asks to edit, and the two are
 * separate chunks: a `.php` file never downloads Tiptap, its bubble menus and
 * its drag handles, and a `.md` file never downloads CodeMirror's grammars.
 */
const BlockEditor = lazy(() => import('./BlockEditor'));
const CodeEditor = lazy(() => import('./CodeEditor'));

/**
 * The code VIEWER is split out too. It is the read path, so it loads on almost
 * every source-file open — but someone reading a `.md` should not download
 * CodeMirror and its grammars to do it, and vice versa.
 */
const CodeSurface = lazy(() =>
  import('./surfaces/CodeSurface').then(module => ({
    default: module.CodeSurface,
  })),
);

type Mode = 'viewing' | 'editing';

/**
 * One opened text document.
 *
 * Viewing is the landing and editing is a mode, the same shape every other
 * open-a-file extension here takes. Most opens are someone reading a file, and
 * that should not cost a websocket, a collaborative session and an editor —
 * nor should a file shared read-only offer an Edit button that cannot save.
 *
 * Which surface renders it is the document type's decision (see
 * `documentTypeFor`): prose is a rich document whose file is a projection of
 * it, source is a file whose bytes are the document.
 */
export default function TextDocument({
  resourceItem,
  resourceUser,
  bridge,
}: BlockEditorProps) {
  const t = useT('ext:text-editor');

  const [mode, setMode] = useState<Mode>('viewing');
  const [source, setSource] = useState(false);

  /**
   * The document as the editor last had it. Set on the way out of editing so
   * the view shows what was just typed: the file itself is written by the sync
   * server on a debounce, so re-reading it here can briefly show the version
   * from before the last few keystrokes.
   */
  const [edited, setEdited] = useState<JSONContent | null>(null);

  /** The same edit as the file's bytes, for the source and code views. */
  const [editedText, setEditedText] = useState<string | null>(null);

  const documentType = documentTypeFor(resourceItem?.extension);
  const isCode = documentType.surface === 'code';
  const isMarkdown = documentType.id === 'markdown';

  const collabTokenUrl = (
    resourceItem as { collabTokenUrl?: string } | undefined
  )?.collabTokenUrl;

  const { text, state, writable, reload } = useResourceText({
    resourceId: resourceItem?.id,
    collabTokenUrl,
    bridge,
    documentType,
  });

  const shown = editedText ?? text;

  /**
   * Why this file cannot be opened as source, if it cannot.
   *
   * Checked here rather than inside the surface so the answer is known before
   * the toolbar is built: offering Edit on a file we have already decided not
   * to show would be offering a door into an empty room.
   */
  const problem = useMemo(
    () => (isCode && shown !== null ? inspectCodeFile(shown) : null),
    [isCode, shown],
  );

  const leaveEditor = useCallback(
    ({ plain, document }: { plain: string; document?: JSONContent }) => {
      setEdited(document ?? null);
      setEditedText(plain);
      setMode('viewing');
    },
    [],
  );

  const { menubar, aboutDialog } = useExtensionMenuBar({ manifest });

  const fullname = `${resourceItem?.name}.${resourceItem?.extension}`;

  const toolbar = useMemo<HeaderNode[]>(() => {
    const nodes: HeaderNode[] = [];

    if (writable && problem === null) {
      nodes.push({
        type: 'action',
        id: 'edit',
        label: t('mode.edit'),
        icon: <PencilSimple className="size-4" />,
        pinned: true,
        display: 'both',
        onSelect: () => setMode('editing'),
      });
    }

    // Only markdown has a source worth toggling to. A `.txt` file's source and
    // its rendering are the same characters, and a source file is ALREADY its
    // source — there is nothing on the other side of the switch.
    if (isMarkdown) {
      nodes.push(
        {
          type: 'action',
          id: 'rendered',
          label: t('mode.rendered'),
          icon: <Article className="size-4" />,
          pinned: true,
          active: !source,
          onSelect: () => setSource(false),
        },
        {
          type: 'action',
          id: 'source',
          label: t('mode.source'),
          icon: <CodeSimple className="size-4" />,
          pinned: true,
          active: source,
          onSelect: () => setSource(true),
        },
      );
    }

    return nodes;
  }, [isMarkdown, problem, source, t, writable]);

  if (mode === 'editing') {
    return (
      <Suspense
        fallback={<ViewerNotice spinning message={t('editor.loading')} />}
      >
        {isCode ? (
          <CodeEditor
            resourceItem={resourceItem}
            resourceUser={resourceUser}
            bridge={bridge}
            onDone={leaveEditor}
          />
        ) : (
          <BlockEditor
            resourceItem={resourceItem}
            resourceUser={resourceUser}
            bridge={bridge}
            onDone={leaveEditor}
          />
        )}
      </Suspense>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <EntranceHeader fullname={fullname} menubar={menubar} menu={toolbar} />
      {aboutDialog}

      {state === 'loading' && (
        <ViewerNotice spinning message={t('viewer.loading')} />
      )}

      {state === 'error' && (
        <ViewerNotice message={t('viewer.failed')} onRetry={reload} />
      )}

      {state === 'needs-app' && (
        <ViewerNotice message={t('viewer.encryptedNeedsApp')} />
      )}

      {state === 'ready' && problem === 'too-large' && (
        <ViewerNotice message={t('viewer.tooLarge')} />
      )}

      {state === 'ready' && problem === 'binary' && (
        <ViewerNotice message={t('viewer.notText')} />
      )}

      {state === 'ready' &&
        problem === null &&
        // Compared inline rather than through `isCode`, so TypeScript narrows
        // the document type to the one this surface can actually take.
        (documentType.surface === 'code' ? (
          <Suspense
            fallback={<ViewerNotice spinning message={t('viewer.loading')} />}
          >
            <CodeSurface text={shown ?? ''} filename={fullname} />
          </Suspense>
        ) : (
          <ViewerSurface
            documentType={documentType}
            text={shown}
            // The rendered view uses the document it was handed; the source
            // view uses the text beside it. Both come from the same edit, so
            // the two never disagree.
            document={source ? null : edited}
            source={source}
          />
        ))}
    </div>
  );
}
