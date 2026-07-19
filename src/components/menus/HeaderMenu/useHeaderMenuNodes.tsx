import { ColorPicker } from '@/components/panels/Colorpicker';
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Code,
  FileCode,
  Highlighter,
  Palette,
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextSubscript,
  TextSuperscript,
  TextUnderline,
} from '@phosphor-icons/react';
import {
  Button,
  HeaderNode,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@returfs/shared-external-react';
import { Editor } from '@tiptap/react';
import { useMemo } from 'react';
import { ContentTypePicker } from './components/ContentTypePicker';
import { EditLinkPopover } from './components/EditLinkPopover';
import { FontFamilyPicker } from './components/FontFamilyPicker';
import { FontSizePicker } from './components/FontSizePicker';
import { useTextmenuCommands } from './hooks/useTextmenuCommands';
import { useTextmenuContentTypes } from './hooks/useTextmenuContentTypes';
import { useTextmenuStates } from './hooks/useTextmenuStates';

/**
 * Builds the editor's header as a declarative `HeaderNode[]` consumed by
 * `EntranceHeader`'s `menu` prop. The bar is HYBRID: frequently-used formatting
 * is `pinned` (compact icon buttons that survive collapse longest, declared
 * first), stateful pickers are `custom` escape-hatch nodes (reusing the existing
 * picker components verbatim), and the less-frequent paragraph controls live in a
 * labeled "Format" menu. `HeaderMenuBar` collapses whatever overflows the width
 * into a trailing "More" menu — no horizontal scrolling.
 */
export function useHeaderMenuNodes(editor: Editor): HeaderNode[] {
  const commands = useTextmenuCommands(editor);
  const states = useTextmenuStates(editor);
  const blockOptions = useTextmenuContentTypes(editor);

  return useMemo<HeaderNode[]>(
    () => [
      // --- Pinned: history ---
      {
        type: 'action',
        id: 'undo',
        label: 'Undo',
        shortcut: '⌘Z',
        icon: <ArrowCounterClockwise />,
        onSelect: commands.onUndo,
        disabled: !states.canUndo,
        pinned: true,
      },
      {
        type: 'action',
        id: 'redo',
        label: 'Redo',
        shortcut: '⌘⇧Z',
        icon: <ArrowClockwise />,
        onSelect: commands.onRedo,
        disabled: !states.canRedo,
        pinned: true,
      },
      { type: 'separator', id: 'sep-history' },

      // --- Block type + typography pickers (stateful) ---
      {
        type: 'custom',
        id: 'content-type',
        render: () => <ContentTypePicker options={blockOptions} />,
      },
      {
        type: 'custom',
        id: 'font-family',
        render: () => (
          <FontFamilyPicker
            onChange={commands.onSetFont}
            value={states.currentFont || ''}
          />
        ),
      },
      {
        type: 'custom',
        id: 'font-size',
        render: () => (
          <FontSizePicker
            onChange={commands.onSetFontSize}
            value={states.currentSize || ''}
          />
        ),
      },
      { type: 'separator', id: 'sep-typography' },

      // --- Pinned: inline marks ---
      {
        type: 'action',
        id: 'bold',
        label: 'Bold',
        shortcut: '⌘B',
        icon: <TextB />,
        onSelect: commands.onBold,
        active: states.isBold,
        pinned: true,
      },
      {
        type: 'action',
        id: 'italic',
        label: 'Italic',
        shortcut: '⌘I',
        icon: <TextItalic />,
        onSelect: commands.onItalic,
        active: states.isItalic,
        pinned: true,
      },
      {
        type: 'action',
        id: 'underline',
        label: 'Underline',
        shortcut: '⌘U',
        icon: <TextUnderline />,
        onSelect: commands.onUnderline,
        active: states.isUnderline,
        pinned: true,
      },
      {
        type: 'action',
        id: 'strike',
        label: 'Strikethrough',
        icon: <TextStrikethrough />,
        onSelect: commands.onStrike,
        active: states.isStrike,
        pinned: true,
      },
      {
        type: 'action',
        id: 'code',
        label: 'Code',
        icon: <Code />,
        onSelect: commands.onCode,
        active: states.isCode,
        pinned: true,
      },
      {
        type: 'action',
        id: 'code-block',
        label: 'Code block',
        icon: <FileCode />,
        onSelect: commands.onCodeBlock,
        pinned: true,
      },
      { type: 'separator', id: 'sep-marks' },

      // --- Link + colors (stateful popovers) ---
      {
        type: 'custom',
        id: 'link',
        render: () => <EditLinkPopover onSetLink={commands.onLink} />,
      },
      {
        type: 'custom',
        id: 'highlight',
        render: () => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                isActive={!!states.currentHighlight}
              >
                <Highlighter alt="Highlight Text" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={8}
              className="flex w-fit flex-col"
            >
              <ColorPicker
                color={states.currentHighlight}
                onChange={commands.onChangeHighlight}
                onClear={commands.onClearHighlight}
              />
            </PopoverContent>
          </Popover>
        ),
      },
      {
        type: 'custom',
        id: 'color',
        render: () => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                isActive={!!states.currentColor}
              >
                <Palette alt="Text Color" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={8}
              className="flex w-fit flex-col"
            >
              <ColorPicker
                color={states.currentColor}
                onChange={commands.onChangeColor}
                onClear={commands.onClearColor}
              />
            </PopoverContent>
          </Popover>
        ),
      },
      { type: 'separator', id: 'sep-color' },

      // --- "Format" menu (replaces the old ⋮ popover) ---
      {
        type: 'menu',
        id: 'format',
        label: 'Format',
        items: [
          {
            type: 'action',
            id: 'subscript',
            label: 'Subscript',
            icon: <TextSubscript />,
            onSelect: commands.onSubscript,
            active: states.isSubscript,
          },
          {
            type: 'action',
            id: 'superscript',
            label: 'Superscript',
            icon: <TextSuperscript />,
            onSelect: commands.onSuperscript,
            active: states.isSuperscript,
          },
          { type: 'separator', id: 'sep-format' },
          {
            type: 'action',
            id: 'align-left',
            label: 'Align left',
            icon: <TextAlignLeft />,
            onSelect: commands.onAlignLeft,
            active: states.isAlignLeft,
          },
          {
            type: 'action',
            id: 'align-center',
            label: 'Align center',
            icon: <TextAlignCenter />,
            onSelect: commands.onAlignCenter,
            active: states.isAlignCenter,
          },
          {
            type: 'action',
            id: 'align-right',
            label: 'Align right',
            icon: <TextAlignRight />,
            onSelect: commands.onAlignRight,
            active: states.isAlignRight,
          },
          {
            type: 'action',
            id: 'align-justify',
            label: 'Align justify',
            icon: <TextAlignJustify />,
            onSelect: commands.onAlignJustify,
            active: states.isAlignJustify,
          },
        ],
      },
    ],
    [commands, states, blockOptions],
  );
}
