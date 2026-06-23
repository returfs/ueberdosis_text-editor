import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

// `common` registers the ~37 most-used languages (js, ts, python, json, bash,
// html, css, sql, …) instead of `all` (~190, incl. highlight.js's full grammar
// set). `all` was one of the heaviest things in the editor bundle; `common`
// covers real-world code blocks at a fraction of the parse/download cost.
const lowlight = createLowlight(common);

export const CodeBlock = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: 'javascript',
});
