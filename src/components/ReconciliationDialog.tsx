import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  useT,
} from '@returfs/shared-external-react';
import React from 'react';

interface ReconciliationDialogProps {
  /** Whether the prompt is shown (controlled). */
  open: boolean;
  /** Disable actions while one is in flight. */
  busy: boolean;
  /** Keep the editor's (rich) version, overwriting the external plain edit. */
  onKeepMine: () => void;
  /** Discard the rich version and reload the externally edited plain file. */
  onReloadExternal: () => void;
}

/**
 * Shown when the plain file was edited outside the editor while a richer version
 * exists in the sidecar. Mirrors a desktop editor's "file changed on disk"
 * prompt: keep my version, or reload the external changes. Built entirely from
 * the shared AlertDialog primitive (@returfs/shared-external-react).
 */
export function ReconciliationDialog({
  open,
  busy,
  onKeepMine,
  onReloadExternal,
}: ReconciliationDialogProps) {
  const t = useT('ext:text-editor');

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('reconcile.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('reconcile.body')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} onClick={onReloadExternal}>
            {t('reconcile.reload')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="default"
            disabled={busy}
            onClick={onKeepMine}
          >
            {t('reconcile.keepMine')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
