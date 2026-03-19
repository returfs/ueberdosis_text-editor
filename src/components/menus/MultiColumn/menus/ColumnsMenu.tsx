import React, { useCallback } from 'react';
import { BubbleMenu as BaseBubbleMenu, useEditorState } from '@tiptap/react';
import getRenderContainer from '@/lib/utils/getRenderContainer';
import { MenuProps } from './types';
import { ColumnLayout } from '@/extensions/MultiColumn';
import { sticky } from 'tippy.js';
import { v4 as uuid } from 'uuid';
import { Button, Surface } from '@returfs/shared-external-react';
import {
  Columns,
  ColumnsPlusLeft,
  ColumnsPlusRight,
} from '@phosphor-icons/react';

export const ColumnsMenu = ({ editor, appendTo }: MenuProps) => {
  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor, 'columns');
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0);

    return rect;
  }, [editor]);

  const shouldShow = useCallback(() => {
    const isColumns = editor.isActive('columns');
    return isColumns;
  }, [editor]);

  const onColumnLeft = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarLeft).run();
  }, [editor]);

  const onColumnRight = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarRight).run();
  }, [editor]);

  const onColumnTwo = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.TwoColumn).run();
  }, [editor]);
  const { isColumnLeft, isColumnRight, isColumnTwo } = useEditorState({
    editor,
    selector: ctx => {
      return {
        isColumnLeft: ctx.editor.isActive('columns', {
          layout: ColumnLayout.SidebarLeft,
        }),
        isColumnRight: ctx.editor.isActive('columns', {
          layout: ColumnLayout.SidebarRight,
        }),
        isColumnTwo: ctx.editor.isActive('columns', {
          layout: ColumnLayout.TwoColumn,
        }),
      };
    },
  });

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey={`columnsMenu-${uuid()}`}
      shouldShow={shouldShow}
      updateDelay={0}
      tippyOptions={{
        offset: [0, 8],
        popperOptions: {
          modifiers: [{ name: 'flip', enabled: false }],
        },
        getReferenceClientRect,
        appendTo: () => appendTo?.current,
        plugins: [sticky],
        sticky: 'popper',
      }}
    >
      <Surface className="flex">
        <Button size="icon" isActive={isColumnLeft} onClick={onColumnLeft}>
          <ColumnsPlusLeft alt="Sidebar Left" />
        </Button>
        <Button size="icon" isActive={isColumnTwo} onClick={onColumnTwo}>
          <Columns alt="Two Columns" />
        </Button>
        <Button size="icon" isActive={isColumnRight} onClick={onColumnRight}>
          <ColumnsPlusRight alt="Sidebar Right" />
        </Button>
      </Surface>
    </BaseBubbleMenu>
  );
};

export default ColumnsMenu;
