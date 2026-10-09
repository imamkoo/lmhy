# Design Spec — LMHY ↔ Litera Wallet-Connect Parity

- **Tanggal:** 2026-10-08
- **Status:** menunggu review user
- **Path:** architectural (brainstorming → spec → writing-plans → eksekusi)
- **Keputusan user:** Pendekatan A — mirror widget Litera; Web3Modal untuk semua platform (mobile & desktop), acuan screenshot popup "Connect Wallet" (Coinbase + All Wallets 610+)

## 1. Konteks & Masalah

Login wallet LMHY hari ini memakai implementasi custom di `LiteraLoginModal.tsx` (757 baris): grid 48 wallet buatan sendiri, fetch `explorer-api`, `EthereumProvider` embedded-modal + hack push view AppKit (PR #87), singleton provider (PR #88). Hasilnya visual mirip tetapi provider/flow berbeda dari Litera — gagal total di device user (layar "Continue in MetaMask" stuck tanpa URI).

Investigasi (read-only) menemukan:

| Surface Litera | Provider wallet |
|---|---|
| literaa.xyz desktop "Masuk ke Litera" | RainbowKit (`useSmartConnectModal`) |
| literaa.xyz mobile "Masuk ke Litera" | wagmi connector `walletConnect` → modal Reown AppKit |
| **Widget Litera (acuan screenshot)** | **injected-first → `@web3modal/wagmi@4` (AppKit) lazy** |

Widget memakai projectId `d94f04faafa515ac177c9c41052264b7` — **sama persis** dengan LMHY.

## 2. Tujuan / Non-Tujuan

**Tujuan:**
1. Klik "Hubungkan Dompet" di LMHY = perilaku tombol login widget Litera: injected-first (`window.ethereum` → connect langsung tanpa popup), selain itu `openWeb3ModalSafe()` → popup AppKit "Connect Wallet".
2. Mobile: popup → auto deep-link / tombol "Open" → dialog approval native wallet → kembali situs sudah login (perilaku AppKit resmi, tanpa hack).
3. Bersihkan seluruh kode custom yang tidak terpakai/mengganggu.

**Non-tujuan:**
- Privy email/Google — opsi "Email atau Google" LMHY tetap SSO redirect Litera Cloud seperti sekarang.
- Backend auth Litera (`widget-auth`, nonce cloud wallet) — di luar scope (LMHY landing-only, auth lokal `handleLoginSuccess` dipertahankan).
- Meniru RainbowKit desktop dashboard — sudah ditolak user (pilih Web3Modal semua).

## 3. Desain

### 3.1 Dependency & config

**Tambah** (versi mengikuti widget): `wagmi@^2.12.2`, `viem@^2.43.5`, `@tanstack/react-query@^5.90.16`, `@web3modal/wagmi@^4.1.11`.
**Hapus**: `@walletconnect/ethereum-provider@2.22.4`, `@reown/appkit-controllers@1.8.9`.

**File baru** — `src/components/litera/` (semua `"use client"`):

- **`wagmi-config.ts`** — mirror config widget (`litera-plugin-v2/src/config/index.tsx`):
  - `chains: [polygon]`
  - connectors: `walletConnect({ projectId, metadata, showQrModal: false })`, `injected({ shimDisconnect: true })`, `coinbaseWallet({ appName, appLogoUrl })`
  - `multiInjectedProviderDiscovery: true`, `ssr: false`
  - `transports: fallback([http(publicnode), http(1rpc)])` — proxy RPC Litera tidak dipakai (cross-origin); kedua host sudah ada di CSP LMHY
  - `projectId: d94f04faafa515ac177c9c41052264b7`
  - `metadata` identitas **LMHY** ("Let Me Hear You", https://letmehearyou.id, icon-192) — projectId sama, identitas tetap LMHY
- **`web3modal-lazy.ts`** — salinan adaptif widget (`litera-plugin-v2/src/web3modal-lazy.ts`):
  - `mountWeb3Modal()`: lazy `import('@web3modal/wagmi/react')` → `createWeb3Modal({ wagmiConfig, projectId, metadata, enableAnalytics: false, themeMode: 'light', themeVariables: { '--w3m-accent': '#d07954', '--w3m-border-radius-master': '12px' }, featuredWalletIds: [Bitget, MetaMask, Trust, OKX] })`
  - `openWeb3ModalSafe()`: `open()` sinkron jika instance siap (kewajiban gesture mobile), jika belum → muat chunk dulu (jalur loading/error)
  - `probeWalletListReachable()`, `subscribeWeb3ModalOpen()`, state loading/error subscribe — struktur sama widget
  - Catatan gesture dari widget dipertahankan sebagai komentar: chunk HARUS di-preload saat shell modal dibuka agar `open()` sinkron dalam user gesture

### 3.2 Alur koneksi (identik widget `handleConnectWallet`)

1. Shell modal (`LiteraLoginModal`) terbuka → `useEffect(isOpen)` → **preload** `mountWeb3Modal()` (+ `probeWalletListReachable()` → state fallback).
2. Klik **"Hubungkan Dompet"** → tutup shell (`onClose()`), lalu:
   - `window.ethereum` ada → `connectAsync({ connector: injected })` — **langsung, tanpa popup**. User-reject → diam; error lain → jatuh ke langkah berikutnya.
   - Selain itu → `openWeb3ModalSafe()` → popup "Connect Wallet".
3. Sukses: `useAccount()` mendeteksi `address` pertama kali → `onSuccess(address, method)`; `method` = nama provider terdeteksi (mis. "MetaMask") untuk injected, `"WalletConnect"` untuk jalur modal. `handleLoginSuccess` lokal LMHY **tidak berubah**.
4. Web3Modal ditutup tanpa connect → user kembali ke halaman builder; tombol "Hubungkan Akun Litera" tetap bisa diklik lagi (tanpa auto-reopen shell — widget juga tidak melakukan itu).

### 3.3 Cleanup `LiteraLoginModal.tsx` (~300+ baris dihapus)

- View `ALL_WALLETS` penuh: header "Kembali/All Wallets/X", search bar, grid wallet, `INITIAL_WALLETS`, `WalletListing`, `toAppKitWallet`, fetch `explorer-api`, state `searchQuery`/`isLoadingWallets`/`filteredWallets`/`connectingWalletName`
- Footer modal: tombol "Buka Modal WalletConnect Resmi" + "Salin Link Studio" (`handleCopyLink` modal — duplikat; builder punya "Salin Link" sendiri di `WebBuilderClient`)
- `connectViaWalletConnect`, subscription `RouterController` (hack PR #87), `getOrCreateWcProvider` singleton (PR #88), mapping error relay
- `connectInjectedProvider` manual → digantikan jalur wagmi injected
- Hack z-index `--wcm-z-index` (PR #86) — tak perlu lagi: shell ditutup sebelum Web3Modal dibuka, tidak ada tumpang-tindih
- **Tetap:** view MAIN (2 opsi), `handleEmailGoogleLogin` (SSO Litera Cloud), `onSuccess` → `handleLoginSuccess`

### 3.4 CSP & integrasi Next.js

- `next.config.ts` `connect-src`: tambah `https://www.walletlink.org` (protokol Coinbase walletlink). Host lain sudah lengkap dari PR #86–#89: `api.web3modal.com`, `explorer-api`, `rpc/pulse.walletconnect.com`, `wss://relay.walletconnect.com`, `verify.*` (PR #89).
- Provider: bungkus pemakaian `LiteraLoginModal` di `WebBuilderClient` dengan `<WagmiProvider config={…}><QueryClientProvider client={…}>` (client wrapper kecil — cukup mengelilingi modal, bukan seluruh app).
- Semua modul baru `"use client"`; config dibuat aman untuk SSR (`ssr: false`, akses `window` hanya di runtime/event).

## 4. Acceptance Criteria

1. Mobile browser biasa (tanpa `window.ethereum`): klik "Hubungkan Dompet" → **popup AppKit "Connect Wallet" (Coinbase + All Wallets 610+)** identik screenshot widget.
2. `window.ethereum` ada (ekstensi desktop / in-app browser wallet): connect **langsung** tanpa popup.
3. Mobile: popup → deep-link/"Open" ke wallet → approval native → kembali → `handleLoginSuccess` terpanggil (address + method).
4. Opsi "Email atau Google" & alur SSO tidak berubah perilakunya.
5. `package.json` tidak lagi memuat `@walletconnect/*` maupun `@reown/*`; tidak ada import mati (`RouterController`, `ConnectionController`, dll).
6. `npm run lint`, `npx tsc --noEmit`, `npm run build` lulus; console browser bebas pelanggaran CSP untuk host baru.

## 5. Risiko

| Risiko | Mitigasi |
|---|---|
| Chunk AppKit ~5MB memperlambat load | Lazy-load + preload saat shell modal dibuka (pola widget) |
| Coinbase walletlink diblokir CSP | Tambah `www.walletlink.org` ke `connect-src` sekarang; probe console-CSP saat verifikasi |
| Quirk wagmi/Next SSR | `"use client"` + wrapper provider client-only + `ssr: false` |
| Relay/Litera-proxy tidak tersedia di LMHY | Transport publicnode+1rpc (sudah di-allow CSP) |
