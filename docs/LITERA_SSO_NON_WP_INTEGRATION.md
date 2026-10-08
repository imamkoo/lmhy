# Panduan Integrasi Autentikasi Litera (SSO & Web3 Wallet) untuk Web Non-WordPress

Dokumentasi arsitektur dan panduan implementasi teknis untuk developer dApp, platform web custom, atau aplikasi pihak ketiga (Next.js, Vite, React, Vue, Svelte, dll.) yang ingin menghubungkan pengguna ke ekosistem **Litera**.

---

## 1. Latar Belakang & Masalah Mobile Web3

Pada browser seluler biasa (Android Chrome, iOS Safari, browser media sosial):
- **User Gesture Restriction:** Pemicu pop-up / deep link dompet (seperti MetaMask, Trust Wallet) yang dieksekusi secara asinkron (misalnya menunggu chunk download atau WebSocket connection) sering kali diblokir oleh sistem operasi seluler.
- **Inconsistent WalletConnect Handling:** Beberapa wallet client di web pihak ketiga mengalami kegagalan membuka protokol URI `wc:...` atau deep-link intent app.

### Solusi Standar Litera:
Litera menyediakan dua jalur autentikasi terpadu:
1. **Desktop / Web3 Native In-App Browser:** Direct Web3 Connection (Injected Provider `window.ethereum` atau RainbowKit / WalletConnect).
2. **Mobile Browser Standar (Chrome / Safari):** Terintegrasi langsung dengan **Litera Cloud SSO / Widget Auth (`https://literaa.xyz/widget-auth`)** yang menangani pembuatan dompet otomatis (Email/Google via Privy) maupun koneksi Web3 via RainbowKit yang 100% kompatibel di Android & iOS.

---

## 2. Alur Kerja (Workflow)

```
+-------------------------------------------------------------------------+
|                              Web Klien                                  |
|   (Tombol "Hubungkan Akun Litera" -> Modal Pilihan Login)               |
+-------------------------------------------------------------------------+
              |                                             |
   [ Opsi A: Email / Google ]                    [ Opsi B: Dompet Web3 ]
              |                                             |
              v                                             v
  Kirim ke Litera Widget Auth                  Cek Provider & Perangkat
  `auth=email`                                              |
                                     +----------------------+----------------------+
                                     |                                             |
                             Desktop Extension /                             Mobile Browser
                             In-App dApp Browser                                   |
                                     |                                             v
                                     v                               Kirim ke Litera Widget Auth
                            `connectAsync(injected)`                 `auth=wallet`
```

---

## 3. Spesifikasi Protokol Handshake (`/widget-auth`)

### URL Endpoint
`https://literaa.xyz/widget-auth`

### Parameter Query
| Parameter | Tipe | Wajib | Deskripsi |
| :--- | :--- | :--- | :--- |
| `article` | `string` | Ya | URL callback tujuan pengembalian hasil autentikasi (misal: `https://yourdomain.com/dashboard` atau `window.location.href`). |
| `state` | `string` | Ya | String acak unik (Anti-CSRF Nonce) yang dihasilkan oleh web klien dan disimpan di `sessionStorage`. |
| `auth` | `'email' \| 'wallet'` | Opsional | Mode default saat halaman dibuka: `'email'` (Privy Email/Google) atau `'wallet'` (RainbowKit Wallet Modal). |
| `tokenId` | `string \| number` | Opsional | ID token NFT jika berkaitan dengan artikel berbayar/terkunci. |
| `contract` | `string` | Opsional | Alamat smart contract Litera (default: ERC1155 Litera Polygon). |

---

## 4. Implementasi di Web Klien

### A. Membuka Autentikasi (Client-Side)

```typescript
export function openLiteraAuth(authMode: 'email' | 'wallet' = 'email') {
  const nonce = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

  // Simpan nonce untuk verifikasi anti-CSRF saat callback kembali
  try {
    sessionStorage.setItem('litera_sso_nonce', nonce);
  } catch (e) {}

  const callbackUrl = window.location.href;
  const authUrl = `https://literaa.xyz/widget-auth?article=${encodeURIComponent(
    callbackUrl
  )}&state=${encodeURIComponent(nonce)}&auth=${authMode}`;

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

  // 1. Mobile: Lakukan full-page redirect
  if (isMobile) {
    window.location.assign(authUrl);
    return;
  }

  // 2. Desktop: Buka pop-up window di tengah layar
  const w = 460;
  const h = 700;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;

  const popup = window.open(
    authUrl,
    'litera-auth-window',
    `width=${w},height=${h},left=${left},top=${top},status=no,menubar=no,toolbar=no`
  );

  if (!popup) {
    window.location.assign(authUrl);
  }
}
```

---

### B. Menerima Hasil Autentikasi

Web klien harus menangani **2 skenario kembalinya data**:

#### 1. Desktop Pop-up (`window.addEventListener('message')`):
Litera Widget Auth akan mengirim pesan `postMessage` ke `window.opener`:
```typescript
useEffect(() => {
  const handleAuthMessage = (event: MessageEvent) => {
    // Validasi origin terpercaya
    if (
      event.origin !== 'https://literaa.xyz' &&
      !event.origin.endsWith('.literaa.xyz')
    ) {
      return;
    }

    const data = event.data;
    if (data && data.type === 'LITERA_CLOUD_LOGIN_SUCCESS' && data.address) {
      const savedNonce = sessionStorage.getItem('litera_sso_nonce');
      if (data.state && savedNonce && data.state !== savedNonce) {
        console.error('Sesi CSRF tidak cocok!');
        return;
      }

      sessionStorage.removeItem('litera_sso_nonce');
      console.log('Login sukses, alamat:', data.address);
      // Simpan address ke state / session web Anda
    }
  };

  window.addEventListener('message', handleAuthMessage);
  return () => window.removeEventListener('message', handleAuthMessage);
}, []);
```

#### 2. Mobile Redirect (Query Parameter Callback):
Setelah login sukses di mobile, Litera akan me-redirect pengguna kembali ke `article` dengan query parameter:
`https://yourdomain.com/callback?lite_addr=0x1234...&lite_state=<nonce>`

```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const liteAddr = urlParams.get('lite_addr');
  const liteState = urlParams.get('lite_state');

  if (liteAddr) {
    const savedNonce = sessionStorage.getItem('litera_sso_nonce');
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;

    if (liteState && savedNonce && liteState !== savedNonce) {
      console.error('State nonce CSRF mismatch.');
    } else if (!evmRegex.test(liteAddr)) {
      console.error('Alamat EVM tidak valid.');
    } else {
      console.log('Berhasil terhubung via Mobile Redirect:', liteAddr);
      sessionStorage.removeItem('litera_sso_nonce');
      // Set state login pengguna di sini
    }

    // Bersihkan query string dari address bar
    urlParams.delete('lite_addr');
    urlParams.delete('lite_state');
    const cleanQuery = urlParams.toString();
    const cleanUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '');
    window.history.replaceState({}, document.title, cleanUrl);
  }
}, []);
```

---

## 5. Ringkasan Keunggulan

1. **Zero Hassle Mobile Web3:** Pengembang tidak perlu pusing mengonfigurasi walletconnect relay server / universal links rumit di sisi klien seluler.
2. **Dual Mode:** Mendukung user yang belum punya dompet Web3 (bisa pakai Email / Google) dan Web3 enthusiast (MetaMask, Bitget, Trust, Coinbase).
3. **Standar Keamanan:** Dilengkapi verifikasi State Nonce Anti-CSRF dan validasi Regex Alamat EVM Polygon.
