import {
  CodeBlock,
  Image,
  ListBullets,
  ListChecks,
  ListDashes,
  ListNumbers,
  Minus,
  Paragraph,
  Quotes,
  Table,
  TextColumns,
  TextHOne,
  TextHThree,
  TextHTwo,
} from '@phosphor-icons/react';
import { Editor, useEditorState } from '@tiptap/react';
import { ContentPickerOptions } from '../components/ContentTypePicker';

export const useTextmenuContentTypes = (editor: Editor) => {
  return useEditorState({
    editor,
    selector: (ctx): ContentPickerOptions => [
      {
        type: 'category',
        label: 'Hierarchy',
        id: 'hierarchy',
      },
      {
        icon: Paragraph,
        onClick: () =>
          ctx.editor
            .chain()
            .focus()
            .lift('taskItem')
            .liftListItem('listItem')
            .setParagraph()
            .run(),
        id: 'paragraph',
        disabled: () => !ctx.editor.can().setParagraph(),
        isActive: () =>
          ctx.editor.isActive('paragraph') &&
          !ctx.editor.isActive('orderedList') &&
          !ctx.editor.isActive('bulletList') &&
          !ctx.editor.isActive('taskList'),
        label: 'Paragraph',
        type: 'option',
      },
      {
        icon: TextHOne,
        onClick: () =>
          ctx.editor
            .chain()
            .focus()
            .lift('taskItem')
            .liftListItem('listItem')
            .setHeading({ level: 1 })
            .run(),
        id: 'heading1',
        disabled: () => !ctx.editor.can().setHeading({ level: 1 }),
        isActive: () => ctx.editor.isActive('heading', { level: 1 }),
        label: 'Heading 1',
        type: 'option',
      },
      {
        icon: TextHTwo,
        onClick: () =>
          ctx.editor
            .chain()
            .focus()
            .lift('taskItem')
            .liftListItem('listItem')
            .setHeading({ level: 2 })
            .run(),
        id: 'heading2',
        disabled: () => !ctx.editor.can().setHeading({ level: 2 }),
        isActive: () => ctx.editor.isActive('heading', { level: 2 }),
        label: 'Heading 2',
        type: 'option',
      },
      {
        icon: TextHThree,
        onClick: () =>
          ctx.editor
            .chain()
            .focus()
            .lift('taskItem')
            .liftListItem('listItem')
            .setHeading({ level: 3 })
            .run(),
        id: 'heading3',
        disabled: () => !ctx.editor.can().setHeading({ level: 3 }),
        isActive: () => ctx.editor.isActive('heading', { level: 3 }),
        label: 'Heading 3',
        type: 'option',
      },
      {
        type: 'category',
        label: 'Lists',
        id: 'lists',
      },
      {
        icon: ListBullets,
        onClick: () => ctx.editor.chain().focus().toggleBulletList().run(),
        id: 'bulletList',
        disabled: () => !ctx.editor.can().toggleBulletList(),
        isActive: () => ctx.editor.isActive('bulletList'),
        label: 'Bullet list',
        type: 'option',
      },
      {
        icon: ListNumbers,
        onClick: () => ctx.editor.chain().focus().toggleOrderedList().run(),
        id: 'orderedList',
        disabled: () => !ctx.editor.can().toggleOrderedList(),
        isActive: () => ctx.editor.isActive('orderedList'),
        label: 'Numbered list',
        type: 'option',
      },
      {
        icon: ListChecks,
        onClick: () => ctx.editor.chain().focus().toggleTaskList().run(),
        id: 'todoList',
        disabled: () => !ctx.editor.can().toggleTaskList(),
        isActive: () => ctx.editor.isActive('taskList'),
        label: 'Todo list',
        type: 'option',
      },
      {
        icon: ListDashes,
        onClick: () => ctx.editor.chain().focus().setDetails().run(),
        id: 'toggleList',
        disabled: () => !ctx.editor.can().setDetails(),
        isActive: () => ctx.editor.isActive('details'),
        label: 'Toggle list',
        type: 'option',
      },
      {
        type: 'category',
        label: 'Insert',
        id: 'insert',
      },
      {
        icon: Quotes,
        onClick: () => ctx.editor.chain().focus().setBlockquote().run(),
        id: 'blockquote',
        disabled: () => !ctx.editor.can().setBlockquote(),
        isActive: () => ctx.editor.isActive('blockquote'),
        label: 'Blockquote',
        type: 'option',
      },
      {
        icon: CodeBlock,
        onClick: () => ctx.editor.chain().focus().setCodeBlock().run(),
        id: 'codeBlock',
        disabled: () => !ctx.editor.can().setCodeBlock(),
        isActive: () => ctx.editor.isActive('codeBlock'),
        label: 'Code block',
        type: 'option',
      },
      //   {
      //     icon: Table,
      //     onClick: () =>
      //       ctx.editor
      //         .chain()
      //         .focus()
      //         .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
      //         .run(),
      //     id: 'table',
      //     disabled: () => !ctx.editor.can().insertTable({ rows: 3, cols: 3 }),
      //     isActive: () => false,
      //     label: 'Table',
      //     type: 'option',
      //   },
      //   {
      //     icon: Image,
      //     onClick: () => ctx.editor.chain().focus().setImage().run(),
      //     id: 'image',
      //     disabled: () => !ctx.editor.can().setImage(),
      //     isActive: () => ctx.editor.isActive('image'),
      //     label: 'Image',
      //     type: 'option',
      //   },
      {
        icon: TextColumns,
        onClick: () =>
          ctx.editor
            .chain()
            .focus()
            .setColumns()
            .focus(ctx.editor.state.selection.head - 1)
            .run(),
        id: 'columns',
        disabled: () => !ctx.editor.can().setColumns(),
        isActive: () => ctx.editor.isActive('columns'),
        label: 'Columns',
        type: 'option',
      },
      {
        icon: Minus,
        onClick: () => ctx.editor.chain().focus().setHorizontalRule().run(),
        id: 'horizontalRule',
        disabled: () => !ctx.editor.can().setHorizontalRule(),
        isActive: () => false,
        label: 'Horizontal Rule',
        type: 'option',
      },
    ],
  });
};
