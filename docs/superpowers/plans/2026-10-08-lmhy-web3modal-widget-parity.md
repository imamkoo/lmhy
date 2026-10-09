# LMHY ↔ Litera Web3Modal Wallet Parity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti stack connect-wallet custom LMHY dengan provider yang sama persis dengan widget Litera (wagmi + `@web3modal/wagmi` lazy) sehingga klik "Hubungkan Dompet" memunculkan popup AppKit "Connect Wallet" identik screenshot widget, injected-first bila `window.ethereum` ada.

**Architecture:** Salinan adaptif dua modul widget Litera (`config` + `web3modal-lazy`) di `src/components/litera/`, wrapper provider client-only di `WebBuilderClient`, watcher `useAccount` always-mounted (karena shell modal unmount saat connect dimulai), dan penghapusan total grid wallet custom (~300 baris) beserta dependency `@walletconnect/*`/`@reown/*`.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, wagmi ^2.12, viem ^2, @tanstack/react-query ^5, @web3modal/wagmi ^4.1.11 (Reown AppKit).

**Spec:** `docs/superpowers/specs/2026-10-08-lmhy-litera-wallet-parity-design.md`

**Referensi read-only (jangan dimodifikasi):** `/Users/followthevoice/Downloads/imkollective/litera/litera-plugin-v2-main/src/web3modal-lazy.ts`, `.../src/config/index.tsx`, `.../src/components/LiteraWidget.tsx` (fungsi `handleConnectWallet` baris 733-763, preload effect baris 629-645).

## Global Constraints

- Repo ini **tidak punya test runner** (hanya `npm run lint`, `npx tsc --noEmit`, `npm run build`) — ketiga gate itu + probe runtime adalah verifikasi setiap task.
- projectId WalletConnect: `d94f04faafa515ac177c9c41052264b7` (persis).
- Versi dependency baru: `wagmi@^2.12.2`, `viem@^2.43.5`, `@tanstack/react-query@^5.90.16`, `@web3modal/wagmi@^4.1.11`.
- Hapus dependency: `@walletconnect/ethereum-provider@2.22.4`, `@reown/appkit-controllers@1.8.9`.
- Metadata identitas LMHY (dipertahankan dari kode lama): name `Let Me Hear You`, description `Platform & Komunitas Kesehatan Mental`, url `window.location.origin || "https://letmehearyou.id"`, icons `["https://letmehearyou.id/icon-192.png"]`.
- `featuredWalletIds` persis 4 ID widget (Bitget `3779261c…a2f8b`, MetaMask `c57ca95b…67d96`, Trust `4622a2b2…da31a0`, OKX `1ae92b26…8f219` — salin dari file referensi).
- `themeVariables`: hanya `--w3m-accent: '#d07954'` dan `--w3m-border-radius-master: '12px'` (nilai sudah ada di codebase — tidak menambah warna/radius baru). Tanpa warna/tipografi/token baru lainnya.
- Transport HANYA host yang sudah di-allow CSP: `https://polygon-bor-rpc.publicnode.com` dan `https://1rpc.io` (dilarang memakai proxy RPC `literaa.xyz/api/v1/rpc/proxy`, `drpc.org`, `tenderly.co`).
- Komentar hanya yang diminta spec (catatan gesture mobile dari widget); tanpa komentar tak diminta.
- Commit per task di branch fitur (Conventional Commits, subject Inggris). **Push hanya setelah konfirmasi user (main/develop/cancel).** Jangan commit: `session.md`, root `AGENTS.md`, `.superpowers/`, `docs/superpowers/**`, `docs/ops/**`, file untracked lain yang sudah ada.
- Cabang dari `main` (HEAD `1934d9e`): branch `feat/web3modal-wallet-connect-parity`.

## Review Focus

Lima kondisi yang paling mungkin merusak perilaku user tetapi tidak dicakar gate otomatis:

