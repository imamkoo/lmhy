"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  checkMitraUsernameAction,
  submitMitraApplication,
} from "@/app/actions/mitra";
import {
  validateMitraDraft,
  type PsikologDraft,
  type ValidationIssue,
} from "@/lib/mitra/application-schema";
import MitraField from "./MitraField";
import MitraStepper from "./MitraStepper";
import DocumentUploader from "./DocumentUploader";
const provinces = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Jambi",
  "Sumatera Selatan",
  "Bengkulu",
  "Lampung",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Banten",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Sulawesi Tengah",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Gorontalo",
  "Sulawesi Barat",
  "Maluku",
  "Maluku Utara",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua",
  "Papua Selatan",
  "Papua Tengah",
  "Papua Pegunungan",
];
const initial: PsikologDraft = {
  track: "KLINIS",
  applicantName: "",
  applicantEmail: "",
  whatsapp: "",
  domicileProvince: "",
  domicileCity: "",
  username: "",
  password: "",
  academicTitle: "",
  s2Campus: "",
  s2GraduationYear: 0,
  specialization: "",
  strNumber: "",
  sipStatus: "AKTIF",
  currentPractice: "",
  yearsExperience: "",
  flightHours: "",
  modalities: [],
  motivation: "",
  ethicsAccepted: false,
  dataAccuracyAccepted: false,
};
export default function PsikologApplicationForm() {
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<{
    id: string;
    token?: string;
  } | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, string>>(
    {},
  );
  const [pending, startTransition] = useTransition();
  const started = useRef<number | null>(null);
  if (started.current === null) {
    started.current = new Date().getTime();
  }
  const elapsed = () => new Date().getTime() - (started.current ?? 0);
  useEffect(() => {
    if (draft.username.length < 3) return;
    const t = setTimeout(
      () =>
        void checkMitraUsernameAction(draft.username).then((r) =>
          setSuggestions(r.suggestions),
        ),
      400,
    );
    return () => clearTimeout(t);
  }, [draft.username]);
  const err = (f: string) => issues.find((i) => i.field === f)?.message;
  const set = (field: keyof PsikologDraft, value: unknown) =>
    setDraft((d) => ({ ...d, [field]: value }));
  const next = () => {
    const result = validateMitraDraft({
      ...draft,
      formElapsedMs: elapsed(),
    });
    setIssues(result.issues);
    if (
      step < 3 &&
      !result.issues.some((i) =>
        [
          "applicantName",
          "applicantEmail",
          "whatsapp",
          "domicileProvince",
          "domicileCity",
          "username",
          "password",
          "academicTitle",
          "s2Campus",
          "s2GraduationYear",
          "specialization",
          "strNumber",
          "sipStatus",
          "currentPractice",
          "yearsExperience",
          "modalities",
          "motivation",
        ].includes(i.field),
      )
    )
      setStep((step + 1) as 1 | 2 | 3);
  };
  const submit = () => {
    const result = validateMitraDraft({
      ...draft,
      formElapsedMs: elapsed(),
    });
    setIssues(result.issues);
    if (!result.ok) return;
    startTransition(async () => {
      const r = await submitMitraApplication({
        ...draft,
        formElapsedMs: elapsed(),
      });
      if (r.ok && r.applicationId)
        setSubmitted({ id: r.applicationId, token: r.uploadToken });
    });
  };
  if (submitted)
    return (
      <main className="min-h-screen bg-[#FBF8F5] p-6">
        <h1 className="text-3xl font-bold text-[#3C3163]">
          Cek email untuk verifikasi
        </h1>
        <p className="my-4">Pengajuan Anda sudah diterima.</p>
        <DocumentUploader
          docType="STR"
          applicationId={submitted.id}
          uploadToken={submitted.token}
          onError={alert}
          onStatusChange={(status) =>
            setUploadStatuses((s) => ({ ...s, STR: status }))
          }
        />
        <p aria-live="polite">STR: {uploadStatuses.STR ?? "belum diunggah"}</p>
        <DocumentUploader
          docType="CV"
          applicationId={submitted.id}
          uploadToken={submitted.token}
          onError={alert}
          onStatusChange={(status) =>
            setUploadStatuses((s) => ({ ...s, CV: status }))
          }
        />
        <p aria-live="polite">CV: {uploadStatuses.CV ?? "belum diunggah"}</p>
      </main>
    );
  return (
    <main className="min-h-screen bg-[#FBF8F5] p-4 text-[#3C3163]">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Daftar sebagai psikolog</h1>
        <MitraStepper
          current={step}
          labels={["Identitas", "Kredensial", "Komitmen"]}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 3) {
              submit();
            } else {
              next();
            }
          }}
          className="space-y-4 rounded-[28px] bg-white p-6"
        >
          {step === 1 && (
            <>
              <MitraField
                label="Nama lengkap + gelar"
                name="applicantName"
                error={err("applicantName")}
              >
                <input
                  id="applicantName"
                  aria-invalid={Boolean(err("applicantName"))}
                  aria-describedby={
                    err("applicantName") ? "applicantName-error" : undefined
                  }
                  value={draft.applicantName}
                  onChange={(e) => set("applicantName", e.target.value)}
                  className="w-full rounded-xl border p-3"
                />
              </MitraField>
              {(
                [
                  ["applicantEmail", "Email"],
                  ["whatsapp", "WhatsApp"],
                  ["domicileCity", "Kota"],
                  ["username", "Username"],
                  ["password", "Kata sandi"],
                ] as const
              ).map(([f, l]) => (
                <MitraField key={f} label={l} name={f} error={err(f)}>
                  <input
                    id={f}
                    aria-invalid={Boolean(err(f))}
                    aria-describedby={err(f) ? `${f}-error` : undefined}
                    type={f === "password" ? "password" : "text"}
                    value={String(draft[f])}
                    onChange={(e) => set(f, e.target.value)}
                    className="w-full rounded-xl border p-3"
                  />
                  {f === "username" && suggestions.length > 0 && (
                    <p>Saran: {suggestions.join(", ")}</p>
                  )}
                </MitraField>
              ))}
              <MitraField
                label="Provinsi"
                name="domicileProvince"
                error={err("domicileProvince")}
              >
                <select
                  id="domicileProvince"
                  aria-invalid={Boolean(err("domicileProvince"))}
                  aria-describedby={
                    err("domicileProvince")
                      ? "domicileProvince-error"
                      : undefined
                  }
                  value={draft.domicileProvince}
                  onChange={(e) => set("domicileProvince", e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="">Pilih provinsi</option>
                  {provinces.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </MitraField>
            </>
          )}
          {step === 2 && (
            <>
              {(
                [
                  ["academicTitle", "Gelar"],
                  ["s2Campus", "Kampus S2"],
                  ["strNumber", "Nomor STR"],
                  ["currentPractice", "Tempat praktik saat ini"],
                ] as const
              ).map(([f, l]) => (
                <MitraField key={f} label={l} name={f} error={err(f)}>
                  <input
                    id={f}
                    aria-invalid={Boolean(err(f))}
                    aria-describedby={err(f) ? `${f}-error` : undefined}
                    value={String(draft[f])}
                    onChange={(e) => set(f, e.target.value)}
                    className="w-full rounded-xl border p-3"
                  />
                </MitraField>
              ))}
              <MitraField
                label="Ringkasan pengalaman & motivasi"
                name="motivation"
                error={err("motivation")}
              >
                <textarea
                  id="motivation"
                  aria-invalid={Boolean(err("motivation"))}
                  aria-describedby={
                    err("motivation") ? "motivation-error" : undefined
                  }
                  value={draft.motivation}
                  onChange={(e) => set("motivation", e.target.value)}
                  className="w-full rounded-xl border p-3"
                  rows={6}
                />
              </MitraField>
              <MitraField
                label="Tahun lulus S2"
                name="s2GraduationYear"
                error={err("s2GraduationYear")}
              >
                <input
                  id="s2GraduationYear"
                  aria-invalid={Boolean(err("s2GraduationYear"))}
                  aria-describedby={
                    err("s2GraduationYear")
                      ? "s2GraduationYear-error"
                      : undefined
                  }
                  type="number"
                  onChange={(e) =>
                    set("s2GraduationYear", Number(e.target.value))
                  }
                  className="w-full rounded-xl border p-3"
                />
              </MitraField>
              {["VIDEO", "VOICE", "CHAT"].map((m) => (
                <label key={m} htmlFor={`modality-${m}`} className="mr-4">
                  <input
                    id={`modality-${m}`}
                    type="checkbox"
                    checked={draft.modalities.includes(m)}
                    aria-invalid={Boolean(err("modalities"))}
                    aria-describedby={
                      err("modalities") ? "modalities-error" : undefined
                    }
                    onChange={(e) =>
                      set(
                        "modalities",
                        e.target.checked
                          ? [...draft.modalities, m]
                          : draft.modalities.filter((x) => x !== m),
                      )
                    }
                  />{" "}
                  {m}
                </label>
              ))}
              {err("modalities") && (
                <p id="modalities-error" role="alert" className="text-red-600">
                  {err("modalities")}
                </p>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <label htmlFor="dataAccuracyAccepted">
                <input
                  id="dataAccuracyAccepted"
                  type="checkbox"
                  checked={draft.dataAccuracyAccepted}
                  aria-invalid={Boolean(err("dataAccuracyAccepted"))}
                  aria-describedby={
                    err("dataAccuracyAccepted") ? "pledges-error" : undefined
                  }
                  onChange={(e) =>
                    set("dataAccuracyAccepted", e.target.checked)
                  }
                />{" "}
                Saya menyatakan data benar
              </label>
              <label htmlFor="ethicsAccepted">
                <input
                  id="ethicsAccepted"
                  type="checkbox"
                  checked={draft.ethicsAccepted}
                  aria-invalid={Boolean(err("ethicsAccepted"))}
                  aria-describedby={
                    err("ethicsAccepted") ? "pledges-error" : undefined
                  }
                  onChange={(e) => set("ethicsAccepted", e.target.checked)}
                />{" "}
                Saya menyetujui{" "}
                <a href="/mitra/pakta-etika" className="underline">
                  kode etik
                </a>
              </label>
              {(err("ethicsAccepted") || err("dataAccuracyAccepted")) && (
                <p id="pledges-error" role="alert" className="text-red-600">
                  {err("ethicsAccepted") || err("dataAccuracyAccepted")}
                </p>
              )}
              <input
                name="website"
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
            </>
          )}
          <button
            disabled={pending}
            className="rounded-full bg-[#3C3163] px-5 py-3 text-white"
          >
            {step === 3 ? "Kirim pengajuan" : "Lanjut"}
          </button>
        </form>
      </div>
    </main>
  );
}
