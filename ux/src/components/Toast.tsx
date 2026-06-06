import { useOpsStore } from "../store/useOpsStore";

// Transient bottom-center message (dispatch confirmations, refresh, etc.).
export default function Toast() {
  const flash = useOpsStore((s) => s.flash);
  if (!flash) return null;
  return <div className="toast glass">{flash}</div>;
}
