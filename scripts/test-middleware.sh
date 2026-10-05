#!/usr/bin/env bash
# Blackbox test untuk src/middleware.ts
#
# Middleware adalah lapisan HTTP, jadi ujiannya berupa request HTTP dengan
# header `Host` berbeda — tidak butuh dependency test runner apa pun.
#
# Pakai:
#   npx next dev -p 3111 &
#   ./scripts/test-middleware.sh
#   BASE=http://localhost:3111 ./scripts/test-middleware.sh

set -uo pipefail

BASE="${BASE:-http://localhost:3111}"
WWW="www.letmehearyou.id"
BARE="letmehearyou.id"
LOCALHOST="localhost:3111"
SUB="axaa.localhost:3111"

PASS=0
FAIL=0
FAILED=()

req_status() { # <host> <path> -> kode status saja
  curl -s -D - -o /dev/null --max-time 30 -H "Host: $1" "${BASE}$2" \
    | head -1 | awk '{print $2}'
}

req_header() { # <header> <host> <path> -> nilai header (lowercase key)
  curl -s -D - -o /dev/null --max-time 30 -H "Host: $2" "${BASE}$3" \
    | grep -i "^$1:" | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r'
}

req_body() { # <host> <path> -> isi body
  curl -s --max-time 30 -H "Host: $1" "${BASE}$2"
}

report() { # <ok:0|1> <desc> <detail>
  if [ "$1" -eq 1 ]; then
    PASS=$((PASS + 1))
    printf '  \342\235\244  %s\n' "$2"
  else
    FAIL=$((FAIL + 1))
    FAILED+=("$2")
    printf '  \342\235\214  %s\n       %s\n' "$2" "$3"
  fi
}

check_status() { # <desc> <expected> <host> <path>
  local actual
  actual=$(req_status "$3" "$4")
  if [ "$actual" = "$2" ]; then
    report 1 "$1"
  else
    report 0 "$1" "diharapkan $2, dapat $actual"
  fi
}

check_location() { # <desc> <substring> <host> <path>
  local actual
  actual=$(req_header location "$3" "$4")
  case "$actual" in
    *"$2"*) report 1 "$1" ;;
    *) report 0 "$1" "Location = '$actual', diharapkan mengandung '$2'" ;;
  esac
}

check_body_has() { # <desc> <marker> <host> <path>
  local actual
  actual=$(req_body "$3" "$4")
  if printf '%s' "$actual" | grep -qF "$2"; then
    report 1 "$1"
  else
    report 0 "$1" "marker '$2' tidak ditemukan di response"
  fi
}

check_body_missing() { # <desc> <marker> <host> <path>
  local actual
  actual=$(req_body "$3" "$4")
  if printf '%s' "$actual" | grep -qF "$2"; then
    report 0 "$1" "marker '$2' SEHARUSNYA tidak ada, tapi ditemukan"
  else
    report 1 "$1"
  fi
}

echo "Base: ${BASE}"
echo
echo "== Preflight: server hidup? =="
if ! curl -s -o /dev/null --max-time 10 "${BASE}/"; then
  echo "  GAGAL: server tidak merespons di ${BASE}"
  echo "  Jalankan dulu: npx next dev -p 3111"
  exit 2
fi
echo "  ok"
echo

echo "== Perubahan 1: www -> subdomain redirect =="
check_status  "www /tenant/axaa                 -> 308"          308 "$WWW" "/tenant/axaa"
check_location "  Location ke subdomain axaa"                 "https://axaa.letmehearyou.id/" "$WWW" "/tenant/axaa"
check_status  "www /tenant/axaa/write           -> 308"          308 "$WWW" "/tenant/axaa/write"
check_location "  Location /write di subdomain"            "https://axaa.letmehearyou.id/write" "$WWW" "/tenant/axaa/write"
check_status  "www /tenant/axaa/<slug>          -> 308"          308 "$WWW" "/tenant/axaa/mengenali-tanda-burnout"
check_location "  Location <slug> di subdomain"       "https://axaa.letmehearyou.id/mengenali-tanda-burnout" "$WWW" "/tenant/axaa/mengenali-tanda-burnout"
check_status  "bare /tenant/axaa                -> 308"          308 "$BARE" "/tenant/axaa"
check_location "  Location juga subdomain"                "https://axaa.letmehearyou.id/" "$BARE" "/tenant/axaa"
check_location "  query string dipertahankan"         "foo=bar" "$WWW" "/tenant/axaa/write?foo=bar"

echo
echo "== Perubahan 1: route www NON-tenant TIDAK ikut ter-redirect =="
check_status  "www /                -> 200 (landing)"  200 "$WWW" "/"
check_status  "www /builder         -> 200"            200 "$WWW" "/builder?username=axaa"
check_status  "www /blog            -> 200"            200 "$WWW" "/blog"
check_status  "localhost /tenant/axaa -> 200 (dev tidak redirect)" 200 "$LOCALHOST" "/tenant/axaa"

echo
echo "== Perubahan 2: route root menang di subdomain =="
check_body_has  "/builder -> Studio Canvas asli"     "Studio Web Builder Refleksi" "$SUB" "/builder?username=axaa"
check_body_missing "/builder -> bukan artikel palsu"   "Tulis Baru" "$SUB" "/builder?username=axaa"
check_body_has  "/blog    -> halaman blog asli"      "Ruang untuk memahami" "$SUB" "/blog"
check_body_missing "/blog    -> bukan artikel palsu"    "Tulis Baru" "$SUB" "/blog"
check_body_missing "/creator -> bukan artikel palsu"    "Tulis Baru" "$SUB" "/creator"
check_status  "/admin/litera -> 200 (sekarang 404)"   200 "$SUB" "/admin/litera"

echo
echo "== Perubahan 2: rute tenant di subdomain TIDAK boleh rusak =="
check_body_has  "/write   -> form tulis tetap ada"    "Tulis Refleksi Baru" "$SUB" "/write"
check_body_has  "/<slug>  -> artikel tetap ada"       "Mengenali Tanda Burnout" "$SUB" "/mengenali-tanda-burnout"
check_body_has  "/        -> profil tetap ada"        "Ruang Refleksi" "$SUB" "/"
check_body_has  "/write   -> punya back link"         "Kembali ke profil" "$SUB" "/write"

echo
echo "== Korelasi: setelah redirect, link '+ Tulis Baru' di artikel =="
# Di www, artikel di-redirect ke subdomain. Di subdomain, href="/write" harus hidup.
check_status  "subdomain /write (target link + Tulis Baru) -> 200" 200 "$SUB" "/write"

echo
echo "================================"
echo "PASS: ${PASS}   FAIL: ${FAIL}"
if [ "$FAIL" -gt 0 ]; then
  echo "Gagal:"
  printf '  - %s\n' "${FAILED[@]}"
  exit 1
fi
echo "Semua lulus."
