// frontend/apps/web/app/home/_components/ConfirmDialog.tsx
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@kit/ui/alert-dialog";
  import { Button } from "@kit/ui/button";
  
  interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive";
  }
  
  export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default"
  }: ConfirmDialogProps) {
    const handleConfirm = () => {
      onConfirm();
    };
  
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }