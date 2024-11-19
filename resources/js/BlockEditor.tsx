import React, { memo, useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import '../css/app.css';
import LinkMenu from './components/menus/LinkMenu/LinkMenu';
import { useBlockEditor } from './hooks/useBlockEditor';
import { twMerge } from 'tailwind-merge';
import { ContentItemMenu } from './components/menus/ContentItemMenu';
import { TextMenu } from './components/menus/TextMenu';
import { ColumnsMenu } from './components/menus/MultiColumn/menus';
import { TableColumnMenu, TableRowMenu } from './extensions/Table/menus';
import ImageBlockMenu from './extensions/ImageBlock/components/ImageBlockMenu';
// import { Doc } from 'yjs';

export default memo(function BlockEditor({
  resourceRoute,
  settings,
}: {
  resourceRoute: string;
  settings: any;
  //   ydoc: Doc;
}) {
  const extensions = [StarterKit];
  const content = `
<p>Hello World! 123</p>
<h1>Consume the Editor context in child components</h1>
If you use the EditorProvider to setup your Tiptap editor, you can now easily access your editor instance from any child component using the useCurrentEditor hook.
`;

  const menuContainerRef = useRef(null);

  //   const editor = useEditor({
  //     extensions,
  //     content,
  //   });

  const { editor } = useBlockEditor();

  if (!editor) {
    return null;
  }

  console.log('editor', editor);

  return (
    <div className={twMerge('flex h-full')} ref={menuContainerRef}>
      <div className="relative flex h-full flex-1 flex-col overflow-hidden">
        <EditorContent className="flex-1 overflow-y-auto" editor={editor} />
        <ContentItemMenu editor={editor} />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <TextMenu editor={editor} />
        <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
        <TableRowMenu editor={editor} appendTo={menuContainerRef} />
        <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
        <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
      </div>
    </div>
  );
});
