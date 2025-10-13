import React, { Fragment } from 'react';
import { useCallback } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Surface,
} from '@returfs/shared-external-react';

const FONT_FAMILY_GROUPS = [
  {
    label: 'Sans Serif',
    options: [
      { label: 'Inter', value: '' },
      { label: 'Arial', value: 'Arial' },
      { label: 'Helvetica', value: 'Helvetica' },
    ],
  },
  {
    label: 'Serif',
    options: [
      { label: 'Times New Roman', value: 'Times' },
      { label: 'Garamond', value: 'Garamond' },
      { label: 'Georgia', value: 'Georgia' },
    ],
  },
  {
    label: 'Monospace',
    options: [
      { label: 'Courier', value: 'Courier' },
      { label: 'Courier New', value: 'Courier New' },
    ],
  },
];

const FONT_FAMILIES = FONT_FAMILY_GROUPS.flatMap(group => [
  group.options,
]).flat();

export type FontFamilyPickerProps = {
  onChange: (value: string) => void; // eslint-disable-line no-unused-vars
  value: string;
};

export const FontFamilyPicker = ({
  onChange,
  value,
}: FontFamilyPickerProps) => {
  const currentValue = FONT_FAMILIES.find(size => size.value === value);
  const currentFontLabel = currentValue?.label.split(' ')[0] || 'Inter';

  const selectFont = useCallback(
    (font: string) => () => onChange(font),
    [onChange],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-8"
          variant="outline"
          isActive={!!currentValue?.value}
        >
          {currentFontLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent asChild>
        <Surface className="flex flex-col gap-1 px-2 py-4">
          {FONT_FAMILY_GROUPS.map(group => (
            <div
              className="mt-2.5 flex flex-col gap-0.5 first:mt-0"
              key={group.label}
            >
              <DropdownMenuLabel className="text-[.65rem] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                {group.label}
              </DropdownMenuLabel>
              {group.options.map(font => (
                <Button
                  variant="menu"
                  isActive={value === font.value}
                  onClick={selectFont(font.value)}
                  key={`${font.label}_${font.value}`}
                >
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </Button>
              ))}
            </div>
          ))}
        </Surface>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
