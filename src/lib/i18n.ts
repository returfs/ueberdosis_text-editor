/**
 * Register the extension's catalogues on the SHARED i18n singleton (the host
 * provides `@returfs/shared-external-react` as a federation singleton, so the
 * active locale is the host's). Imported for its side effect from
 * Extension.tsx, before first render.
 */
import { addExtensionCatalog } from '@returfs/shared-external-react';
import en from '../locales/en';
import fr from '../locales/fr';

addExtensionCatalog('text-editor', 'en', en);
addExtensionCatalog('text-editor', 'fr', fr);
