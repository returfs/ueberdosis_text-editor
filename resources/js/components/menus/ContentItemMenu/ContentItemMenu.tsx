import useContentItemActions from '@/hooks/useContentItemActions';
import { useData } from '@/hooks/useData';
import { Clipboard, Copy, TextTSlash, Trash } from '@phosphor-icons/react';
import { DotsSixVertical } from '@phosphor-icons/react/dist/ssr';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Surface,
} from '@returfs/shared-external-react';
import DragHandle from '@tiptap-pro/extension-drag-handle-react';
import { Editor } from '@tiptap/react';
import React, { useEffect, useState } from 'react';

export type ContentItemMenuProps = {
  editor: Editor;
};

export const ContentItemMenu = ({ editor }: ContentItemMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const data = useData();
  const actions = useContentItemActions(
    editor,
    data.currentNode,
    data.currentNodePos,
  );

  useEffect(() => {
    if (menuOpen) {
      editor.commands.setMeta('lockDragHandle', true);
    } else {
      editor.commands.setMeta('lockDragHandle', false);
    }
  }, [editor, menuOpen]);

  return (
    <DragHandle
      pluginKey="ContentItemMenu"
      editor={editor}
      onNodeChange={data.handleNodeChange}
      tippyOptions={{
        offset: [-2, 8],
        zIndex: 10,
      }}
    >
      <div className="flex items-center gap-0.5">
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button size="icon">
              <DotsSixVertical weight={'bold'} />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" sideOffset={8} asChild>
            <Surface className="flex w-fit flex-col">
              <Button variant="menu" onClick={actions.resetTextFormatting}>
                <TextTSlash /> Clear Formatting
              </Button>
              <Button variant="menu" onClick={actions.copyNodeToClipboard}>
                <Clipboard /> Copy to Clipboard
              </Button>
              <Button variant="menu" onClick={actions.duplicateNode}>
                <Copy /> Duplicate
              </Button>
              <Separator className="my-1 w-full" orientation="horizontal" />
              <Button
                variant="menu"
                className="bg-red-500 bg-opacity-10 text-red-500 hover:bg-red-500 hover:bg-opacity-20 dark:text-red-500 dark:hover:bg-red-500 dark:hover:bg-opacity-20 dark:hover:text-red-500"
                onClick={actions.deleteNode}
              >
                <Trash />
                Delete
              </Button>
            </Surface>
          </PopoverContent>
        </Popover>
      </div>
    </DragHandle>
  );
};
