import { Paragraph, Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Surface,
} from '@returfs/shared-external-react';
import React, { useMemo } from 'react';

export type ContentTypePickerOption = {
  label: string;
  id: string;
  type: 'option';
  disabled: () => boolean;
  isActive: () => boolean;
  onClick: () => void;
  icon: PhosphorIcon;
};

export type ContentTypePickerCategory = {
  label: string;
  id: string;
  type: 'category';
};

export type ContentPickerOptions = Array<
  ContentTypePickerOption | ContentTypePickerCategory
>;

export type ContentTypePickerProps = {
  options: ContentPickerOptions;
};

const isOption = (
  option: ContentTypePickerOption | ContentTypePickerCategory,
): option is ContentTypePickerOption => option.type === 'option';
const isCategory = (
  option: ContentTypePickerOption | ContentTypePickerCategory,
): option is ContentTypePickerCategory => option.type === 'category';

export const ContentTypePicker = ({ options }: ContentTypePickerProps) => {
  const activeItem = useMemo(
    () => options.find(option => option.type === 'option' && option.isActive()),
    [options],
  );

  const ContentTypePickerIcon =
    (activeItem?.type === 'option' && activeItem.icon) || Paragraph;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          isActive={activeItem?.id !== 'paragraph' && !!activeItem?.type}
        >
          <ContentTypePickerIcon alt="Pick" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent asChild>
        <Surface className="flex flex-col gap-1 px-2 py-4">
          {options.map(option => {
            if (isOption(option)) {
              const Icon = option.icon;
              return (
                <Button
                  variant="menu"
                  key={option.id}
                  isActive={option.isActive()}
                  onClick={option.onClick}
                >
                  <Icon /> {option.label}
                </Button>
              );
            } else if (isCategory(option)) {
              return (
                <DropdownMenuLabel
                  key={option.id}
                  className="text-[.65rem] font-semibold uppercase text-neutral-500 dark:text-neutral-400"
                >
                  {option.label}
                </DropdownMenuLabel>
              );
            }
          })}
        </Surface>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
