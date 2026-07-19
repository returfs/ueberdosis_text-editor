import { ArrowCounterClockwise } from '@phosphor-icons/react';
import {
  Button,
  ColorButton,
  HexColorKey,
  Input,
} from '@returfs/shared-external-react';
import React, { useCallback, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

export type ColorPickerProps = {
  color?: string;
  onChange?: (color: string) => void;
  onClear?: () => void;
};

export const ColorPicker = ({ color, onChange, onClear }: ColorPickerProps) => {
  const [colorInputValue, setColorInputValue] = useState(color || '');

  const handleColorUpdate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setColorInputValue(event.target.value);
    },
    [],
  );

  const handleColorChange = useCallback(() => {
    const isCorrectColor = /^#([0-9A-F]{3}){1,2}$/i.test(colorInputValue);

    if (!isCorrectColor) {
      if (onChange) {
        onChange('');
      }

      return;
    }

    if (onChange) {
      onChange(colorInputValue);
    }
  }, [colorInputValue, onChange]);

  return (
    <div className="flex flex-col gap-2">
      <HexColorPicker
        className="w-full"
        color={color || ''}
        onChange={onChange}
      />
      <Input
        type="text"
        placeholder="#000000"
        value={colorInputValue}
        onChange={handleColorUpdate}
        onBlur={handleColorChange}
      />
      <div className="flex max-w-[15rem] flex-wrap items-center gap-2">
        {Object.values(HexColorKey).map(currentColor => (
          <ColorButton
            isActive={currentColor === color}
            color={currentColor}
            key={currentColor}
            onClick={() => {
              if (onChange) {
                onChange(currentColor);
              }
            }}
          />
        ))}
        <Button size="icon" onClick={onClear}>
          <ArrowCounterClockwise alt="Reset color to default" />
        </Button>
      </div>
    </div>
  );
};
