import { Icon as PhosphorIcon, Plus } from '@phosphor-icons/react';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
    (activeItem?.type === 'option' && activeItem.icon) || Plus;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          isActive={activeItem?.id !== 'paragraph' && !!activeItem?.type}
        >
          <ContentTypePickerIcon alt="Pick" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent asChild>
        <Command className="h-full shadow-none" shouldFilter={true}>
          <div className="relative flex items-center [&_svg]:size-5">
            <CommandInput
              placeholder="Search..."
              className="px-2 py-1 text-base md:text-sm"
              autoFocus
            />
          </div>
          <CommandList className="relative max-h-[320px] flex-1 overflow-y-auto p-2">
            {options.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            <CommandGroup>
              {options.map(option => {
                if (isOption(option)) {
                  const Icon = option.icon;
                  return (
                    <CommandItem
                      key={option.id}
                      onSelect={option.onClick}
                      disabled={option.disabled()}
                      className={option.isActive() ? 'bg-accent' : ''}
                    >
                      <Icon /> {option.label}
                    </CommandItem>
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
                return null;
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
