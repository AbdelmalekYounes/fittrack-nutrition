import { useCallback, useState } from 'react';

/** Hook générique synchronisé avec une clé localStorage donnée. */
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // localStorage indisponible ou JSON corrompu : on retombe sur la valeur initiale.
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  const setStoredValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Quota dépassé ou stockage désactivé : on garde la valeur en mémoire seulement.
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setStoredValue] as const;
}
