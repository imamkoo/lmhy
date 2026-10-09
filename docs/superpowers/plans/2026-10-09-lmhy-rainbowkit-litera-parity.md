# LMHY RainbowKit Litera Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti modal koneksi Web3 di LMHY ke `@rainbow-me/rainbowkit` (persis stack `literaa.xyz/home`) agar membuka pop-up intent Android otomatis (*"Choose activity: Chrome / MetaMask"*) dan tombol `↗ Open`, serta membersihkan file & cache tidak penting.

**Architecture:** Gunakan `getDefaultConfig` dari `@rainbow-me/rainbowkit` dengan chain Polygon dan grup dompet Populer, wrap dengan `RainbowKitProvider` bertema Warm Sanctuary (`#d07954`), panggil `useConnectModal()` di `LiteraLoginModal.tsx`, dan hapus dependensi/file Web3Modal lama.

**Tech Stack:** `@rainbow-me/rainbowkit@^2.2.11`, `wagmi@^2.19.5`, `viem@^2.57.4`, `@tanstack/react-query@^5.90.16`, Next.js 16 (Turbopack, App Router).

**Spec:** `docs/superpowers/specs/2026-10-09-lmhy-rainbowkit-litera-parity-design.md`

## Global Constraints
- Target parity: Tampilan dan behavior koneksi identik dengan `literaa.xyz/home` (RainbowKit "All Wallets" & Android system intent chooser).
- Design system: Token Warm Sanctuary (`#d07954` accent, medium border-radius).
- SSR Safety: Bebas runtime error `indexedDB is not defined` dan hydration warning di Next.js 16.
- Quality Gates: `npm run lint` (0 error), `npx tsc --noEmit` (lolos), `npm run build` (sukses).

## Review Focus
- Android mobile intent: Membuka dialog sistem Android "Choose activity: MetaMask" saat klik MetaMask.
- Desktop browser: Membuka injected provider secara langsung bila ekstensi terpasang.
- SSR Safety: Halaman `/builder` dapat diakses SSR tanpa throw error.
- Bundle cleanliness: Nol sisa chunk atau modul `@web3modal`.

---

### Task 1: Pasang `@rainbow-me/rainbowkit` & Hapus `@web3modal/wagmi`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install `@rainbow-me/rainbowkit@^2.2.11` dan uninstall `@web3modal/wagmi`**
```bash
npm install @rainbow-me/rainbowkit@^2.2.11
npm uninstall @web3modal/wagmi
```

- [ ] **Step 2: Verifikasi instalasi**
```bash
node -e "const p=require('./package.json'); console.log({ rainbow: p.dependencies['@rainbow-me/rainbowkit'], web3modal: p.dependencies['@web3modal/wagmi'] })"
```
Expected: `rainbow: '^2.2.11', web3modal: undefined`

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore(deps): install @rainbow-me/rainbowkit and remove @web3modal/wagmi"
```

---

### Task 2: Konfigurasi Wagmi via `getDefaultConfig` RainbowKit

**Files:**
- Modify: `src/components/litera/wagmi-config.ts`

- [ ] **Step 1: Update `src/components/litera/wagmi-config.ts`**
Konfigurasi `getDefaultConfig` dari `@rainbow-me/rainbowkit` dengan Polygon, wallets (`metaMaskWallet`, `trustWallet`, `bitgetWallet`, `coinbaseWallet`, `braveWallet`, `walletConnectWallet`), `ssr: true`, dan fallback transport Polygon.

- [ ] **Step 2: Typecheck**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/components/litera/wagmi-config.ts
git commit -m "feat(wallet): configure wagmi with rainbowkit getDefaultConfig and popular wallets"
```

---

### Task 3: Provider Wrapper RainbowKit

**Files:**
- Modify: `src/components/litera/Web3Providers.tsx`

- [ ] **Step 1: Update `Web3Providers.tsx`**
Import `@rainbow-me/rainbowkit/styles.css` dan bungkus children dengan `<RainbowKitProvider theme={lightTheme({ accentColor: '#d07954', borderRadius: 'medium' })}>`. Pertahankan `useSyncExternalStore` guard untuk SSR hydration safety.

- [ ] **Step 2: Typecheck & Lint**
```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/components/litera/Web3Providers.tsx
git commit -m "feat(wallet): wrap application in RainbowKitProvider with Warm Sanctuary theme"
```

---

### Task 4: Hubungkan Modal Login ke RainbowKit & Hapus File Web3Modal

**Files:**
- Modify: `src/components/litera/LiteraLoginModal.tsx`
- Delete: `src/components/litera/web3modal-lazy.ts`

- [ ] **Step 1: Hapus `src/components/litera/web3modal-lazy.ts`**
```bash
rm -f src/components/litera/web3modal-lazy.ts
```

- [ ] **Step 2: Update `LiteraLoginModal.tsx`**
Gunakan `useConnectModal` dari `@rainbow-me/rainbowkit`. Pada `handleConnectWallet`, tutup modal login (`handleClose()`) lalu panggil `openConnectModal?.()`.

- [ ] **Step 3: Verifikasi Lint, TSC, dan Build**
```bash
npm run lint && npx tsc --noEmit && npm run build
```

- [ ] **Step 4: Commit**
```bash
git rm src/components/litera/web3modal-lazy.ts
git add src/components/litera/LiteraLoginModal.tsx
git commit -m "feat(wallet): trigger RainbowKit connect modal on connect wallet action"
```

---

### Task 5: Pembersihan Cache & File Untracked

**Files:**
- Cleanup: `.superpowers/brainstorm/`, `docs/ops/`, `.next`

- [ ] **Step 1: Hapus folder dan cache yang tidak terpakai**
```bash
rm -rf .superpowers/brainstorm docs/ops .next
```

- [ ] **Step 2: Verifikasi status git**
```bash
git status --short
```

---

### Task 6: Full Verification Gate, PR & Deploy

- [ ] **Step 1: Jalankan Full Quality Gate**
```bash
npm run lint && npx tsc --noEmit && npm run build
```

- [ ] **Step 2: Minta konfirmasi push target branch sesuai aturan Imkollective (`main` / `develop` / `cancel`)**
- [ ] **Step 3: Push branch, buat PR, tunggu checks CI, dan merge ke `main`**
