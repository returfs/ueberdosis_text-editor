import React, { Fragment } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Surface,
} from '@returfs/shared-external-react';
import { useCallback } from 'react';

const FONT_SIZES = [
  { label: 'Smaller', value: '12px' },
  { label: 'Small', value: '14px' },
  { label: 'Medium', value: '' },
  { label: 'Large', value: '18px' },
  { label: 'Extra Large', value: '24px' },
];

export type FontSizePickerProps = {
  onChange: (value: string) => void; // eslint-disable-line no-unused-vars
  value: string;
};

export const FontSizePicker = ({ onChange, value }: FontSizePickerProps) => {
  const currentValue = FONT_SIZES.find(size => size.value === value);
  const currentSizeLabel = currentValue?.label.split(' ')[0] || 'Medium';

  const selectSize = useCallback(
    (size: string) => () => onChange(size),
    [onChange],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8" isActive={!!currentValue?.value}>
          {currentSizeLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent asChild>
        <Surface className="flex flex-col gap-1 px-2 py-4">
          {FONT_SIZES.map(size => (
            <Button
              variant="menu"
              isActive={value === size.value}
              onClick={selectSize(size.value)}
              key={`${size.label}_${size.value}`}
            >
              <span style={{ fontSize: size.value }}>{size.label}</span>
            </Button>
          ))}
        </Surface>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
