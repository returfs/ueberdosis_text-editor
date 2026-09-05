import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import {
  codeExtensions,
  languageCompartment,
  loadLanguage,
} from '../lib/codeSetup';
import { detectLineEnding } from '../lib/codeFile';

/**
 * A mounted CodeMirror instance.
 *
 * The editor is built ONCE, on mount, and its configuration is not re-derived
 * from props afterwards. CodeMirror owns its own document state — rebuilding it
 * mid-life would throw away the cursor, the scroll position, the undo history
 * and, in a collaborative document, the binding to the shared text. Callers
 * that need a genuinely different editor pass a different React `key`, which is
 * the same discipline `BlockEditor` uses for its Yjs document and provider.
 *
 * `value` is the one exception: a read-only view whose file changed underneath
 * it (someone left the editor) is updated by a replace transaction rather than
 * a remount, so a large file is not reparsed to show a small edit.
 */
export function CodeMirrorView({
  initialDoc,
  extensions,
  filename,
  value,
  onReady,
}: {
  initialDoc: string;
  extensions: Extension[];
  /** Used to choose the syntax highlighting; loaded after the first paint. */
  filename: string;
  /** Keeps a read-only view in step with a changing document. */
  value?: string;
  onReady?: (view: EditorView) => void;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const view = useRef<EditorView | null>(null);

  // Read at mount time only — see the note above about rebuilding.
  const initial = useRef({ initialDoc, extensions, filename, onReady });

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;

    const { initialDoc, extensions, filename, onReady } = initial.current;

    const instance = new EditorView({
      state: EditorState.create({ doc: initialDoc, extensions }),
      parent,
    });

    view.current = instance;
    onReady?.(instance);

    let alive = true;
    void loadLanguage(filename).then(language => {
      // The grammar arrives over the network, so the editor may already be
      // gone — dispatching into a destroyed view throws.
      if (!alive) return;
      instance.dispatch({
        effects: languageCompartment.reconfigure(language),
      });
    });

    return () => {
      alive = false;
      instance.destroy();
      view.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = view.current;
    if (instance === null || value === undefined) return;
    if (instance.state.doc.toString() === value) return;

    instance.dispatch({
      changes: { from: 0, to: instance.state.doc.length, insert: value },
    });
  }, [value]);

  return <div ref={host} className="h-full min-h-0 w-full overflow-hidden" />;
}

/**
 * Read-only view of a source file.
 *
 * This is what "rendering" a `.log`, a `.json` or a `.php` means: the file, with
 * its own line breaks and indentation, syntax coloured, line numbered and
 * searchable — not a paraphrase of it. Nothing is parsed into another shape, so
 * there is nothing that could come back different.
 */
export function CodeSurface({
  text,
  filename,
}: {
  text: string;
  filename: string;
}) {
  const lineEnding = detectLineEnding(text);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <CodeMirrorView
        initialDoc={text}
        value={text}
        filename={filename}
        extensions={codeExtensions({ readOnly: true, lineEnding })}
      />
    </div>
  );
}
