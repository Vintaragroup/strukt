import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIPreferencesState {
  beginnerMode: boolean;
  setBeginnerMode: (value: boolean) => void;
}

const STORAGE_KEY = "strukt-ui-preferences";

export const useUIPreferences = create<UIPreferencesState>()(
  persist(
    (set) => ({
      beginnerMode: false,
      setBeginnerMode: (value) => set({ beginnerMode: value }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          const store = new Map<string, string>();
          const memoryStorage: Storage = {
            get length() {
              return store.size;
            },
            clear: () => {
              store.clear();
            },
            getItem: (key: string) => store.get(key) ?? null,
            key: (index: number) => Array.from(store.keys())[index] ?? null,
            removeItem: (key: string) => {
              store.delete(key);
            },
            setItem: (key: string, value: string) => {
              store.set(key, value);
            },
          } as Storage;
          return memoryStorage;
        }
        return window.localStorage;
      }),
      partialize: (state) => ({
        beginnerMode: state.beginnerMode,
      }),
    }
  )
);
