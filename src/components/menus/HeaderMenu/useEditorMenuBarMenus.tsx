import { ExtensionMenuBarMenus } from '@returfs/shared-external-react';
import { Editor } from '@tiptap/react';
import { useMemo } from 'react';
import { useTextmenuCommands } from './hooks/useTextmenuCommands';
import { useTextmenuStates } from './hooks/useTextmenuStates';

/** Download a string as a file (used by File → Export). */
function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Builds the editor's File / Edit / View menu contents for the macOS-style menu
 * bar (the App menu + About are added by `useExtensionMenuBar`). Reuses the
 * editor command/state hooks; Undo/Redo carry `disabled` from the live history
 * availability so they grey out when there's nothing to undo/redo.
 */
export function useEditorMenuBarMenus(
  editor: Editor,
  fileBaseName = 'document',
): ExtensionMenuBarMenus {
  const commands = useTextmenuCommands(editor);
  const states = useTextmenuStates(editor);

  return useMemo<ExtensionMenuBarMenus>(
    () => ({
      file: [
        {
          type: 'menu',
          id: 'file-export',
          label: 'Export',
          items: [
            {
              type: 'action',
              id: 'export-txt',
              label: 'Plain text (.txt)',
              onSelect: () =>
                downloadFile(
                  `${fileBaseName}.txt`,
                  editor.getText(),
                  'text/plain',
                ),
            },
            {
              type: 'action',
              id: 'export-html',
              label: 'HTML (.html)',
              onSelect: () =>
                downloadFile(
                  `${fileBaseName}.html`,
                  editor.getHTML(),
                  'text/html',
                ),
            },
          ],
        },
      ],
      edit: [
        {
          type: 'action',
          id: 'edit-undo',
          label: 'Undo',
          shortcut: '⌘Z',
          onSelect: commands.onUndo,
          disabled: !states.canUndo,
        },
        {
          type: 'action',
          id: 'edit-redo',
          label: 'Redo',
          shortcut: '⌘⇧Z',
          onSelect: commands.onRedo,
          disabled: !states.canRedo,
        },
        { type: 'separator', id: 'edit-sep-1' },
        {
          type: 'action',
          id: 'edit-bold',
          label: 'Bold',
          shortcut: '⌘B',
          onSelect: commands.onBold,
          active: states.isBold,
        },
        {
          type: 'action',
          id: 'edit-italic',
          label: 'Italic',
          shortcut: '⌘I',
          onSelect: commands.onItalic,
          active: states.isItalic,
        },
        {
          type: 'action',
          id: 'edit-underline',
          label: 'Underline',
          shortcut: '⌘U',
          onSelect: commands.onUnderline,
          active: states.isUnderline,
        },
        {
          type: 'action',
          id: 'edit-strike',
          label: 'Strikethrough',
          onSelect: commands.onStrike,
          active: states.isStrike,
        },
        { type: 'separator', id: 'edit-sep-2' },
        {
          type: 'action',
          id: 'edit-code',
          label: 'Code',
          onSelect: commands.onCode,
          active: states.isCode,
        },
        {
          type: 'action',
          id: 'edit-codeblock',
          label: 'Code block',
          onSelect: commands.onCodeBlock,
        },
      ],
      view: [
        {
          type: 'action',
          id: 'view-editable',
          label: 'Editable',
          active: states.isEditable,
          onSelect: () => editor.setEditable(!editor.isEditable),
        },
      ],
    }),
    [editor, fileBaseName, commands, states],
  );
}
