import StatusCard from "./StatusCard";
import DispatchQueue from "./DispatchQueue";
import CrewSummary from "./CrewSummary";
import LayerToggles from "./LayerToggles";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <StatusCard />
      <DispatchQueue />
      <CrewSummary />
      <LayerToggles />
    </aside>
  );
}