1. **Gesture timing mobile** — chunk AppKit belum siap saat user klik "Hubungkan Dompet" → `open()` tertunda/terblokir. Pin: Task 4 (preload effect terikat `isOpen` + loadState → `errorMsg`) dan Task 6 on-device step ("dialog terbuka seketika tanpa jeda loading").
2. **Auto-reconnect wagmi saat reload** — watcher bisa memanggil `onSuccess` ulang saat session tersimpan reconnect. Pin: guard `lastAddress` di Task 3 Step 2 (sekali per address per sesi koneksi) + Task 6 on-device step (reload → tidak ada error/state ganda).
3. **CSP memblokir host baru** (`walletlink.org` / permintaan AppKit tak terduga) — koneksi macet diam-diam seperti kasus lama. Pin: Task 5 (CSP edit) + Task 6 Step 3 (probe console-CSP lokal).
4. **Urutan hook di modal** — `useConnect()` ditaruh setelah `if (!isOpen) return null` → crash "Rendered fewer hooks". Pin: Task 4 Step 1 (instruksi eksplisit posisi, sebelum early return line 316) + Task 6 Step 4 (buka/tutup modal 2× tanpa error console).
5. **Provider nesting salah** — modal/watcher di luar `WagmiProvider` → runtime error `WagmiProvider not found`. Pin: Task 3 Step 3 (verifikasi diff nesting) + Task 6 Step 4 (login modal terbuka tanpa error console).

---

### Task 1: Dependency baru & branch

**Files:**
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Produces: dependency `wagmi`, `viem`, `@tanstack/react-query`, `@web3modal/wagmi` terpasang (Task 2-4 mengimpornya). Belum ada kode yang mengimpor — tree tetap kompil.

- [ ] **Step 1: Buat branch kerja**

Run: `git checkout -b feat/web3modal-wallet-connect-parity`
Expected: `Switched to a new branch 'feat/web3modal-wallet-connect-parity'`

- [ ] **Step 2: Install 4 dependency baru (tanpa menghapus yang lama dulu — kode lama masih mengimpor)**

Run: `npm install wagmi@^2.12.2 viem@^2.43.5 @tanstack/react-query@^5.90.16 @web3modal/wagmi@^4.1.11`
Expected: exit 0; keempatnya muncul di `package.json` dependencies.

- [ ] **Step 3: Verifikasi tree masih kompil**

