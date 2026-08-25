export default function SimulatedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
      ⚠ {label} — simulated for this demo
    </span>
  );
}
