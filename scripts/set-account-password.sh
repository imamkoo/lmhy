#!/bin/bash
# Set password untuk satu atau beberapa akun Supabase Auth.
# Membuat akun bila belum ada (email_confirm=true) dan memastikan baris `profiles` ada.
#
# Pakai curl + retry karena DNS & edge Supabase kadang bermasalah sesaat.
#
# Usage:
#   SUPABASE_SERVICE_ROLE_KEY=... bash scripts/set-account-password.sh user@example.com [user2@example.com ...]
#
# Password di-generate acak (20 char) lalu disimpan ke:
#   ~/.config/lmhy-qa-accounts.txt   (mode 600, tidak pernah di-commit)

set -uo pipefail

REF="${SUPABASE_PROJECT_REF:-wzywhjsxrbkgoxaingar}"
BASE="https://${REF}.supabase.co"
KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
OUT="${LMHY_ACCOUNTS_FILE:-$HOME/.config/lmhy-qa-accounts.txt}"
RETRIES="${LMHY_API_RETRIES:-8}"

if [ -z "$KEY" ]; then
  echo "SUPABASE_SERVICE_ROLE_KEY wajib di-set" >&2
  exit 1
fi
if [ $# -lt 1 ]; then
  echo "Usage: $0 <email> [email ...]" >&2
  exit 1
fi

api_call() { # $1 = METHOD, $2 = path, $3 = body (opsional) -> body di stdout
  local method="$1" path="$2" body="${3:-}" out code
  for _ in $(seq 1 "$RETRIES"); do
    if [ -n "$body" ]; then
      out="$(curl -s --http1.1 --max-time 30 -w '\n%{http_code}' -X "$method" "${BASE}${path}" \
        -H "apikey: ${KEY}" -H "Authorization: Bearer ${KEY}" -H "Content-Type: application/json" \
        -d "$body" 2>/dev/null || true)"
    else
      out="$(curl -s --http1.1 --max-time 30 -w '\n%{http_code}' -X "$method" "${BASE}${path}" \
        -H "apikey: ${KEY}" -H "Authorization: Bearer ${KEY}" 2>/dev/null || true)"
    fi
    code="$(printf '%s' "$out" | tail -n1)"
    case "$code" in
      200|201|204) printf '%s' "$out" | sed '$d'; return 0 ;;
    esac
    sleep 3
  done
  echo "Gagal ${method} ${path} (HTTP ${code}): $(printf '%s' "$out" | sed '$d' | head -c 200)" >&2
  return 1
}

gen_password() {
  python3 -c "
import secrets
alpha = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#\$%^&*'
print(''.join(secrets.choice(alpha) for _ in range(20)))
"
}

USERS_JSON="$(api_call GET "/auth/v1/admin/users?page=1&per_page=200")" || exit 1

umask 077
touch "$OUT"
chmod 600 "$OUT"

for EMAIL in "$@"; do
  EMAIL_LOWER="$(printf '%s' "$EMAIL" | tr 'A-Z' 'a-z')"
  echo "=== ${EMAIL_LOWER} ==="

  USER_ID="$(printf '%s' "$USERS_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for u in d.get('users', []):
    if (u.get('email') or '').lower() == '${EMAIL_LOWER}':
        print(u['id']); break
" 2>/dev/null || true)"

  if [ -z "$USER_ID" ]; then
    echo "  akun belum ada → membuat (email_confirm=true)"
    CREATED="$(api_call POST "/auth/v1/admin/users" "{\"email\":\"${EMAIL_LOWER}\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"${EMAIL_LOWER%%@*}\"}}")" || exit 1
    USER_ID="$(printf '%s' "$CREATED" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)"
  else
    echo "  akun sudah ada (${USER_ID})"
  fi

  if [ -z "$USER_ID" ]; then
    echo "  ✗ gagal menentukan user id" >&2
    exit 1
  fi

  PASSWORD="$(gen_password)"
  ESCAPED="${PASSWORD//\"/\\\"}"
  api_call PUT "/auth/v1/admin/users/${USER_ID}" "{\"password\":\"${ESCAPED}\",\"email_confirm\":true}" >/dev/null || exit 1
  echo "  ✓ password diset"

  PROFILE="$(api_call GET "/rest/v1/profiles?select=id&id=eq.${USER_ID}" || true)"
  HAS_PROFILE="$(printf '%s' "$PROFILE" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('yes' if isinstance(d, list) and len(d) > 0 else 'no')
except Exception:
    print('no')
" 2>/dev/null || echo "no")"
  if [ "$HAS_PROFILE" = "no" ]; then
    USERNAME="$(printf '%s' "$EMAIL_LOWER" | sed 's/@.*//' | tr -cd 'a-z0-9-' | cut -c1-28)"
    if api_call POST "/rest/v1/profiles" "{\"id\":\"${USER_ID}\",\"username\":\"${USERNAME}\",\"display_name\":\"${EMAIL_LOWER%%@*}\",\"creator_role\":\"PENULIS\",\"service_track\":null,\"verification_status\":\"NONE\"}" >/dev/null 2>&1; then
      echo "  ✓ profil dibuat (username: ${USERNAME})"
    else
      echo "  ! profil belum ada — buat manual di Supabase"
    fi
  else
    echo "  ✓ profil sudah ada"
  fi

  printf '%s=%s\n' "$EMAIL_LOWER" "$PASSWORD" >> "$OUT"
  echo "  password tercatat di ${OUT}"
  echo
done

echo "Selesai. Kredensial tersimpan di: ${OUT} (mode 600)"
echo "Baca: cat ${OUT}"
