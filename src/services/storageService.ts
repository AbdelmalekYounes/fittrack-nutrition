// Seul point de contact de toute l'application avec window.localStorage.
// Aucun composant ni hook ne doit appeler localStorage directement : ils passent
// par ce service. Cette isolation permet, le jour venu, de remplacer le moteur de
// persistance (ex. Supabase) en ne touchant que ce fichier et le service au-dessus
// (voir backupService.ts et useAppData.ts), sans modifier les pages/composants.
export const storageService = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      // Stockage indisponible (navigation privée, quota) ou JSON corrompu.
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota dépassé ou stockage désactivé : la donnée reste en mémoire côté React uniquement.
    }
  },

  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignoré : rien à faire si le stockage est indisponible.
    }
  },

  clear(keys: readonly string[]): void {
    keys.forEach((key) => this.remove(key));
  },
};
