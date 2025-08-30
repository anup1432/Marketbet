import * as React from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onOpenChange, children, className }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 modal-overlay"
        onClick={() => onOpenChange(false)}
      />
      <div className={cn(
        "relative bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto",
        className
      )}>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          data-testid="button-close-modal"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
