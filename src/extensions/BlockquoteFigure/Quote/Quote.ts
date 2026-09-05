import { Node } from '@tiptap/core';

export const Quote = Node.create({
  name: 'quote',

  // Any block, with marks. A markdown blockquote can hold a list, a code
  // block, another quote and bold text, and a `paragraph+`/`marks: ''` quote
  // would drop every one of them the first time a `.md` file was saved.
  content: 'block+',

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'blockquote',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['blockquote', HTMLAttributes, 0];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => false,
    };
  },
});

export default Quote;
