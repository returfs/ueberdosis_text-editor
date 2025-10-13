import React from 'react';
import { Link } from '@phosphor-icons/react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@returfs/shared-external-react';
import { LinkEditorPanel } from '@/components/panels/LinkEditorPanel';

export type EditLinkPopoverProps = {
  onSetLink: (link: string, openInNewTab?: boolean) => void;
};

export const EditLinkPopover = ({ onSetLink }: EditLinkPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline">
          <Link />
        </Button>
      </PopoverTrigger>
      <PopoverContent asChild>
        <LinkEditorPanel onSetLink={onSetLink} />
      </PopoverContent>
    </Popover>
  );
};
