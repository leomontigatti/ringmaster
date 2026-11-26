import { useSyncExternalStore } from "react";

// PROTOTYPE, wipe me (prototype/catalog): a list held in memory for the catalog
// screens' variants, shared by every route of the tab. A reload starts over.

export function createPrototypeStore<Row>(initial: Row[]) {
  let rows = initial;
  const listeners = new Set<() => void>();
  const get = () => rows;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  return {
    get,
    set(next: Row[]) {
      rows = next;
      for (const listener of listeners) {
        listener();
      }
    },
    useRows: () => useSyncExternalStore(subscribe, get, get),
  };
}
