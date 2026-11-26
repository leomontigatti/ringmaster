import { useEffect } from "react";

// PROTOTYPE (prototype/catalog): the arrow keys step the prototype switcher,
// unless the focus is somewhere that reads them itself.

const ownsArrows = "input, textarea, [contenteditable], [role=dialog], [role=menu], [role=listbox]";

export function useVariantKeys(onStep: (delta: number) => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      const target = event.target;
      if (target instanceof Element && target.closest(ownsArrows)) {
        return;
      }
      onStep(event.key === "ArrowLeft" ? -1 : 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStep]);
}
