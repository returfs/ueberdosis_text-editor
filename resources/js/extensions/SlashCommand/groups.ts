import {
  Book,
  CodeBlock,
  Image,
  ListBullets,
  ListChecks,
  ListDashes,
  ListNumbers,
  Minus,
  Quotes,
  Table,
  TextColumns,
  TextHOne,
  TextHThree,
  TextHTwo,
} from '@phosphor-icons/react';
import { Group } from './types';

export const GROUPS: Group[] = [
  //   {
  //     name: 'ai',
  //     title: 'AI',
  //     commands: [
  //       {
  //         name: 'aiWriter',
  //         label: 'AI Writer',
  //         iconName: 'Sparkles',
  //         description: 'Let AI finish your thoughts',
  //         shouldBeHidden: editor => editor.isActive('columns'),
  //         action: editor => editor.chain().focus().setAiWriter().run(),
  //       },
  //       {
  //         name: 'aiImage',
  //         label: 'AI Image',
  //         iconName: 'Sparkles',
  //         description: 'Generate an image from text',
  //         shouldBeHidden: editor => editor.isActive('columns'),
  //         action: editor => editor.chain().focus().setAiImage().run(),
  //       },
  //     ],
  //   },
  {
    name: 'format',
    title: 'Format',
    commands: [
      {
        name: 'heading1',
        label: 'Heading 1',
        iconName: TextHOne,
        description: 'High priority section title',
        aliases: ['h1'],
        action: editor => {
          editor.chain().focus().setHeading({ level: 1 }).run();
        },
      },
      {
        name: 'heading2',
        label: 'Heading 2',
        iconName: TextHTwo,
        description: 'Medium priority section title',
        aliases: ['h2'],
        action: editor => {
          editor.chain().focus().setHeading({ level: 2 }).run();
        },
      },
      {
        name: 'heading3',
        label: 'Heading 3',
        iconName: TextHThree,
        description: 'Low priority section title',
        aliases: ['h3'],
        action: editor => {
          editor.chain().focus().setHeading({ level: 3 }).run();
        },
      },
      {
        name: 'bulletList',
        label: 'Bullet List',
        iconName: ListBullets,
        description: 'Unordered list of items',
        aliases: ['ul'],
        action: editor => {
          editor.chain().focus().toggleBulletList().run();
        },
      },
      {
        name: 'numberedList',
        label: 'Numbered List',
        iconName: ListNumbers,
        description: 'Ordered list of items',
        aliases: ['ol'],
        action: editor => {
          editor.chain().focus().toggleOrderedList().run();
        },
      },
      {
        name: 'taskList',
        label: 'Task List',
        iconName: ListChecks,
        description: 'Task list with todo items',
        aliases: ['todo'],
        action: editor => {
          editor.chain().focus().toggleTaskList().run();
        },
      },
      {
        name: 'toggleList',
        label: 'Toggle List',
        iconName: ListDashes,
        description: 'Toggles can show and hide content',
        aliases: ['toggle'],
        action: editor => {
          editor.chain().focus().setDetails().run();
        },
      },
      {
        name: 'blockquote',
        label: 'Blockquote',
        iconName: Quotes,
        description: 'Element for quoting',
        action: editor => {
          editor.chain().focus().setBlockquote().run();
        },
      },
      {
        name: 'codeBlock',
        label: 'Code Block',
        iconName: CodeBlock,
        description: 'Code block with syntax highlighting',
        shouldBeHidden: editor => editor.isActive('columns'),
        action: editor => {
          editor.chain().focus().setCodeBlock().run();
        },
      },
    ],
  },
  {
    name: 'insert',
    title: 'Insert',
    commands: [
      {
        name: 'table',
        label: 'Table',
        iconName: Table,
        description: 'Insert a table',
        shouldBeHidden: editor => editor.isActive('columns'),
        action: editor => {
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
            .run();
        },
      },
      {
        name: 'image',
        label: 'Image',
        iconName: Image,
        description: 'Insert an image',
        aliases: ['img'],
        action: editor => {
          editor.chain().focus().setImageUpload().run();
        },
      },
      {
        name: 'columns',
        label: 'Columns',
        iconName: TextColumns,
        description: 'Add two column content',
        aliases: ['cols'],
        shouldBeHidden: editor => editor.isActive('columns'),
        action: editor => {
          editor
            .chain()
            .focus()
            .setColumns()
            .focus(editor.state.selection.head - 1)
            .run();
        },
      },
      {
        name: 'horizontalRule',
        label: 'Horizontal Rule',
        iconName: Minus,
        description: 'Insert a horizontal divider',
        aliases: ['hr'],
        action: editor => {
          editor.chain().focus().setHorizontalRule().run();
        },
      },
      {
        name: 'toc',
        label: 'Table of Contents',
        iconName: Book,
        aliases: ['outline'],
        description: 'Insert a table of contents',
        shouldBeHidden: editor => editor.isActive('columns'),
        action: editor => {
          editor.chain().focus().insertTableOfContents().run();
        },
      },
    ],
  },
];

export default GROUPS;
