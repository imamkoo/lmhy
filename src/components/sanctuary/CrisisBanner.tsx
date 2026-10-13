export interface CrisisBannerProps {
  className?: string;
}

export default function CrisisBanner({ className = "" }: CrisisBannerProps) {
  return (
    <aside
      className={`rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6 ${className}`}
    >
      <h3 className="text-base font-bold">Bantuan Selalu Tersedia</h3>
      <p className="mt-2 text-sm leading-relaxed opacity-80">
        Kamu sangat berharga dan tidak harus menanggung ini sendirian. Jika kamu
        sedang dalam kondisi darurat atau berpikir untuk menyakiti diri, hubungi
        layanan berikut sekarang.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href="tel:+628113815472"
          className="inline-flex flex-1 flex-col rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
            LISA — Pendamping Krisis
          </span>
          <span className="mt-1 text-lg font-bold">0811-3815-472</span>
        </a>
        <a
          href="tel:119"
          className="inline-flex flex-1 flex-col rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Kemenkes — Layanan Darurat
          </span>
          <span className="mt-1 text-lg font-bold">119 ext 8</span>
        </a>
      </div>
    </aside>
  );
}
