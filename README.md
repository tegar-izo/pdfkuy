# pdfkuy 📄🔥

Urusan PDF? Gas. Toolkit PDF yang jalan **100% di browser** — file kamu nggak pernah di-upload ke server mana pun. Tanpa login, tanpa iklan nyebelin, tanpa drama.

Dibikin santuy buat (terutama) mahasiswa teknik komputer yang lagi nyusun tugas. 🫡

> 🌐 **Live:** [tegar-izo.github.io/pdfkuy](https://tegar-izo.github.io/pdfkuy)

## Kenapa ada ini?

Kumpul tugas itu urusan PDF terus: gabung ini, split itu, kompres biar muat limit upload, kasih nomor halaman biar nggak dimarahin dosen... Tools sebelah minta login + upload file tugasmu ke server mereka. **Kok tega?** Di sini semuanya prosesnya di perangkat kamu sendiri.

## Fitur (v1 — roadmap)

| Milestone | Fitur | Status |
|-----------|-------|--------|
| 2 | 🧩 Gabung PDF (merge) | ✅ |
| 3 | ✂️ Split PDF (ekstrak/hapus halaman) | ✅ |
| 4 | 🔄 Susun Halaman (rotate + drag & drop) | ✅ |
| 5 | 🖼️ Gambar ke PDF | ✅ |
| 6 | 🔢 Nomor Halaman otomatis | ✅ |
| 7 | 💧 Watermark nama/NIM | ✅ |
| 8 | 🗜️ Kompres PDF | ✅ |
| 9 | 📲 PWA — bisa dibuka offline + deteksi update | ✅ |

Rencana v2: PDF → gambar, gabung banyak gambar jadi satu PDF, dan lain-lain (santuy dulu).

**Offline & update:** begitu pernah dibuka sekali, semua aset (termasuk pdf.js & worker-nya) udah
ke-precache lewat service worker — jadi app-nya tetap jalan tanpa internet. Versi baru ke-detek
otomatis (tiap jam & tiap tab balik ke depan) dan lewat tombol **"Cek update sekarang"** di halaman
About; kalau ada versi baru muncul banner/tombol "Muat versi baru".

## Tech stack

- **Vue 3 + Vite + JavaScript** — UI, dengan route-level code splitting (bundle awal ringan)
- **Tailwind CSS v4** — desain playful & bold, ada dark mode 🌙
- **pdf-lib** — manipulasi PDF (merge, split, susun, nomor, watermark)
- **pdfjs-dist** — thumbnail preview & kompres (web worker, nggak nge-freeze UI)
- **vue-draggable-plus** — drag & drop halaman
- **vite-plugin-pwa + Workbox** — service worker, precache, manifest PWA (mode offline)
- **GitHub Actions → GitHub Pages** — deploy otomatis pas push ke `main`

Struktur kode:

```text
src/
├── lib/          # logika murni, teruji terpisah dari UI
│   ├── pdf.js          # merge, slice, arrange, nomor, watermark, images→pdf
│   ├── compress.js     # kompres via render ulang JPEG
│   ├── images.js       # normalisasi gambar (webp/gif → jpg)
│   ├── thumbnails.js   # render thumbnail pdf.js
│   └── pdfjs-setup.js  # konfigurasi web worker
├── pages/        # satu halaman per tool
├── composables/  # useDarkMode, usePwaUpdate (register SW + deteksi update)
├── components/   # UploadZone (drag&drop), DarkModeToggle, PwaUpdateBanner
└── router/       # daftar tools = sumber kebenaran (route + kartu landing)
```

## Jalanin lokal

```sh
npm install
npm run dev
```

Build buat production:

```sh
npm run build
npm run preview   # cek hasil build lokal
```

## Deploy

Auto: push ke `main` → GitHub Actions build → GitHub Pages. One-time setup di repo:
**Settings → Pages → Source: GitHub Actions**.

## Privacy

Seriuss. Nggak ada backend, nggak ada analytics yang ngirim file kamu ke mana-mana. Buka DevTools Network aja kalau nggak percaya. 😄

---

Dibikin buat belajar & portfolio. Bebas dipakai, jangan lupa kasih bintang kalau ngebantu. ⭐
