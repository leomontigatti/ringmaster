import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { z } from "zod";

import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { useVariantKeys } from "#/hooks/use-variant-keys.ts";

// PROTOTYPE (prototype/catalog): the floating bar that switches a screen's
// variants through `?variant=`, and the badge that marks a pattern no screen
// uses yet. Never shown in a production build.

export type VariantKey = "A" | "B" | "C";

const variantKeys: VariantKey[] = ["A", "B", "C"];

export const variantNames: Record<VariantKey, string> = {
  A: "Tabla + diálogo",
  B: "Maestro-detalle",
  C: "Páginas",
};

/** A route's `validateSearch` for the variant, A when missing or unknown. */
export const variantSearch = z.object({
  variant: z.enum(["A", "B", "C"]).optional().catch(undefined),
});

export function PrototypeSwitcher(props: {
  current: VariantKey;
  onChange: (variant: VariantKey) => void;
}) {
  const index = variantKeys.indexOf(props.current);
  const step = (delta: number) =>
    props.onChange(variantKeys[(index + delta + variantKeys.length) % variantKeys.length] ?? "A");
  useVariantKeys(step);
  if (import.meta.env.PROD) {
    return null;
  }
  return (
    <div
      role="toolbar"
      aria-label="Variantes del prototipo"
      className="bg-primary text-primary-foreground fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full p-1 shadow-lg"
    >
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label="Variante anterior"
        onClick={() => step(-1)}
      >
        <ChevronLeftIcon />
      </Button>
      <span className="min-w-44 text-center text-sm font-medium" aria-live="polite">
        {props.current} ({variantNames[props.current]})
      </span>
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label="Variante siguiente"
        onClick={() => step(1)}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}

/** Beside a pattern no current screen uses, so the reviewer judges it knowingly. */
export function NewBadge() {
  return <Badge variant="outline">new</Badge>;
}
