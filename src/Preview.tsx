import { Suspense, lazy, memo, useEffect, useState } from 'react';
import {
  ColorKey,
  Entrance,
  ResourceSettingsData,
  formatBytes,
  useT,
} from '@returfs/shared-external-react';
import type {
  PreviewBridge,
  PreviewItem,
  PreviewProps,
  PreviewUnavailableReason,
} from '@returfs/extension-sdk';
import { documentTypeFor } from './document-types';
import { looksBinary } from './lib/codeFile';
import { previewBudgetFor, readPreviewText } from './lib/previewBudget';
import type { PreviewText } from './lib/previewBudget';
import { ViewerNotice, ViewerSurface } from './surfaces/ViewerSurface';

import './lib/i18n';
import './styles/app.css';

export { manifest } from './manifest';

/**
 * The code viewer is its own chunk here too: a `.md` preview should not
 * download CodeMirror and its grammars, and a `.php` one should not download
 * Tiptap.
 */
const CodeSurface = lazy(() =>
  import('./surfaces/CodeSurface').then(module => ({
    default: module.CodeSurface,
  })),
);

/**
 * The Text Editor's `./Preview` module: the file rendered the way the viewer
 * renders it (prose as prose, markdown as a document, source with syntax
 * colours), minus the header, the menu bar and the Edit action.
 *
 * Bytes come through the host bridge rather than the collab token route, so
 * no token is minted for a glance, and e2ee files arrive decrypted. A big
 * file shows its head, within a budget the surface can render without
 * stalling (see lib/previewBudget.ts); binary bytes are declined through
 * `onUnavailable`, and the host shows the thumbnail.
 */
export default memo(function Preview({
  item,
  bridge,
  resourceSettings,
  onUnavailable,
}: PreviewProps) {
  const themeColor = (resourceSettings?.[ResourceSettingsData.ThemeColor] ??
    ColorKey.Gray) as ColorKey;

  return (
    <Entrance themeColor={themeColor}>
      <TextPreview
        key={`${item.id}:${item.updated_at ?? ''}`}
        item={item}
        bridge={bridge}
        onUnavailable={onUnavailable}
      />
    </Entrance>
  );
});

function TextPreview({
  item,
  bridge,
  onUnavailable,
}: {
  item: PreviewItem;
  bridge: PreviewBridge;
  onUnavailable: (reason: PreviewUnavailableReason) => void;
}) {
  const t = useT('ext:text-editor');
  const documentType = documentTypeFor(item.extension);
  const [preview, setPreview] = useState<PreviewText | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const blob = await bridge.getResource();
        if (cancelled) return;

        // Only the head of a big file is decoded: the rich surface builds
        // DOM for every paragraph, and a 1 MB notebook rendered as prose
        // once froze the whole app.
        const read = await readPreviewText(
          blob,
          previewBudgetFor(documentType.surface),
        );
        if (cancelled) return;

        // The same sniff the viewer runs on source files, applied to every
        // type here: a `.txt` that is really a binary dump renders as noise.
        if (looksBinary(read.text)) {
          onUnavailable('binary');
          return;
        }

        setPreview(read);
      } catch {
        if (!cancelled) onUnavailable('failed');
      }
    })();

    return () => {
      cancelled = true;
    };
    // The bridge is rebuilt by the host on every render; the item identity
    // is what decides when to read again.
  }, [item.id, item.updated_at]);

  if (preview === null) {
    return <ViewerNotice spinning message={t('viewer.loading')} />;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {documentType.surface === 'code' ? (
        <Suspense
          fallback={<ViewerNotice spinning message={t('viewer.loading')} />}
        >
          <CodeSurface
            text={preview.text}
            filename={`${item.name}.${item.extension}`}
          />
        </Suspense>
      ) : (
        <ViewerSurface
          documentType={documentType}
          text={preview.text}
          source={false}
        />
      )}
      {preview.truncated && (
        <p className="shrink-0 border-t border-neutral-200 px-3 py-1.5 text-center text-[11px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          {t('preview.truncated', {
            shown: formatBytes(preview.shownBytes),
            total: formatBytes(preview.totalBytes),
          })}
        </p>
      )}
    </div>
  );
}
