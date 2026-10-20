import assert from "node:assert/strict";
import { test } from "node:test";
import { isAuthorizedCronRequest } from "./cron-auth";

function requestWith(headers: Record<string, string>): Request {
  return new Request("https://example.test/api/internal/sweep", { headers });
}

test("tanpa secret terkonfigurasi, request selalu ditolak", () => {
  const env = { SWEEP_SECRET: undefined, CRON_SECRET: undefined };
  assert.equal(
    isAuthorizedCronRequest(
      requestWith({ "x-sweep-secret": "apa-saja" }),
      env
    ),
    false
  );
});

test("header x-sweep-secret dicocokkan dengan SWEEP_SECRET", () => {
  const env = { SWEEP_SECRET: "sweep-rahasia", CRON_SECRET: undefined };
  assert.equal(
    isAuthorizedCronRequest(
      requestWith({ "x-sweep-secret": "sweep-rahasia" }),
      env
    ),
    true
  );
  assert.equal(
    isAuthorizedCronRequest(
      requestWith({ "x-sweep-secret": "salah" }),
      env
    ),
    false
  );
});

test("Authorization Bearer dicocokkan dengan CRON_SECRET (Vercel Cron)", () => {
  const env = { SWEEP_SECRET: undefined, CRON_SECRET: "cron-rahasia" };
  assert.equal(
    isAuthorizedCronRequest(
      requestWith({ authorization: "Bearer cron-rahasia" }),
      env
    ),
    true
  );
  assert.equal(
    isAuthorizedCronRequest(
      requestWith({ authorization: "Bearer salah" }),
      env
    ),
    false
  );
});

test("Authorization Bearer juga menerima SWEEP_SECRET", () => {
  const env = { SWEEP_SECRET: "sweep-rahasia", CRON_SECRET: undefined };
  assert.equal(
    isAuthorizedCronRequest(
      requestWith({ authorization: "Bearer sweep-rahasia" }),
      env
    ),
    true
  );
});

test("header kosong tanpa kredensial ditolak", () => {
  const env = { SWEEP_SECRET: "sweep-rahasia", CRON_SECRET: "cron-rahasia" };
  assert.equal(isAuthorizedCronRequest(requestWith({}), env), false);
  assert.equal(
    isAuthorizedCronRequest(requestWith({ authorization: "sweep-rahasia" }), env),
    false
  );
});
