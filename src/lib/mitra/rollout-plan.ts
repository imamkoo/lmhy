export type EnvTarget = "production" | "preview" | "development";
export type EnvType = "encrypted" | "plain";

export interface DesiredEnvVar {
  key: string;
  value: string;
  type: EnvType;
  target: EnvTarget;
  sensitive: boolean;
}

export interface ExistingEnvVar {
  id: string;
  key: string;
  type: EnvType;
  target: string[];
  value?: string;
}

export interface EnvDiff {
  create: DesiredEnvVar[];
  update: Array<{ existing: ExistingEnvVar; desired: DesiredEnvVar }>;
  unchanged: DesiredEnvVar[];
  remove: ExistingEnvVar[];
}

const SECRET_KEY_PATTERNS = [
  /SERVICE_ROLE/,
  /_SECRET$/,
  /_API_KEY$/,
  /_TOKEN$/,
  /^SWEEP_SECRET$/,
  /^CRON_SECRET$/,
];

export function isSecretEnvKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export interface RolloutEnvInput {
  supabaseServiceRoleKey: string;
  mitraUploadSecret: string;
  sweepSecret: string;
  cronSecret: string;
  appUrl: string;
  emailFrom: string;
  resendApiKey?: string;
  brevoApiKey?: string;
  adminSystemActorId?: string;
  mitraIntakeEnabled: boolean;
  psikologEnabled: boolean;
  pendampingEnabled: boolean;
  shadowMode: boolean;
  whitelistEmails: string;
  target?: EnvTarget;
}

export function buildDesiredEnv(input: RolloutEnvInput): DesiredEnvVar[] {
  const target: EnvTarget = input.target ?? "production";

  const managed: Array<[string, string]> = [
    ["SUPABASE_SERVICE_ROLE_KEY", input.supabaseServiceRoleKey],
    ["MITRA_UPLOAD_SECRET", input.mitraUploadSecret],
    ["SWEEP_SECRET", input.sweepSecret],
    ["CRON_SECRET", input.cronSecret],
    ["APP_URL", input.appUrl],
    ["NEXT_PUBLIC_MITRA_INTAKE_ENABLED", String(input.mitraIntakeEnabled)],
    [
      "NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED",
      String(input.psikologEnabled),
    ],
    [
      "NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED",
      String(input.pendampingEnabled),
    ],
    ["MITRA_INTAKE_SHADOW_MODE", String(input.shadowMode)],
    // Whitelist kosong = semua email boleh → tetap dikelola agar nilainya eksplisit.
    ["MITRA_INTAKE_WHITELIST_EMAILS", input.whitelistEmails],
  ];

  const optional: Array<[string, string]> = [
    ["EMAIL_FROM", input.emailFrom ?? ""],
    ["RESEND_API_KEY", input.resendApiKey ?? ""],
    ["BREVO_API_KEY", input.brevoApiKey ?? ""],
    ["ADMIN_SYSTEM_ACTOR_ID", input.adminSystemActorId ?? ""],
  ];

  const entries = [
    ...managed,
    ...optional.filter(([, value]) => value !== ""),
  ];

  return entries.map(([key, value]) => {
    const sensitive = isSecretEnvKey(key);
    return {
      key,
      value,
      type: sensitive ? ("encrypted" as EnvType) : ("plain" as EnvType),
      target,
      sensitive,
    };
  });
}

export function diffEnv(
  existing: ExistingEnvVar[],
  desired: DesiredEnvVar[]
): EnvDiff {
  const byKey = new Map<string, ExistingEnvVar>();
  for (const item of existing) {
    if (!item.target.includes("production")) continue;
    byKey.set(item.key, item);
  }

  const create: DesiredEnvVar[] = [];
  const update: EnvDiff["update"] = [];
  const unchanged: DesiredEnvVar[] = [];
  const consumed = new Set<string>();

  for (const want of desired) {
    const current = byKey.get(want.key);
    if (!current) {
      create.push(want);
      continue;
    }
    consumed.add(want.key);
    const currentValue = current.value ?? "";
    if (currentValue === want.value) {
      unchanged.push(want);
    } else {
      update.push({ existing: current, desired: want });
    }
  }

  const remove = existing.filter(
    (item) =>
      item.target.includes("production") && !consumed.has(item.key)
  );

  return { create, update, unchanged, remove };
}

export function redactEnvValue(key: string, value: string): string {
  if (!value) return "";
  if (!isSecretEnvKey(key)) return value;
  if (value.length <= 4) return "*".repeat(value.length);
  return `${value.slice(0, 2)}${"*".repeat(Math.max(4, value.length - 4))}`;
}
