import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// Sidebar card that collapses to just its header (with an optional summary badge).
export default function CollapsibleCard({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card glass">
      <button className="card-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="card-title">{icon}{title}</span>
        <span className="card-toggle-right">
          {!open && badge}
          <ChevronDown size={15} className={"chev" + (open ? " open" : "")} />
        </span>
      </button>
      {open && <div className="card-body">{children}</div>}
    </section>
  );
}
