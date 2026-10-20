export default function MitraStepper({
  current,
  labels,
}: {
  current: 1 | 2 | 3;
  labels: string[];
}) {
  return (
    <nav
      aria-label={`Langkah ${current} dari ${labels.length}`}
      className="flex gap-2"
    >
      {labels.map((label, i) => (
        <div
          key={label}
          aria-current={current === i + 1 ? "step" : undefined}
          className={`flex-1 rounded-full px-2 py-2 text-center text-xs ${current === i + 1 ? "bg-[#3C3163] text-white" : "bg-[#eee8e3] text-slate-500"}`}
        >
          {i + 1}. {label}
        </div>
      ))}
    </nav>
  );
}
