"use client";

import { Children, useState, type ReactNode } from "react";

export default function ExpandableList({ initial, children }: { initial: number; children: ReactNode }) {
  const all = Children.toArray(children);
  const [open, setOpen] = useState(false);
  const shown = open ? all : all.slice(0, initial);
  const hidden = all.length - initial;

  return (
    <>
      {shown}
      {hidden > 0 && (
        <button type="button" className="see-all" onClick={() => setOpen((v) => !v)}>
          {open ? "Mostra meno" : `Vedi tutti (${all.length})`}
        </button>
      )}
    </>
  );
}
