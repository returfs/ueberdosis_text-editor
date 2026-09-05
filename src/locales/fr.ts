/** Catalogue français pour l’espace de noms ext:text-editor. */
export default {
  app: {
    title: 'Éditeur de texte',
  },
  mode: {
    view: 'Lire',
    edit: 'Modifier',
    done: 'Terminé',
    rendered: 'Rendu',
    source: 'Source',
    sourceHint: 'Le markdown derrière ce document.',
    sourceEditHint:
      'Modifiez directement le markdown. Vos changements s’appliquent au retour.',
  },
  viewer: {
    loading: 'Ouverture…',
    empty: 'Ce fichier est vide.',
    failed: 'Ce fichier n’a pas pu être ouvert.',
    retry: 'Réessayer',
    encryptedNeedsApp:
      'Ce document chiffré doit être ouvert depuis l’application.',
    tooLarge:
      'Ce fichier est trop volumineux pour être ouvert ici. Les fichiers jusqu’à 5 Mo s’ouvrent dans l’éditeur.',
    notText:
      'Ce fichier n’est pas du texte, il ne peut donc pas être ouvert dans l’éditeur.',
  },
  preview: {
    truncated:
      'Les premiers {{shown}} d’un fichier de {{total}} sont affichés.',
  },
  editor: {
    loading: 'Chargement…',
    retry: 'Réessayer',
    connectFailed: 'Connexion au serveur de collaboration impossible.',
    encryptedFailed: 'Ce document chiffré n’a pas pu être ouvert.',
    encryptedLabel: 'chiffré',
    connectionError: 'Erreur de connexion',
    saveFailed: 'Échec de l’enregistrement',
    othersOnline_one: '1 autre personne en ligne',
    othersOnline_many: '{{count}} autres personnes en ligne',
    othersOnline_other: '{{count}} autres personnes en ligne',
  },
  reconcile: {
    title: 'Ce fichier a changé en dehors de l’éditeur',
    body: 'Le fichier a été modifié ailleurs depuis votre dernier enregistrement ici. Gardez votre version (en remplaçant les changements externes), ou rechargez les changements externes (la mise en forme de ce document sera perdue).',
    reload: 'Recharger les changements externes',
    keepMine: 'Garder ma version',
  },
};
