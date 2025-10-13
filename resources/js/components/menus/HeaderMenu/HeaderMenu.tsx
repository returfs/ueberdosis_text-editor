import React from 'react';
import { Editor } from '@tiptap/react';
import { memo } from 'react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Surface,
} from '@returfs/shared-external-react';
import {
  Code,
  DotsThreeVertical,
  FileCode,
  Highlighter,
  Palette,
  Plus,
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
import { useTextmenuCommands } from './hooks/useTextmenuCommands';
import { useTextmenuStates } from './hooks/useTextmenuStates';
import { useTextmenuContentTypes } from './hooks/useTextmenuContentTypes';
import { ContentTypePicker } from './components/ContentTypePicker';
import { FontFamilyPicker } from './components/FontFamilyPicker';
import { FontSizePicker } from './components/FontSizePicker';
import { EditLinkPopover } from './components/EditLinkPopover';
import { ColorPicker } from '@/components/panels/Colorpicker';

// We memorize the button so each button is not rerendered
// on every editor state change
const MemoButton = memo(Button);
const MemoColorPicker = memo(ColorPicker);
const MemoFontFamilyPicker = memo(FontFamilyPicker);
const MemoFontSizePicker = memo(FontSizePicker);
const MemoContentTypePicker = memo(ContentTypePicker);

export type TextMenuProps = {
  editor: Editor;
};

export const HeaderMenu = ({ editor }: TextMenuProps) => {
  const commands = useTextmenuCommands(editor);
  const states = useTextmenuStates(editor);
  const blockOptions = useTextmenuContentTypes(editor);

  return (
    <div className="flex h-full flex-row items-center gap-1 overflow-x-scroll p-1 leading-none lg:gap-2">
      <MemoContentTypePicker options={blockOptions} />
      <MemoFontFamilyPicker
        onChange={commands.onSetFont}
        value={states.currentFont || ''}
      />
      <MemoFontSizePicker
        onChange={commands.onSetFontSize}
        value={states.currentSize || ''}
      />

      <Separator orientation="vertical" className="h-8" />

      <MemoButton
        size="icon"
        variant="outline"
        className="shrink-0"
        onClick={commands.onBold}
        isActive={states.isBold}
      >
        <TextB alt="Bold" />
      </MemoButton>

      <MemoButton
        size="icon"
        variant="outline"
        onClick={commands.onItalic}
        isActive={states.isItalic}
      >
        <TextItalic alt="Italic" />
      </MemoButton>

      <MemoButton
        size="icon"
        variant="outline"
        onClick={commands.onUnderline}
        isActive={states.isUnderline}
      >
        <TextUnderline alt="Underline" />
      </MemoButton>

      <MemoButton
        size="icon"
        variant="outline"
        onClick={commands.onStrike}
        isActive={states.isStrike}
      >
        <TextStrikethrough alt="Strikehrough" />
      </MemoButton>

      <MemoButton
        size="icon"
        variant="outline"
        onClick={commands.onCode}
        isActive={states.isCode}
      >
        <Code alt="Code" />
      </MemoButton>

      <MemoButton size="icon" variant="outline" onClick={commands.onCodeBlock}>
        <FileCode alt="Code Block" />
      </MemoButton>

      <EditLinkPopover onSetLink={commands.onLink} />

      <Popover>
        <PopoverTrigger asChild>
          <MemoButton
            size="icon"
            variant="outline"
            isActive={!!states.currentHighlight}
          >
            <Highlighter alt="Highlight Text" />
          </MemoButton>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={8}
          className="flex w-fit flex-col"
        >
          <MemoColorPicker
            color={states.currentHighlight}
            onChange={commands.onChangeHighlight}
            onClear={commands.onClearHighlight}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <MemoButton
            size="icon"
            variant="outline"
            isActive={!!states.currentColor}
          >
            <Palette alt="Text Color" />
          </MemoButton>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={8}
          className="flex w-fit flex-col"
        >
          <MemoColorPicker
            color={states.currentColor}
            onChange={commands.onChangeColor}
            onClear={commands.onClearColor}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <MemoButton size="icon" variant="outline">
            <DotsThreeVertical alt="Text Options" />
          </MemoButton>
        </PopoverTrigger>
        <PopoverContent side="top" sideOffset={8} asChild>
          <Surface className="flex w-fit flex-row gap-1 p-1">
            <MemoButton
              size="icon"
              variant="outline"
              isActive={states.isSubscript}
              onClick={commands.onSubscript}
            >
              <TextSubscript alt="Subscript" />
            </MemoButton>
            <MemoButton
              size="icon"
              variant="outline"
              isActive={states.isSuperscript}
              onClick={commands.onSuperscript}
            >
              <TextSuperscript alt="Superscript" />
            </MemoButton>
            <MemoButton
              size="icon"
              variant="outline"
              isActive={states.isAlignLeft}
              onClick={commands.onAlignLeft}
            >
              <TextAlignLeft alt="Align Left" />
            </MemoButton>
            <MemoButton
              size="icon"
              variant="outline"
              isActive={states.isAlignCenter}
              onClick={commands.onAlignCenter}
            >
              <TextAlignCenter alt="Align Center" />
            </MemoButton>
            <MemoButton
              size="icon"
              variant="outline"
              isActive={states.isAlignRight}
              onClick={commands.onAlignRight}
            >
              <TextAlignRight alt="Align Right" />
            </MemoButton>
            <MemoButton
              size="icon"
              variant="outline"
              isActive={states.isAlignJustify}
              onClick={commands.onAlignJustify}
            >
              <TextAlignJustify alt="Align Justify" />
            </MemoButton>
          </Surface>
        </PopoverContent>
      </Popover>
    </div>
  );
};
