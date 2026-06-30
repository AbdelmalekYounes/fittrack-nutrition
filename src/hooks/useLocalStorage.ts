import { useCallback, useState } from 'react';
import { storageService } from '../services/storageService';

/** Hook générique synchronisé avec une clé de stockage donnée (via storageService,
 * seul point de contact avec localStorage — voir services/storageService.ts). */
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const fallback = initialValue instanceof Function ? initialValue() : initialValue;
    return storageService.get(key, fallback);
  });

  const setStoredValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        storageService.set(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, setStoredValue] as const;
}
