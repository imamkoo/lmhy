"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  checkMitraUsernameAction,
  submitMitraApplication,
} from "@/app/actions/mitra";
import {
  validateMitraDraft,
  type PendampingDraft,
  type ValidationIssue,
} from "@/lib/mitra/application-schema";
import { INDONESIAN_PROVINCES } from "@/lib/mitra/provinces";
import DocumentUploader from "./DocumentUploader";
import MitraField from "./MitraField";
import MitraStepper from "./MitraStepper";

type InitialValues = Partial<
  Pick<
    PendampingDraft,
    | "applicantName"
    | "applicantEmail"
    | "username"
    | "whatsapp"
    | "domicileCity"
    | "domicileProvince"
  >
>;
const initialDraft: PendampingDraft = {
  track: "SEBAYA",
  applicantName: "",
  applicantEmail: "",
  whatsapp: "",
  domicileProvince: "",
  domicileCity: "",
  username: "",
  password: "",
  backgroundTrack: "PENYINTAS",
  motivation: "",
  personalExperience: "",
  availability: "",
  ethicsAccepted: false,
  dataAccuracyAccepted: false,
  waGroupConfirmed: false,
  pfaCommitment: false,
};
const fields: Record<1 | 2, string[]> = {
  1: [
    "applicantName",
    "applicantEmail",
    "whatsapp",
    "domicileProvince",
    "domicileCity",
    "username",
    "password",
    "backgroundTrack",
    "motivation",
    "personalExperience",
    "availability",
  ],
  2: [
    "ethicsAccepted",
    "dataAccuracyAccepted",
    "waGroupConfirmed",
    "pfaCommitment",
  ],
};

