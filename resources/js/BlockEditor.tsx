import { HocuspocusProvider } from '@hocuspocus/provider';
import { EntranceHeader } from '@returfs/shared-external-react';
import { EditorContent } from '@tiptap/react';
import React, { memo, useMemo, useRef } from 'react';
import { Doc } from 'yjs';
import { ContentItemMenu } from './components/menus/ContentItemMenu';
import { HeaderMenu } from './components/menus/HeaderMenu';
import LinkMenu from './components/menus/LinkMenu/LinkMenu';
import { ColumnsMenu } from './components/menus/MultiColumn/menus';
import ImageBlockMenu from './extensions/ImageBlock/components/ImageBlockMenu';
import { TableColumnMenu, TableRowMenu } from './extensions/Table/menus';
import { useBlockEditor } from './hooks/useBlockEditor';
import { BlockEditorProps } from './types';

export default memo(function BlockEditor({
  resourceItem,
  resourceUser,
}: BlockEditorProps) {
  const menuContainerRef = useRef(null);

  const doc = useMemo(() => new Doc(), []);

  //   console.log(import.meta.env.VITE_HOCUSPOCUS_URL);

  const provider = useMemo(() => {
    return new HocuspocusProvider({
      url: import.meta.env.VITE_HOCUSPOCUS_URL,
      name: resourceItem.id,
      document: doc,
      forceSyncInterval: 200,
      token: 'test-token',
      parameters: {
        resourceRoute: resourceItem.route,
        resourceUpdateRoute: resourceItem.updateRoute,
      },
    });
  }, [doc]);

  const { editor } = useBlockEditor({ doc, provider, resourceUser });

  if (!editor) {
    return null;
  }

  return (
    <div
      className="flex h-screen w-full flex-col overflow-y-auto"
      ref={menuContainerRef}
    >
      <EntranceHeader
        fullname={`${resourceItem?.name}.${resourceItem?.extension}`}
      >
        <HeaderMenu editor={editor} />
      </EntranceHeader>

      <div className="relative min-h-screen w-full flex-1 flex-col">
        <EditorContent className="flex-1" editor={editor} />
        <ContentItemMenu editor={editor} />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
        <TableRowMenu editor={editor} appendTo={menuContainerRef} />
        <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
        <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
      </div>
    </div>
  );
});
