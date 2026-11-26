import type { LucideIcon } from "lucide-react";
import { Children } from "react";
import type { ReactElement, ReactNode } from "react";

import { Button } from "#/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty.tsx";

/**
 * A page or a list with nothing to show. `description` says what would be here,
 * or what to try; `children` are the buttons that fix it, only those the viewer
 * may use.
 */
export function EmptyState(props: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  const Icon = props.icon;
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{props.title}</EmptyTitle>
        <EmptyDescription>{props.description}</EmptyDescription>
      </EmptyHeader>
      {Children.toArray(props.children).length > 0 && (
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">{props.children}</div>
        </EmptyContent>
      )}
    </Empty>
  );
}

/**
 * A button of an `EmptyState` that goes somewhere; `link` is its `Link`. The
 * first one is the main action, the rest are `outline`.
 */
export function EmptyStateLink(props: {
  link: ReactElement;
  variant?: "default" | "outline";
  children: ReactNode;
}) {
  return (
    <Button nativeButton={false} variant={props.variant} render={props.link}>
      {props.children}
    </Button>
  );
}