export default function PendampingApplicationForm({
  initialValues = {},
  waGroupUrl,
}: {
  initialValues?: InitialValues;
  waGroupUrl?: string;
}) {
  const [draft, setDraft] = useState<PendampingDraft>({
    ...initialDraft,
    ...initialValues,
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [attempted, setAttempted] = useState(new Set<number>());
  const [username, setUsername] = useState<{
    available?: boolean;
    error?: string;
    suggestions: string[];
  }>({ suggestions: [] });
  const [honeypot, setHoneypot] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{
    id: string;
    token?: string;
  } | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const started = useRef(Date.now());
  const set = (key: keyof PendampingDraft, value: unknown) =>
    setDraft((old) => ({ ...old, [key]: value }));
  const err = (key: string) =>
    attempted.has(step)
      ? issues.find((issue) => issue.field === key)?.message
      : undefined;
  useEffect(() => {
    if (
      draft.username.length < 3 ||
      draft.username === initialValues.username
    ) {
      if (draft.username === initialValues.username) {
        setUsername({ available: true, suggestions: [] });
      }
      return;
    }
    const timer = setTimeout(
      () => void checkMitraUsernameAction(draft.username).then(setUsername),
      400,
    );
    return () => clearTimeout(timer);
  }, [draft.username]);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setSecondsRemaining(
          Math.max(
            0,
            Math.ceil((5000 - (Date.now() - started.current)) / 1000),
          ),
        ),
      250,
    );
    return () => clearInterval(timer);
  }, []);
  const validate = () =>
    validateMitraDraft({
      ...draft,
      honeypot,
      formElapsedMs: Date.now() - started.current,
    });
  const goNext = () => {
    setAttempted((old) => new Set(old).add(step));
    const result = validate();
    setIssues(result.issues);
    if (!result.issues.some((issue) => fields[step].includes(issue.field)))
      setStep(2);
  };
  const submit = () => {
    if (secondsRemaining > 0) return;
    setAttempted(new Set([1, 2]));
    const result = validate();
    setIssues(result.issues);
    if (!result.ok) {
      if (
        result.issues.some(
          (issue) =>
            issue.field === "honeypot" || issue.field === "formElapsedMs",
        )
      ) {
        setError("Mohon tunggu sebentar sebelum mengirim.");
      }
      return;
    }
    startTransition(async () => {
      const answer = await submitMitraApplication({
        ...draft,
        honeypot,
        formElapsedMs: Date.now() - started.current,
      });
      if (answer.ok && answer.applicationId) {
        setSubmitted({ id: answer.applicationId, token: answer.uploadToken });
        return;
      }
      setError(answer.message || "Pengajuan belum dapat dikirim.");
      setIssues(answer.issues ?? []);
    });
  };
  if (submitted)
    return (
      <main className="min-h-screen bg-[#FBF8F5] p-8">
        <h1 className="font-heading text-3xl font-bold text-[#3C3163]">
          Pengajuan diterima
        </h1>
        <p className="mt-3">
          Cek email Anda untuk verifikasi. Sertifikat pelatihan bersifat
          opsional.
        </p>
        <DocumentUploader
          docType="TRAINING_CERT"
          applicationId={submitted.id}
          uploadToken={submitted.token}
          onError={setError}
        />
        <p role="alert">{error}</p>
        <a className="mt-4 inline-block underline" href="/akun?tab=pengajuan">
          Lihat pengajuan
        </a>
      </main>
    );
  const input = (
    name: keyof PendampingDraft,
    label: string,
    type = "text",
    readOnly = false,
  ) => (
    <MitraField label={label} name={name} error={err(name)}>
      <input
        id={name}
        type={type}
        value={String(draft[name])}
        readOnly={readOnly}
        aria-invalid={Boolean(err(name))}
        aria-describedby={err(name) ? `${name}-error` : undefined}
        onChange={(e) => set(name, e.target.value)}
      />
    </MitraField>
  );
  return (
    <main className="min-h-screen bg-[#FBF8F5] p-4 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-[#3C3163]">
          Daftar Pendamping Sebaya
        </h1>
        <p className="mt-2 text-slate-600">
          Sesi Dengar yang aman, empatik, dan non-klinis.
        </p>
        <MitraStepper
          current={step}
          labels={["Identitas & pengalaman", "Komitmen"]}
        />
        <form
          className="mt-6 space-y-5 pb-[96px]"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 1) goNext();
            else submit();
          }}
        >
          {error && <p role="alert">{error}</p>}
          {step === 1 && (
            <>
              <>
                {input("applicantName", "Nama lengkap")}
                {input(
                  "applicantEmail",
                  "Email",
                  "email",
                  Boolean(initialValues.applicantEmail),
                )}
                {initialValues.applicantEmail && (
                  <p className="text-sm text-slate-600">
                    Email akun tidak dapat diubah agar pengajuan tetap terhubung
                    dengan akun Anda.
                  </p>
                )}
                {input("whatsapp", "WhatsApp")}
                {input("domicileCity", "Kota")}
              </>
              <MitraField
                label="Provinsi"
                name="domicileProvince"
                error={err("domicileProvince")}
              >
                <select
                  id="domicileProvince"
                  value={draft.domicileProvince}
                  aria-invalid={Boolean(err("domicileProvince"))}
                  aria-describedby={
                    err("domicileProvince")
                      ? "domicileProvince-error"
                      : undefined
                  }
                  onChange={(e) => set("domicileProvince", e.target.value)}
                >
                  <option value="">Pilih provinsi</option>
                  {INDONESIAN_PROVINCES.map((province) => (
                    <option key={province}>{province}</option>
                  ))}
                </select>
              </MitraField>
              {input(
                "username",
                "Username",
                "text",
                Boolean(initialValues.username),
              )}
              {username.error && draft.username !== initialValues.username && (
                <p role="alert">{username.error}</p>
              )}
              {username.available && <p>Username tersedia</p>}
              {username.suggestions.map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => set("username", value)}
                >
                  {value}
                </button>
              ))}
              {input("password", "Kata sandi", "password")}
              <MitraField
                label="Latar belakang"
                name="backgroundTrack"
                error={err("backgroundTrack")}
              >
                <select
                  id="backgroundTrack"
                  value={draft.backgroundTrack}
                  aria-invalid={Boolean(err("backgroundTrack"))}
                  aria-describedby={
                    err("backgroundTrack") ? "backgroundTrack-error" : undefined
                  }
                  onChange={(e) => set("backgroundTrack", e.target.value)}
                >
                  {[
                    ["PENYINTAS", "Penyintas"],
                    ["PEMERHATI", "Pemerhati"],
                    ["MAHASISWA", "Mahasiswa S1 Psikologi"],
                    ["LAINNYA", "Lainnya"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </MitraField>
              <MitraField
                label="Motivasi"
                name="motivation"
                error={err("motivation")}
                hint={`${draft.motivation.length}/200 karakter minimum`}
              >
                <textarea
                  id="motivation"
                  value={draft.motivation}
                  aria-invalid={Boolean(err("motivation"))}
                  aria-describedby={
                    err("motivation") ? "motivation-error" : undefined
                  }
                  onChange={(e) => set("motivation", e.target.value)}
                />
              </MitraField>
              <MitraField
                label="Pengalaman mendengarkan atau merawat"
                name="personalExperience"
                error={err("personalExperience")}
                hint={`${draft.personalExperience.length}/80 karakter minimum`}
              >
                <textarea
                  id="personalExperience"
                  value={draft.personalExperience}
                  aria-invalid={Boolean(err("personalExperience"))}
                  aria-describedby={
                    err("personalExperience")
                      ? "personalExperience-error"
                      : undefined
                  }
                  onChange={(e) => set("personalExperience", e.target.value)}
                />
              </MitraField>
              {input("availability", "Ketersediaan waktu")}
            </>
          )}
          {step === 2 && (
            <>
              <p className="rounded-2xl bg-white p-4 text-sm">
                Peran ini hanya Sesi Dengar: tidak mendiagnosis, tidak
                meresepkan obat, dan wajib merujuk anggota ke tenaga
                profesional. Dalam krisis, segera arahkan ke layanan darurat
                atau bantuan profesional.
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={draft.ethicsAccepted}
                  onChange={(e) => set("ethicsAccepted", e.target.checked)}
                />{" "}
                Saya menyetujui{" "}
                <a className="underline" href="/mitra/pakta-etika">
                  pakta etika Sesi Dengar
                </a>
                .
              </label>
              {err("ethicsAccepted") && (
                <p id="ethicsAccepted-error" role="alert">
                  {err("ethicsAccepted")}
                </p>
              )}
              <p>
                Komunitas WhatsApp ({draft.whatsapp}):{" "}
                {waGroupUrl ? (
                  <a
                    className="underline"
                    href={waGroupUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Buka grup WhatsApp LMHY
                  </a>
                ) : (
                  "tautan grup akan dibagikan setelah tersedia."
                )}
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={draft.waGroupConfirmed}
                  onChange={(e) => set("waGroupConfirmed", e.target.checked)}
                />{" "}
                Saya sudah bergabung ke grup.
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.pfaCommitment}
                  onChange={(e) => set("pfaCommitment", e.target.checked)}
                />{" "}
                Saya bersedia mengikuti pelatihan First Aid Counseling.
              </label>
              {err("waGroupConfirmed") && (
                <p id="waGroupConfirmed-error" role="alert">
                  {err("waGroupConfirmed")}
                </p>
              )}
              {err("pfaCommitment") && (
                <p id="pfaCommitment-error" role="alert">
                  {err("pfaCommitment")}
                </p>
              )}
              <label>
                <input
                  type="checkbox"
                  checked={draft.dataAccuracyAccepted}
                  onChange={(e) =>
                    set("dataAccuracyAccepted", e.target.checked)
                  }
                />{" "}
                Saya menyatakan data yang diberikan benar.
              </label>
              {err("dataAccuracyAccepted") && (
                <p id="dataAccuracyAccepted-error" role="alert">
                  {err("dataAccuracyAccepted")}
                </p>
              )}
              <input
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
            </>
          )}
          <div className="flex gap-3">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)}>
                Kembali
              </button>
            )}
            <button
              disabled={pending || (step === 2 && secondsRemaining > 0)}
              className="rounded-full bg-[#3C3163] px-5 py-3 font-semibold text-white"
            >
              {step === 1
                ? "Lanjut"
                : secondsRemaining > 0
                  ? `Siap dalam ${secondsRemaining} dtk`
                  : "Kirim pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