Run: `npx tsc --noEmit`
Expected: no output (0 errors).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add wagmi, viem, react-query and web3modal for litera parity"
```

---

### Task 2: `wagmi-config.ts` + `web3modal-lazy.ts`

**Files:**
- Create: `src/components/litera/wagmi-config.ts`
- Create: `src/components/litera/web3modal-lazy.ts`

**Interfaces:**
- Consumes: keempat dependency Task 1.
- Produces (dipakai Task 3-4):
  - `wagmi-config.ts`: export `projectId: string`, `metadata: {name, description, url, icons}`, `config` (wagmi `CreateConfigReturnType`).
  - `web3modal-lazy.ts`: `mountWeb3Modal(): Promise<void>`, `openWeb3ModalSafe(opts?: any): void`, `probeWalletListReachable(timeoutMs?: number): Promise<boolean>`, `subscribeWeb3ModalState(fn: (s: Web3ModalLoadState) => void): () => void`, `type Web3ModalLoadState = { loading: boolean; error: string | null }`.

- [ ] **Step 1: Buat `src/components/litera/wagmi-config.ts`**

Salin struktur persis dari referensi `litera-plugin-v2-main/src/config/index.tsx` (baris 1-55) dengan delta berikut — ini keputusan yang sudah dikunci spec, jangan diganti:

- `"use client"` directive di baris 1 (referensi adalah file CRA tanpa directive).
- Buang semua yang Litera-specific: `LITERA_ORIGIN`, `PRIVY_ALLOWED_ORIGINS`, `isPrivyOriginAllowed`.
- `projectId`: literal `"d94f04faafa515ac177c9c41052264b7"` (tanpa env fallback ganda referensi).
- `metadata`: identitas LMHY (lihat Global Constraints), `url: typeof window !== "undefined" ? window.location.origin : "https://letmehearyou.id"`.
- `chains = [polygon] as const` (const lokal, tidak di-export).
- connectors identik referensi: `walletConnect({ projectId, metadata, showQrModal: false })`, `injected({ shimDisconnect: true })`, `coinbaseWallet({ appName: metadata.name, appLogoUrl: metadata.icons[0] })`; `multiInjectedProviderDiscovery: true`; `ssr: false`.
- transports (delta — host CSP LMHY):

```ts
transports: {
  [polygon.id]: fallback([
    http("https://polygon-bor-rpc.publicnode.com", { timeout: 8000 }),
    http("https://1rpc.io/polygon", { timeout: 8000 }),
  ], { rank: false }),
},
```

- [ ] **Step 2: Buat `src/components/litera/web3modal-lazy.ts`**

Salin file referensi `litera-plugin-v2-main/src/web3modal-lazy.ts` (146 baris) lalu terapkan delta ini:

1. Import: `import { config, metadata, projectId } from "./wagmi-config";`
2. **Hapus** `subscribeWeb3ModalOpen`, set `modalOpenListeners`, blok `subscribeState` di dalam `.then()` — tidak ada konsumen di LMHY (spec §3.1 pola widget hanya yang dipakai).
3. **Hapus** alias `preloadWeb3Modal`.
4. **Hapus** `getWeb3ModalLoadState` — modal hanya butuh subscribe.
5. Ganti tag log `[Litera Widget]` → `[LMHY]`.
6. Pertahankan: komentar header catatan gesture mobile (baris 1-19 referensi — diminta spec §3.1), `loadState` + `stateListeners` + `subscribeWeb3ModalState`, `probeWalletListReachable` (URL `https://api.web3modal.com/getWallets?page=1&entries=1` + header `x-project-id`), `mountWeb3Modal` (lazy `import('@web3modal/wagmi/react')`, `createWeb3Modal` dengan opsi persis referensi: `enableAnalytics: false`, `themeMode: 'light'`, `themeVariables` 2 nilai, `featuredWalletIds` 4 ID), `openWeb3ModalSafe` (sync-open bila instance siap, fallback `mountWeb3Modal().then(open)`).

- [ ] **Step 3: Verifikasi kompilasi + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/litera/wagmi-config.ts src/components/litera/web3modal-lazy.ts
git commit -m "feat(wallet): add wagmi config and lazy web3modal loader mirroring litera widget"
```

---

### Task 3: Provider wrapper + connect watcher

**Files:**
- Create: `src/components/litera/Web3Providers.tsx`
- Create: `src/components/litera/WalletConnectWatcher.tsx`
- Modify: `src/app/builder/WebBuilderClient.tsx:14` (import) dan `:1571-1576` (render modal)

**Interfaces:**
- Consumes: `config` (Task 2).
- Produces:
  - `Web3Providers({ children }: { children: React.ReactNode })` — membungkus `WagmiProvider` + `QueryClientProvider`.
  - `WalletConnectWatcher({ onSuccess }: { onSuccess: (walletAddress: string, method: string) => void })` — `return null`; memanggil `onSuccess(address, method)` tepat sekali tiap `address` berubah selama `isConnected`.
  - `handleLoginSuccess(walletAddress: string, method: string)` di `WebBuilderClient` (sudah ada, baris 377) dikonsumsi keduanya.

- [ ] **Step 1: Buat `Web3Providers.tsx`**

Client component: `QueryClient` dibuat via `useState(() => new QueryClient())` (bukan module scope — aman untuk SSR App Router), `WagmiProvider config={config}` dari `./wagmi-config`.

- [ ] **Step 2: Buat `WalletConnectWatcher.tsx`**

Logika inti (keputusan desain — implementasi bebas merapikan):

```ts
const { address, isConnected, connector } = useAccount();
const lastAddress = useRef<string | undefined>(undefined);

