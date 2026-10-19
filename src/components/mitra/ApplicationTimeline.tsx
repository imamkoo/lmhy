import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";
import { APPLICATION_STATUS_LABELS } from "@/lib/mitra/application-labels";

const labels = { SEBAYA: "Pendamping Sebaya", KLINIS: "Psikolog" };

export default function ApplicationTimeline({
  applications,
}: {
  applications: Tables<"provider_applications">[];
}) {
  if (!applications.length)
    return (
      <p className="rounded-[28px] bg-white p-6">Belum ada pengajuan mitra.</p>
    );
  return (
    <section className="space-y-4">
      {applications.map((application) => (
        <article
          key={application.id}
          className="rounded-[28px] bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-xl font-bold text-[#3C3163]">
              {labels[application.track]}
            </h2>
            <span className="rounded-full bg-[hsl(344,81%,87%)] px-3 py-1 text-xs font-semibold">
              {APPLICATION_STATUS_LABELS[application.status]}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Diajukan{" "}
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
              new Date(application.applied_at),
            )}
          </p>
          {application.decided_at && (
            <p className="mt-1 text-sm text-slate-600">
              Ditinjau{" "}
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
                new Date(application.decided_at),
              )}
            </p>
          )}
          {application.decision_note && (
            <p className="mt-4 rounded-xl bg-[#FBF8F5] p-3 text-sm">
              Catatan tim: {application.decision_note}
            </p>
          )}
          {(application.status === "REJECTED" ||
            application.status === "EXPIRED") && (
            <Link
              href={`/mitra/pendamping?resubmit=${application.id}`}
              className="mt-4 inline-flex text-sm font-semibold text-[#3C3163] underline"
            >
              Perbaiki &amp; Ajukan Ulang
            </Link>
          )}
        </article>
      ))}
    </section>
  );
}
