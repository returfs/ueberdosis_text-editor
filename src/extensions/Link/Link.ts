import { mergeAttributes } from '@tiptap/core';
import TiptapLink from '@tiptap/extension-link';
import { Plugin } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';

export const Link = TiptapLink.extend({
  inclusive: false,

  addAttributes() {
    return {
      ...this.parent?.(),

      /**
       * A markdown link may carry a title — `[text](url "the title")` — and
       * Tiptap's Link does not declare one, so it was being dropped the moment
       * the document went through the schema. Silently rewriting the user's
       * file is not something a save is allowed to do.
       */
      title: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes =>
          attributes.title ? { title: attributes.title } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[href]:not([data-type="button"]):not([href *= "javascript:" i])',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'link',
      }),
      0,
    ];
  },

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      ...(this.parent?.() || []),
      new Plugin({
        props: {
          handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
            const { selection } = editor.state;

            if (event.key === 'Escape' && selection.empty !== true) {
              editor.commands.focus(selection.to, { scrollIntoView: false });
            }

            return false;
          },
        },
      }),
    ];
  },
});

export default Link;