useEffect(() => {
  if (!address || !isConnected) {
    lastAddress.current = undefined;
    return;
  }
  if (address !== lastAddress.current) {
    lastAddress.current = address;
    onSuccess(address, connector?.name || "WalletConnect");
  }
}, [address, isConnected, connector, onSuccess]);
```

Guard `lastAddress` mencegah `onSuccess` berulang akibat re-render parent (identitas `onSuccess` berubah tiap render) — pin Review Focus #2. Jangan panggil `setCurrentView`/state modal apa pun di sini (modal sudah unmount saat connect).

- [ ] **Step 3: Wire di `WebBuilderClient`**

Import `Web3Providers` + `WalletConnectWatcher`. Ganti render baris 1571-1576 menjadi:

```tsx
<Web3Providers>
  <LiteraLoginModal
    isOpen={isLoginModalOpen}
    onClose={() => setIsLoginModalOpen(false)}
    onSuccess={handleLoginSuccess}
  />
  <WalletConnectWatcher onSuccess={handleLoginSuccess} />
</Web3Providers>
```

Tidak membungkus seluruh app (spec §3.4). Verifikasi nesting dari diff (Review Focus #5).

- [ ] **Step 4: Verifikasi kompilasi + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass (build menghasilkan route `/builder` tanpa error).

- [ ] **Step 5: Commit**

```bash
git add src/components/litera/Web3Providers.tsx src/components/litera/WalletConnectWatcher.tsx src/app/builder/WebBuilderClient.tsx
git commit -m "feat(wallet): add wagmi providers and connection watcher to builder"
```

---

### Task 4: Rewire + cleanup `LiteraLoginModal.tsx`

**Files:**
- Modify: `src/components/litera/LiteraLoginModal.tsx` (757 → ±350 baris)

**Interfaces:**
- Consumes: `mountWeb3Modal`, `openWeb3ModalSafe`, `probeWalletListReachable`, `subscribeWeb3ModalState` (Task 2); `useConnect` dari wagmi (Task 1). Kesuksesan connect TIDAK ditangani di sini — oleh `WalletConnectWatcher` (Task 3) karena shell unmount saat connect.
- Produces: perilaku MAIN view — "Hubungkan Dompet" → `handleConnectWallet()`; props `LiteraLoginModalProps` TIDAK berubah; SSO `handleEmailGoogleLogin` + listener `message` TIDAK berubah.

- [ ] **Step 1a: Tambah imports + hook + state**

Import: `import { useConnect } from "wagmi";` dan `import { mountWeb3Modal, openWeb3ModalSafe, probeWalletListReachable, subscribeWeb3ModalState } from "./web3modal-lazy";`. Di area hook/state (setelah `LITERA_ORIGIN` baris 225, **WAJIB sebelum** `if (!isOpen) return null` baris 316 — Review Focus #4):

- `const { connectAsync, connectors } = useConnect();`
- `const [walletListBlocked, setWalletListBlocked] = useState(false);`

- [ ] **Step 1b: Ganti effect fetch explorer dengan preload + probe**

Ganti effect fetch explorer (baris 237-267) dengan preload + probe:

```ts
useEffect(() => {
  if (!isOpen) return;
  let cancelled = false;
  mountWeb3Modal().catch(() => { /* error tersimpan di loadState, subscriber menampilkan */ });
  const unsubscribe = subscribeWeb3ModalState((s) => {
    if (!cancelled && s.error) setErrorMsg(s.error);
  });
  probeWalletListReachable().then((ok) => { if (!cancelled) setWalletListBlocked(!ok); });
  return () => { cancelled = true; unsubscribe(); };
}, [isOpen]);
```

- [ ] **Step 1c: Tambah `handleConnectWallet`**

Di posisi `connectInjectedProvider` lama — pola identik widget `handleConnectWallet` (referensi baris 733-763):

```ts
const handleConnectWallet = async () => {
  setErrorMsg(null);
  const injectedConnector = connectors.find((c) => c.id === "injected");
  const hasInjectedProvider = typeof window !== "undefined" && Boolean((window as { ethereum?: unknown }).ethereum);
  if (hasInjectedProvider && injectedConnector) {
    handleClose();
    try {
      await connectAsync({ connector: injectedConnector });
      return;
    } catch (err: unknown) {
      const message = ((err as { message?: string })?.message || "").toLowerCase();
      const name = (err as { name?: string })?.name || "";
      if (name === "UserRejectedRequestError" || message.includes("reject") || message.includes("denied")) return;
    }
  }
  handleClose();
  openWeb3ModalSafe();
};
```

(`handleConnectWallet` adalah fungsi biasa — taruh setelah early return, bersama handler lain. `handleClose()` = padanan `setIsLoginModalOpen(false)` widget.)

- [ ] **Step 1d: Rewire tombol Opsi 2 + hint degraded**

Ubah tombol Opsi 2 (baris 586-589): `onClick={handleConnectWallet}` (hapus `setCurrentView("ALL_WALLETS")`), hapus `disabled={isConnectingWallet}` (baris 590), hapus atribut terkait state yang dihapus nanti. Tambah hint `walletListBlocked` tepat setelah tombol Opsi 2: paragraf kecil `text-amber-800` (palet yang sudah dipakai file ini, baris 678) — teks: `Daftar dompet lambat dimuat — bila dialog tidak muncul, gunakan Email atau Google.`

- [ ] **Step 2: Hapus stack legacy (daftar eksak — satu blok per simbol)**

- `interface WalletListing` (baris 11-31)
- `POLYGON_CHAIN_ID_HEX` (33), `WALLETCONNECT_PROJECT_ID` (34) — `EVM_ADDRESS_REGEX` (32) **DIPERTAHANKAN** (dipakai SSO listener baris 296)
- `toAppKitWallet` (36-45), `WcProviderInstance` + `cachedWcProvider` (47-53), `getOrCreateWcProvider` (55-79) — termasuk hack `--wcm-z-index` PR #86 di dalamnya
- `INITIAL_WALLETS` (81-214, komentar "Kurasi dompet…" termasuk)
- State: `currentView` (215), `isConnectingWallet` (217), `connectingWalletName` (218), `copiedLink` (219), `searchQuery` (220), `wallets` (221), `isLoadingWallets` (222)
- `handleClose` (227-235): sisakan reset `setErrorMsg(null)` + `onClose()`
- Effect fetch explorer sudah diganti Step 1; `filteredWallets` + `useMemo` (269-274) + import `useMemo`
- `connectInjectedProvider` (365-433), `connectViaWalletConnect` (435-495) + subscription `RouterController` (hack PR #87), `handleSelectWallet` (497-513), `handleCopyLink` (515-524)
- JSX VIEW 2 `ALL_WALLETS` seluruhnya (613-753) termasuk footer "Buka Modal WalletConnect Resmi" & "Salin Link Studio"
- JSX VIEW 1: lepas conditional `currentView === "MAIN" && (...)` (541/611) — render fragmen langsung; perbarui komentar header view bila merujuk view kedua
- `disabled={isConnectingWallet}` pada tombol Opsi 2 (sudah di Step 1)

**TIDAK disentuh:** `LiteraLoginModalProps`, view MAIN (judul "Masuk ke Litera", opsi Email/Google), `handleEmailGoogleLogin`, SSO listener + `popupRef`, `EVM_ADDRESS_REGEX`, `LITERA_ORIGIN`, `errorMsg` banner, footer "Powered by Litera".

- [ ] **Step 3: Verifikasi: tidak ada referensi mati**

Run: `grep -n "WalletListing\|INITIAL_WALLETS\|ALL_WALLETS\|toAppKitWallet\|getOrCreateWcProvider\|connectViaWalletConnect\|connectInjectedProvider\|handleSelectWallet\|handleCopyLink\|RouterController\|EthereumProvider\|useMemo\|searchQuery\|isConnectingWallet" src/components/litera/LiteraLoginModal.tsx`
Expected: no output.

- [ ] **Step 4: Verifikasi kompilasi + lint + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/litera/LiteraLoginModal.tsx
git commit -m "feat(wallet): switch login modal to injected-first web3modal flow and remove custom wallet grid"
```

