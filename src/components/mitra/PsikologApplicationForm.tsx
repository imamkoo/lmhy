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
import DocumentUploader from "./DocumentUploader";
import MitraField from "./MitraField";
import MitraStepper from "./MitraStepper";
import { INDONESIAN_PROVINCES } from "@/lib/mitra/provinces";
const STEP_FIELDS: Record<1 | 2 | 3, string[]> = {
  1: [
    "applicantName",
    "applicantEmail",
    "whatsapp",
    "domicileProvince",
    "domicileCity",
    "username",
    "password",
    "academicTitle",
  ],
  2: [
    "s2Campus",
    "s2GraduationYear",
    "specialization",
    "strNumber",
    "sipStatus",
    "currentPractice",
    "yearsExperience",
    "modalities",
    "motivation",
  ],
  3: ["ethicsAccepted", "dataAccuracyAccepted"],
};
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
const specializations = [
  "Klinis Dewasa",
  "Klinis Anak & Remaja",
  "Klinis Keluarga",
  "Industri & Organisasi",
  "Pendidikan",
  "Umum",
];
export default function PsikologApplicationForm() {
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [username, setUsername] = useState<{
    available?: boolean;
    error?: string;
    suggestions: string[];
  }>({ suggestions: [] });
  const [honeypot, setHoneypot] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState<{
    id: string;
    token?: string;
  } | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(new Set());
  const started = useRef<number | null>(null);
  if (started.current === null) started.current = new Date().getTime();
  const elapsed = () => new Date().getTime() - (started.current ?? 0);
  const err = (key: string) =>
    attemptedSteps.has(step)
      ? issues.find((i) => i.field === key)?.message
      : undefined;
  const set = (key: keyof PsikologDraft, value: unknown) =>
    setDraft((old) => ({ ...old, [key]: value }));
  useEffect(() => {
    if (draft.username.length < 3) return;
    const timer = setTimeout(
      () => void checkMitraUsernameAction(draft.username).then(setUsername),
      400,
    );
    return () => clearTimeout(timer);
  }, [draft.username]);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setSecondsRemaining(Math.max(0, Math.ceil((5000 - elapsed()) / 1000))),
      250,
    );
    return () => clearInterval(timer);
  });
  const validate = () =>
    validateMitraDraft({ ...draft, honeypot, formElapsedMs: elapsed() });
  const next = () => {
    setAttemptedSteps((steps) => new Set(steps).add(step));
    const result = validate();
    setIssues(result.issues);
    if (!result.issues.some((issue) => STEP_FIELDS[step].includes(issue.field)))
      setStep((step + 1) as 1 | 2 | 3);
  };
  const submit = () => {
    setAttemptedSteps(new Set([1, 2, 3]));
    const result = validate();
    setIssues(result.issues);
    if (!result.ok) {
      if (
        result.issues.some(
          (issue) =>
            issue.field === "honeypot" || issue.field === "formElapsedMs",
        )
      )
        setServerError("Mohon tunggu sebentar sebelum mengirim.");
      return;
    }
    startTransition(async () => {
      const answer = await submitMitraApplication({
        ...draft,
        honeypot,
        formElapsedMs: elapsed(),
      });
      if (answer.ok && answer.applicationId) {
        sessionStorage.setItem("mitra-upload-token", answer.uploadToken || "");
        setSubmitted({ id: answer.applicationId, token: answer.uploadToken });
        return;
      }
      setIssues(answer.issues ?? []);
      if (answer.code === "EMAIL_EXISTS") {
        setServerError(
          "Email ini sudah punya akun di Let Me Hear You. Silakan masuk lewat halaman login, lalu ajukan dari akun tersebut agar email verifikasi diterima di alamat yang benar.",
        );
      } else {
        setServerError(answer.message || "Pengajuan belum dapat dikirim.");
      }
      if (answer.code === "USERNAME_TAKEN" && answer.suggestions?.length)
        setUsername((current) => ({
          ...current,
          suggestions: answer.suggestions!,
        }));
    });
  };
  if (submitted)
    return (
      <main>
        <h1>Cek email untuk verifikasi</h1>
        <p>Pengajuan Anda sudah diterima.</p>
        <p>
          <a href="/akun/pengajuan">Lihat pengajuan</a> ·{" "}
          <a href="/mitra/status">Status mitra</a>
        </p>
        {(["STR", "CV"] as const).map((docType) => (
          <section key={docType}>
            <label htmlFor={`upload-${docType}`}>Unggah {docType}</label>
            <DocumentUploader
              docType={docType}
              applicationId={submitted.id}
              uploadToken={submitted.token}
              onError={setServerError}
              onStatusChange={(status) =>
                setStatuses((old) => ({ ...old, [docType]: status }))
              }
            />
            <p aria-live="polite">{statuses[docType] ?? "belum diunggah"}</p>
          </section>
        ))}
        {serverError && <p role="alert">{serverError}</p>}
        <p>
          Verifikasi email lalu masuk untuk mengunggah dokumen:{" "}
          <a href="/mitra/status">status</a> atau{" "}
          <a href="/akun/pengajuan">pengajuan</a>.
        </p>
      </main>
    );
  const input = (name: keyof PsikologDraft, label: string, type = "text") => (
    <MitraField label={label} name={name} error={err(name)}>
      <input
        id={name}
        type={type}
        value={String(draft[name])}
        aria-invalid={Boolean(err(name))}
        aria-describedby={err(name) ? `${name}-error` : undefined}
        onChange={(e) => set(name, e.target.value)}
      />
    </MitraField>
  );
  return (
    <main>
      <h1>Daftar sebagai psikolog</h1>
      <MitraStepper
        current={step}
        labels={["Identitas", "Kredensial", "Komitmen"]}
      />
      <form
        className="pb-[96px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (secondsRemaining > 0) return;
          if (step === 3) submit();
          else next();
        }}
      >
        {serverError && (
          <p role="alert">
            {serverError}{" "}
            {serverError.startsWith("Email") && <a href="/login">Masuk</a>}
          </p>
        )}
        {step === 1 && (
          <>
            <>
              {input("applicantName", "Nama lengkap")}
              {input("academicTitle", "Gelar")}
              {input("applicantEmail", "Email")}
              {input("whatsapp", "WhatsApp")}
              <MitraField
                label="Provinsi"
                name="domicileProvince"
                error={err("domicileProvince")}
              >
                <select
                  id="domicileProvince"
                  value={draft.domicileProvince}
                  onChange={(e) => set("domicileProvince", e.target.value)}
                >
                  <option value="">Pilih provinsi</option>
                  {INDONESIAN_PROVINCES.map((province) => (
                    <option key={province}>{province}</option>
                  ))}
                </select>
              </MitraField>
              {input("domicileCity", "Kota")}
              {input("username", "Username")}
              {username.error && <p role="alert">{username.error}</p>}
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
            </>
          </>
        )}
        {step === 2 && (
          <>
            <>
              {input("s2Campus", "Kampus S2")}
              {input("strNumber", "Nomor STR")}
              {input("currentPractice", "Tempat praktik")}
            </>
            <MitraField
              label="Tahun lulus S2"
              name="s2GraduationYear"
              error={err("s2GraduationYear")}
            >
              <input
                id="s2GraduationYear"
                type="number"
                min="1980"
                max={new Date().getFullYear()}
                value={draft.s2GraduationYear || ""}
                onChange={(e) =>
                  set("s2GraduationYear", Number(e.target.value))
                }
              />
              <p>1980–{new Date().getFullYear()}</p>
            </MitraField>
            <MitraField
              label="Spesialisasi"
              name="specialization"
              error={err("specialization")}
            >
              <select
                id="specialization"
                value={draft.specialization}
                onChange={(e) => set("specialization", e.target.value)}
              >
                <option value="">Pilih</option>
                {specializations.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </MitraField>
            <fieldset>
              <legend>Status SIP</legend>
              {(["AKTIF", "TIDAK_AKTIF"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="sipStatus"
                    checked={draft.sipStatus === value}
                    onChange={() => set("sipStatus", value)}
                  />
                  {value}
                </label>
              ))}
              {draft.sipStatus === "TIDAK_AKTIF" && (
                <p>
                  Pengajuan tetap dapat diajukan; tim kami akan meninjaunya
                  lebih ketat
                </p>
              )}
            </fieldset>
            <MitraField
              label="Pengalaman"
              name="yearsExperience"
              error={err("yearsExperience")}
            >
              <select
                id="yearsExperience"
                value={draft.yearsExperience}
                onChange={(e) => set("yearsExperience", e.target.value)}
              >
                <option value="">Pilih</option>
                {["<1", "1-2", "2-4", "4-7", ">7"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </MitraField>
            <MitraField label="Jam terbang" name="flightHours">
              <select
                id="flightHours"
                value={draft.flightHours}
                onChange={(e) => set("flightHours", e.target.value)}
              >
                <option value="">Opsional</option>
                {["<100", "100-300", "301-700", "701-1500", ">1500"].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </MitraField>
            <fieldset>
              <legend>Modalitas layanan</legend>
              {[
                ["VIDEO", "Video"],
                ["VOICE", "Voice"],
                ["CHAT", "Chat"],
              ].map(([value, label]) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={draft.modalities.includes(value)}
                    onChange={(e) =>
                      set(
                        "modalities",
                        e.target.checked
                          ? [...draft.modalities, value]
                          : draft.modalities.filter((item) => item !== value),
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            {err("modalities") && <p role="alert">{err("modalities")}</p>}
            <MitraField
              label="Ringkasan pengalaman & motivasi"
              name="motivation"
              error={err("motivation")}
            >
              <textarea
                id="motivation"
                value={draft.motivation}
                onChange={(e) => set("motivation", e.target.value)}
              />
            </MitraField>
          </>
        )}
        {step === 3 && (
          <>
            <label>
              <input
                type="checkbox"
                checked={draft.dataAccuracyAccepted}
                onChange={(e) => set("dataAccuracyAccepted", e.target.checked)}
              />
              Saya menyatakan data benar
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.ethicsAccepted}
                onChange={(e) => set("ethicsAccepted", e.target.checked)}
              />
              Saya menyetujui kode etik
            </label>
            <input
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
          </>
        )}
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
            >
              Kembali
            </button>
          )}
          <button disabled={pending || secondsRemaining > 0}>
            {secondsRemaining > 0
              ? `Siap dalam ${secondsRemaining} dtk`
              : step === 3
                ? "Kirim pengajuan"
                : "Lanjut"}
          </button>
        </div>
      </form>
    </main>
  );
}
