import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

// Glass-morphism modal shell: a blurred translucent scrim keeps the map fuzzily
// visible behind, and the centered panel is itself semi-transparent (brief §3).
export default function Modal({
  onClose,
  children,
  className = "",
}: {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className={"modal " + className} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
