import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {
  HighlightStyle,
  LanguageDescription,
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import type { LineEnding } from './codeFile';

/**
 * Syntax colours are assigned as CLASSES, not inline styles.
 *
 * CodeMirror's own themes bake their palette into the extension, which would
 * mean shipping two of them and swapping on every theme change. The app already
 * has a light/dark convention (`.dark` on an ancestor), so naming the tokens
 * here and colouring them in CSS lets one stylesheet follow the app for free.
 */
const highlightStyle = HighlightStyle.define([
  {
    tag: [
      tags.keyword,
      tags.modifier,
      tags.controlKeyword,
      tags.definitionKeyword,
      tags.moduleKeyword,
      tags.operatorKeyword,
    ],
    class: 'tok-keyword',
  },
  { tag: [tags.propertyName], class: 'tok-property' },
  { tag: [tags.variableName, tags.labelName], class: 'tok-variable' },
  {
    tag: [
      tags.function(tags.variableName),
      tags.function(tags.propertyName),
      tags.macroName,
    ],
    class: 'tok-function',
  },
  {
    tag: [tags.typeName, tags.className, tags.namespace, tags.self],
    class: 'tok-type',
  },
  {
    tag: [tags.number, tags.bool, tags.null, tags.atom, tags.integer],
    class: 'tok-number',
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp, tags.escape],
    class: 'tok-string',
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment],
    class: 'tok-comment',
  },
  {
    tag: [tags.operator, tags.punctuation, tags.separator, tags.bracket],
    class: 'tok-operator',
  },
  { tag: [tags.meta, tags.processingInstruction], class: 'tok-meta' },
  { tag: [tags.tagName], class: 'tok-tag' },
  { tag: [tags.attributeName], class: 'tok-attribute' },
  { tag: [tags.heading], class: 'tok-heading' },
  { tag: [tags.link, tags.url], class: 'tok-link' },
  { tag: [tags.invalid], class: 'tok-invalid' },
  { tag: [tags.strong], class: 'tok-strong' },
  { tag: [tags.emphasis], class: 'tok-emphasis' },
  { tag: [tags.strikethrough], class: 'tok-strike' },
]);

/**
 * The language is swapped in after the file is on screen.
 *
 * `@codemirror/language-data` loads each grammar by dynamic import, so a PHP
 * file does not carry the Rust parser. That makes the language asynchronous
 * while the document is not, and a compartment is how CodeMirror reconfigures
 * one part of a running editor.
 */
export const languageCompartment = new Compartment();

/**
 * The grammar for a file, by name.
 *
 * Matching on the filename rather than the extension alone is deliberate:
 * language-data knows about the names that carry no extension at all
 * (`Dockerfile`, `Makefile`) and about the multi-part ones (`.d.ts`).
 *
 * A grammar that fails to load is not an error worth showing anyone — the file
 * is still perfectly readable, just uncoloured.
 */
export async function loadLanguage(filename: string): Promise<Extension> {
  const description = LanguageDescription.matchFilename(languages, filename);
  if (!description) return [];

  try {
    return await description.load();
  } catch {
    return [];
  }
}

/**
 * The editor's behaviour, minus the document and minus collaboration.
 *
 * `readOnly` is the viewer. `collab` says that undo history comes from Yjs
 * instead: with two people in a document, a local undo stack would happily undo
 * the other person's typing, so y-codemirror.next supplies an undo manager that
 * only ever reverts your own changes and this must not install a second one.
 */
export function codeExtensions({
  readOnly = false,
  collab = false,
  lineEnding = '\n',
}: {
  readOnly?: boolean;
  collab?: boolean;
  lineEnding?: LineEnding;
} = {}): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    syntaxHighlighting(highlightStyle),
    highlightSelectionMatches(),
    rectangularSelection(),
    crosshairCursor(),
    languageCompartment.of([]),

    // Told the file's own separator, CodeMirror keeps it: a CRLF file stays
    // CRLF, including on lines typed today, and never comes back as a diff
    // touching every line.
    EditorState.lineSeparator.of(lineEnding),

    // Logs and minified JSON are the common case here and both are one very
    // long line. Wrapping means the content is readable without a horizontal
    // scrollbar under a pane that is already narrow.
    EditorView.lineWrapping,

    ...(readOnly
      ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
      : [
          closeBrackets(),
          autocompletion(),
          highlightActiveLine(),
          ...(collab ? [] : [history()]),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...(collab ? [] : historyKeymap),
            ...foldKeymap,
            ...completionKeymap,
            // Tab indents rather than moving focus. CodeMirror leaves this off
            // by default because it traps keyboard navigation; in a full-pane
            // code editor, a Tab that does not indent is the greater surprise.
            indentWithTab,
          ]),
        ]),
  ];
}

/**
 * Call back with the document's text whenever it changes.
 *
 * The solo (encrypted) editor has no sync server to persist for it, so this is
 * how a keystroke reaches the file.
 */
export function codeChangeListener(
  onChange: (value: string) => void,
): Extension {
  return EditorView.updateListener.of(update => {
    if (update.docChanged) onChange(update.state.doc.toString());
  });
}
