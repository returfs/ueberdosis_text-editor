import React, { useState, useCallback, useMemo, ChangeEvent } from 'react';
import { Link } from '@phosphor-icons/react';
import {
  Button,
  Input,
  Label,
  Surface,
  Switch,
} from '@returfs/shared-external-react';

export type LinkEditorPanelProps = {
  initialUrl?: string;
  initialOpenInNewTab?: boolean;
  onSetLink: (url: string, openInNewTab?: boolean) => void;
};

export const useLinkEditorState = ({
  initialUrl,
  initialOpenInNewTab,
  onSetLink,
}: LinkEditorPanelProps) => {
  const [url, setUrl] = useState(initialUrl || '');
  const [openInNewTab, setOpenInNewTab] = useState(
    initialOpenInNewTab || false,
  );

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  }, []);

  const isValidUrl = useMemo(() => /^(\S+):(\/\/)?\S+$/.test(url), [url]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isValidUrl) {
        onSetLink(url, openInNewTab);
      }
    },
    [url, isValidUrl, openInNewTab, onSetLink],
  );

  return {
    url,
    setUrl,
    openInNewTab,
    setOpenInNewTab,
    onChange,
    handleSubmit,
    isValidUrl,
  };
};

export const LinkEditorPanel = ({
  onSetLink,
  initialOpenInNewTab,
  initialUrl,
}: LinkEditorPanelProps) => {
  const state = useLinkEditorState({
    onSetLink,
    initialOpenInNewTab,
    initialUrl,
  });

  return (
    <Surface className="p-2">
      <form onSubmit={state.handleSubmit} className="flex items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Input
            icon={Link}
            type="url"
            placeholder="Enter URL"
            value={state.url}
            onChange={state.onChange}
          />
        </div>
        <Button type="submit" disabled={!state.isValidUrl}>
          Set Link
        </Button>
      </form>
      <div className="mt-3">
        <Label className="flex cursor-pointer items-center justify-start gap-2 text-sm font-semibold text-neutral-500 select-none dark:text-neutral-400">
          Open in new tab
          <Switch
            checked={state.openInNewTab}
            onCheckedChange={state.setOpenInNewTab}
          />
        </Label>
      </div>
    </Surface>
  );
};
