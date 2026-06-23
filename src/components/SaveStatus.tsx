import {
  CheckCircle,
  CircleNotch,
  CloudSlash,
  WarningCircle,
} from '@phosphor-icons/react';
import clsx from 'clsx';
import type { ComponentType } from 'react';
import type { SaveState } from '../hooks/useSaveStatus';

const STATUS_MAP: Record<
  SaveState,
  {
    label: string;
    Icon: ComponentType<{ className?: string }>;
    className: string;
    spin?: boolean;
  }
> = {
  saved: {
    label: 'Saved',
    Icon: CheckCircle,
    className: 'text-neutral-400 dark:text-neutral-500',
  },
  saving: {
    label: 'Saving…',
    Icon: CircleNotch,
    className: 'text-amber-500',
    spin: true,
  },
  connecting: {
    label: 'Connecting…',
    Icon: CircleNotch,
    className: 'text-neutral-400',
    spin: true,
  },
  offline: {
    label: 'Offline — changes will sync',
    Icon: CloudSlash,
    className: 'text-neutral-400',
  },
  error: {
    label: 'Connection error',
    Icon: WarningCircle,
    className: 'text-red-500',
  },
};

/**
 * Small save/connection indicator (icon + label) for the editor header. Driven
 * by useSaveStatus(provider). The label collapses to icon-only on narrow widths.
 */
export function SaveStatus({ state }: { state: SaveState }) {
  const { label, Icon, className, spin } = STATUS_MAP[state];

  return (
    <span
      className={clsx(
        'flex shrink-0 items-center gap-1 whitespace-nowrap px-1 text-xs',
        className,
      )}
      title={label}
      aria-live="polite"
    >
      <Icon className={clsx('h-4 w-4', spin && 'animate-spin')} />
      <span className="hidden lg:inline">{label}</span>
    </span>
  );
}
