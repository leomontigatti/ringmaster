import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog.tsx";

/**
 * Asks before a destructive action; `confirmLabel` repeats the action's name.
 * A question with two answers (`alternative`), or one whose action loses
 * nothing (`destructive: false`), shows no answer as destructive, and leaves
 * `Cancelar` the quietest.
 */
export function ConfirmDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel: string;
  onConfirm: () => void;
  alternative?: { label: string; onSelect: () => void };
  /** Whether confirming loses something; `false` for an action that only moves work along. */
  destructive?: boolean;
}) {
  const { alternative } = props;
  // In this order: closing first would read as a dismissal, and undo what confirming does.
  function answer(choose: () => void) {
    choose();
    props.onOpenChange(false);
  }

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      {/* Wide enough at the design width for three buttons in a row. */}
      <AlertDialogContent className={alternative && "data-[size=default]:sm:max-w-md"}>
        <AlertDialogHeader>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant={alternative ? "ghost" : "outline"}>
            {props.cancelLabel ?? "Cancelar"}
          </AlertDialogCancel>
          {alternative && (
            <AlertDialogAction variant="outline" onClick={() => answer(alternative.onSelect)}>
              {alternative.label}
            </AlertDialogAction>
          )}
          <AlertDialogAction
            variant={alternative || props.destructive === false ? "default" : "destructive"}
            onClick={() => answer(props.onConfirm)}
          >
            {props.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
