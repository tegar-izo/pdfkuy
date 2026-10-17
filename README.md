# pdfkuy 📄🔥

Urusan PDF? Gas. Toolkit PDF yang jalan **100% di browser** — file kamu nggak pernah di-upload ke server mana pun. Tanpa login, tanpa iklan nyebelin, tanpa drama.

Dibikin santuy buat (terutama) mahasiswa teknik komputer yang lagi nyusun tugas. 🫡

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

Rencana v2: PDF → gambar, gabung banyak gambar jadi satu PDF, dan lain-lain (santuy dulu).

## Tech stack

- **Vue 3 + Vite + JavaScript** — UI
- **Tailwind CSS v4** — desain playful & bold, ada dark mode 🌙
- **pdf-lib / pdf.js** — mesin PDF-nya (nanti di milestone berikutnya)
- **GitHub Actions → GitHub Pages** — deploy otomatis pas push ke `main`

## Jalanin lokal

```sh
npm install
npm run dev
```

Build buat production:

```sh
npm run build
```

## Privacy

Seriuss. Nggak ada backend, nggak ada analytics yang ngirim file kamu ke mana-mana. Buka DevTools Network aja kalau nggak percaya. 😄

---

Dibikin buat belajar & portfolio. Bebas dipakai, jangan lupa kasih bintang kalau ngebantu. ⭐
