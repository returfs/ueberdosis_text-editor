import { BubbleMenu as BaseBubbleMenu } from '@tiptap/react';
import React, { useCallback } from 'react';
import { isColumnGripSelected } from './utils';
import { MenuProps, ShouldShowProps } from '@/components/menus/types';
import { Button, Surface } from '@returfs/shared-external-react';
import { ArrowLineLeft, ArrowLineRight, Trash } from '@phosphor-icons/react';

export const TableColumnMenu = React.memo(
  ({ editor, appendTo }: MenuProps): JSX.Element => {
    const shouldShow = useCallback(
      ({ view, state, from }: ShouldShowProps) => {
        if (!state) {
          return false;
        }

        return isColumnGripSelected({ editor, view, state, from: from || 0 });
      },
      [editor],
    );

    const onAddColumnBefore = useCallback(() => {
      editor.chain().focus().addColumnBefore().run();
    }, [editor]);

    const onAddColumnAfter = useCallback(() => {
      editor.chain().focus().addColumnAfter().run();
    }, [editor]);

    const onDeleteColumn = useCallback(() => {
      editor.chain().focus().deleteColumn().run();
    }, [editor]);

    return (
      <BaseBubbleMenu
        editor={editor}
        pluginKey="tableColumnMenu"
        updateDelay={0}
        tippyOptions={{
          appendTo: () => {
            return appendTo?.current;
          },
          offset: [0, 15],
          popperOptions: {
            modifiers: [{ name: 'flip', enabled: false }],
          },
        }}
        shouldShow={shouldShow}
      >
        <Surface className="flex">
          <Button onClick={onAddColumnBefore}>
            <ArrowLineLeft /> Add Column Before
          </Button>
          <Button onClick={onAddColumnAfter}>
            <ArrowLineRight /> Add Column After
          </Button>
          <Button onClick={onDeleteColumn}>
            <Trash /> Delete Column
          </Button>
        </Surface>
      </BaseBubbleMenu>
    );
  },
);

TableColumnMenu.displayName = 'TableColumnMenu';

export default TableColumnMenu;
