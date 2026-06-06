import type { ReactNode } from "react";

export default function Stat({
  icon,
  label,
  children,
}: {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="stat">
      <div className="stat-h">
        {icon}
        <span>{label}</span>
      </div>
      <div className="stat-v">{children}</div>
    </div>
  );
}
