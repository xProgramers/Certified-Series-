"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCollection } from "@/app/actions/collection";
import type { ContentType } from "@/lib/card-types";

/** Starts a new viewing: a new in-progress card next to the finished one. */
export function RewatchButton({ type, id }: { type: ContentType; id: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await addToCollection({ contentType: type, contentId: id });
            if (!res.ok) return setError(res.error);
            router.refresh();
          })
        }
        className="text-sm text-mute underline-offset-4 hover:text-paper hover:underline disabled:opacity-60"
      >
        {pending ? "Adicionando…" : "Assistir de novo"}
      </button>
      {error && <span className="ml-3 text-xs text-danger">{error}</span>}
    </span>
  );
}
