import React, { memo, useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import LinkMenu from './components/menus/LinkMenu/LinkMenu';
import { useBlockEditor } from './hooks/useBlockEditor';
import { ContentItemMenu } from './components/menus/ContentItemMenu';
import { TextMenu } from './components/menus/TextMenu';
import { ColumnsMenu } from './components/menus/MultiColumn/menus';
import { TableColumnMenu, TableRowMenu } from './extensions/Table/menus';
import ImageBlockMenu from './extensions/ImageBlock/components/ImageBlockMenu';
import { Doc } from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

export default memo(function BlockEditor({
  item,
  resourceRoute,
  onUpdate,
  settings,
}: {
  resourceRoute: string;
  settings: any;
  //   ydoc: Doc;
}) {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkdownContent = async () => {
      try {
        const response = await fetch(resourceRoute);
        const res = await response.json();

        setContent(res.data);
      } catch (error) {
        console.error('Error fetching markdown content:', error);
      }
    };

    fetchMarkdownContent();
  }, [resourceRoute]);

  const menuContainerRef = useRef(null);

  const ydoc = new Doc();

  const provider = new HocuspocusProvider({
    url: 'ws://127.0.0.1:2319',
    name: item.id,
    document: ydoc,
    forceSyncInterval: 200,
  });

  const { editor } = useBlockEditor(content, onUpdate, ydoc, provider);

  if (!editor || !content) {
    return null;
  }

  return (
    <div className="flex h-full w-full" ref={menuContainerRef}>
      <div className="relative flex h-full min-h-screen w-full flex-1 flex-col overflow-hidden">
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
