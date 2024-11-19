import React, { useCallback } from 'react';
import { isRowGripSelected } from './utils';
import { MenuProps, ShouldShowProps } from '@/components/menus/types';
import { BubbleMenu as BaseBubbleMenu } from '@tiptap/react';
import { Button, Surface } from '@returfs/shared-external-react';
import { ArrowLineDown, ArrowLineUp, Trash } from '@phosphor-icons/react';

export const TableRowMenu = React.memo(
  ({ editor, appendTo }: MenuProps): JSX.Element => {
    const shouldShow = useCallback(
      ({ view, state, from }: ShouldShowProps) => {
        if (!state || !from) {
          return false;
        }

        return isRowGripSelected({ editor, view, state, from });
      },
      [editor],
    );

    const onAddRowBefore = useCallback(() => {
      editor.chain().focus().addRowBefore().run();
    }, [editor]);

    const onAddRowAfter = useCallback(() => {
      editor.chain().focus().addRowAfter().run();
    }, [editor]);

    const onDeleteRow = useCallback(() => {
      editor.chain().focus().deleteRow().run();
    }, [editor]);

    return (
      <BaseBubbleMenu
        editor={editor}
        pluginKey="tableRowMenu"
        updateDelay={0}
        tippyOptions={{
          appendTo: () => {
            return appendTo?.current;
          },
          placement: 'left',
          offset: [0, 15],
          popperOptions: {
            modifiers: [{ name: 'flip', enabled: false }],
          },
        }}
        shouldShow={shouldShow}
      >
        <Surface className="flex">
          <Button onClick={onAddRowBefore}>
            <ArrowLineUp /> Add Row Before
          </Button>
          <Button onClick={onAddRowAfter}>
            <ArrowLineDown /> Add Row After
          </Button>
          <Button onClick={onDeleteRow}>
            <Trash /> Delete Row
          </Button>
        </Surface>
      </BaseBubbleMenu>
    );
  },
);

TableRowMenu.displayName = 'TableRowMenu';

export default TableRowMenu;
