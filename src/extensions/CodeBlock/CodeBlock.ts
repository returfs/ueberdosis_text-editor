import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

// `common` registers the ~37 most-used languages (js, ts, python, json, bash,
// html, css, sql, …) instead of `all` (~190, incl. highlight.js's full grammar
// set). `all` was one of the heaviest things in the editor bundle; `common`
// covers real-world code blocks at a fraction of the parse/download cost.
const lowlight = createLowlight(common);

export const CodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      /**
       * Marks the YAML front matter at the top of a markdown file, which is
       * held as a code block because it is the only node that keeps text
       * verbatim. The flag has to live in the editor's schema, not only in the
       * conversion: once the browser is editing, the browser is what writes
       * the document, and an attribute the schema does not declare is dropped
       * on the first keystroke — turning `---` fences into a ```yaml block.
       */
      frontmatter: {
        default: false,
        parseHTML: element =>
          element.getAttribute('data-frontmatter') === 'true',
        renderHTML: attributes =>
          attributes.frontmatter ? { 'data-frontmatter': 'true' } : {},
      },
    };
  },
}).configure({
  lowlight,
  defaultLanguage: 'javascript',
});