---

### Task 5: Hapus dependency legacy + CSP walletlink

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `next.config.ts` (CSP `connect-src`)

**Interfaces:**
- Consumes: Task 4 (tak ada lagi kode yang mengimpor dua dependency lama).
- Produces: `package.json` bebas `@walletconnect/*` & `@reown/*` (acceptance #5 spec); CSP mengizinkan `https://www.walletlink.org`.

- [ ] **Step 1: Uninstall dependency legacy**

Run: `npm uninstall @walletconnect/ethereum-provider @reown/appkit-controllers`
Expected: keduanya hilang dari `package.json`.

- [ ] **Step 2: Verifikasi nol referensi tersisa**

Run: `grep -rn "@walletconnect/\|@reown/" src/ package.json`
Expected: no output.

- [ ] **Step 3: Tambah `https://www.walletlink.org` ke `connect-src`**

Di `next.config.ts`, sisipkan tepat setelah `https://cca-lite.coinbase.com` (blok CSP baris 13): ` https://www.walletlink.org`. Jangan menyentuh direktif CSP lain.

- [ ] **Step 4: Verifikasi kompilasi + lint + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "chore(deps): drop walletconnect ethereum-provider and appkit-controllers, allow walletlink in CSP"
```

---

### Task 6: Quality gate final + verifikasi runtime

**Files:**
- (verifikasi saja; tanpa perubahan kode kecuali perbaikan yang ditemukan)

**Interfaces:**
- Consumes: hasil Task 1-5.

- [ ] **Step 1: Full gate**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: ketiganya exit 0. Jika gagal → perbaiki sebelum lanjut (jangan lanjut dengan gate merah).

- [ ] **Step 2: Greps kematian kode & dependency (acceptance #5 spec)**

Run:
```bash
grep -rn "@walletconnect/\|@reown/\|RouterController\|INITIAL_WALLETS\|ALL_WALLETS\|toAppKitWallet" src/ package.json
grep -n "wcm-z-index" src/components/litera/LiteraLoginModal.tsx
```
Expected: both no output.

- [ ] **Step 3: Probe CSP lokal (pin Review Focus #3)**

Run: `npm run build && npm run start` (atau `npm run dev`), lalu buka `http://localhost:3000/builder` via browser tool → baca console.

Expected: gate auth membuka login modal otomatis → preload `mountWeb3Modal()` menembak `api.web3modal.com` — console **tanpa** entry `Content-Security-Policy` yang memblokir host baru (`api.web3modal.com`, `walletlink.org`, `relay`, `verify`). Jika ada pelanggaran: tambahkan host ke `connect-src` (kembali ke Task 5 Step 3) dan ulangi.

- [ ] **Step 4: Handoff tes on-device ke user (acceptance #1-3 spec)**

Checklist untuk user jalankan di device nyata — laporkan hasil per butir:
1. Mobile browser biasa (Chrome/Safari, TANPA ekstensi): klik "Hubungkan Dompet" → popup AppKit "Connect Wallet" (Coinbase + All Wallets 610+) muncul **seketika** (tanpa jeda loading) → pilih MetaMask → layar "Continue in MetaMask" → dialog approval native → kembali → login sukses (`handleLoginSuccess`, tampil alamat).
2. Browser in-app MetaMask (atau desktop dengan ekstensi): klik → connect **langsung** tanpa popup.
3. Reload `/builder` setelah login: tidak ada error console, tidak ada state ganda (auto-reconnect idempoten).
4. Klik "Email atau Google": alur SSO persis seperti sebelumnya.
5. Menolak koneksi di wallet (reject) → tidak ada error aneh, tombol bisa diklik ulang; buka login modal → tutup → buka lagi 2× tanpa error console hooks (Rendered fewer hooks).

- [ ] **Step 5: Push menunggu konfirmasi user**

Jangan push. Tanyakan target: `main` / `develop` / `cancel` (aturan workspace — PR flow: push branch → `gh pr create` → `gh pr checks --watch` → merge setelah checks hijau, konfirmasi user tetap berlaku).
