# Design Spec: Migrasi LMHY ke RainbowKit (Parity Penuh dengan Litera Dashboard)

**Tanggal:** 2026-10-09  
**Status:** Approved by User  
**Tujuan:** Mengganti modal koneksi Web3 di LMHY dari `@web3modal/wagmi` ke `@rainbow-me/rainbowkit` (stack yang sama persis dengan `literaa.xyz/home`), sehingga saat user di mobile mengklik MetaMask, sistem Android langsung memicu prompt intent (*"Choose activity: Chrome / MetaMask"*) dan tombol *`↗ Open`* tanpa stuck.

---

## 1. Analisis & Perbandingan Stack

| Parameter | `@web3modal/wagmi` (Lama) | `@rainbow-me/rainbowkit` (Baru / `literaa.xyz`) |
|---|---|---|
| **Modal UI** | Web3Modal AppKit | RainbowKit "All Wallets" (Image 1) |
| **Mobile Intent Handshake** | Pasif ("Accept connection request", "Try again") | Aktif (*Android System Intent* / `↗ Open` / "Choose activity: MetaMask", Image 2) |
| **Integrasi Wagmi** | Wagmi v2 + AppKit Controllers | Native Wagmi v2 (`getDefaultConfig` + `RainbowKitProvider`) |
| **Kompatibilitas SSR** | Membutuhkan dynamic import & custom listeners | `useSyncExternalStore` + `RainbowKitProvider` |

---

## 2. Rincian Perubahan Arsitektur

### 2.1 Dependencies
- **Tambah:** `@rainbow-me/rainbowkit@^2.2.11`
- **Hapus:** `@web3modal/wagmi`
- **Pertahankan:** `wagmi@^2.19.5`, `viem@^2.57.4`, `@tanstack/react-query@^5.90.16`

### 2.2 Konfigurasi Wagmi & RainbowKit (`src/components/litera/wagmi-config.ts`)
- Menggunakan `getDefaultConfig` dari `@rainbow-me/rainbowkit`:
  - `appName`: "Let Me Hear You"
  - `projectId`: `d94f04faafa515ac177c9c41052264b7` (sama dengan Litera)
  - `chains`: `[polygon]`
  - `wallets`: Group 'Populer' (`metaMaskWallet`, `trustWallet`, `bitgetWallet`, `coinbaseWallet`, `braveWallet`, `walletConnectWallet`)
  - `transports`: Polygon fallback (`publicnode` + `1rpc`)
  - `ssr: true`

### 2.3 Provider Wrapper (`src/components/litera/Web3Providers.tsx`)
- Import `@rainbow-me/rainbowkit/styles.css`
- Wrap tree: `WagmiProvider` → `QueryClientProvider` → `RainbowKitProvider`
- Tema: `lightTheme({ accentColor: '#d07954', borderRadius: 'medium' })` (Warm Sanctuary token)
- Guard SSR via `useSyncExternalStore` (zero cascading renders / SSR hydration error safe)

### 2.4 Modal Login (`src/components/litera/LiteraLoginModal.tsx`)
- Menggunakan hook `useConnectModal` dari `@rainbow-me/rainbowkit`.
- Handler "Hubungkan Dompet":
  - Memanggil `handleClose()` untuk menutup modal Litera.
  - Memanggil `openConnectModal?.()` untuk membuka modal RainbowKit.
- Hapus semua import dan pemanggilan `web3modal-lazy.ts`.

### 2.5 Pembersihan Cache & File Tidak Penting
- Hapus `src/components/litera/web3modal-lazy.ts`
- Hapus file untracked `.superpowers/brainstorm/` dan `docs/ops/`
- Bersihkan cache build `.next`

---

## 3. Quality Gate
1. `npm run lint` (0 error)
2. `npx tsc --noEmit` (0 type error)
3. `npm run build` (Next.js 16 build sukses)
4. Runtime SSR: 200 OK
