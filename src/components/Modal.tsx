"use client";

import { useEffect, useRef } from "react";

/** Native <dialog> modal: focus trap, Esc to close and inert background for free. */
export function Modal({
  open,
  onClose,
  label,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t === ref.current || t.hasAttribute("data-backdrop")) onClose();
      }}
      className={`m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-paper backdrop:bg-black/80 backdrop:backdrop-blur-md open:fade-in ${className}`}
    >
      {open && children}
    </dialog>
  );
}

export function CloseButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Fechar"
      className={`grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-ink-0/60 text-mute backdrop-blur transition-colors hover:text-paper ${className}`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
