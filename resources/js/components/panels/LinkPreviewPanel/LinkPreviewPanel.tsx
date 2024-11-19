import React from 'react';
import {
  Button,
  Separator,
  Surface,
  Tooltip,
  TooltipProvider,
} from '@returfs/shared-external-react';
import { PencilSimple, TrashSimple } from '@phosphor-icons/react';

export type LinkPreviewPanelProps = {
  url: string;
  onEdit: () => void;
  onClear: () => void;
};

export const LinkPreviewPanel = ({
  onClear,
  onEdit,
  url,
}: LinkPreviewPanelProps) => {
  return (
    <Surface className="flex items-center gap-2 p-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm underline"
      >
        {url}
      </a>
      <Separator orientation="vertical" />
      <TooltipProvider>
        <Tooltip>
          <Button size="icon" onClick={onEdit}>
            <PencilSimple />
          </Button>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <Button size="icon" onClick={onClear}>
            <TrashSimple />
          </Button>
        </Tooltip>
      </TooltipProvider>
    </Surface>
  );
};
