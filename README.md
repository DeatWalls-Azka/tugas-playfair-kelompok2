<div align="center">

# 3D PLAYFAIR CIPHER

**Visualisasi interaktif sandi Playfair di dalam ruangan 3D.**

Menampilkan proses enkripsi & dekripsi Playfair langkah demi langkah di ruangan bergaya terminal DOS:
matriks 5×5 terbentuk dari key, setiap bigram dianimasikan, plus efek suara — semuanya berjalan di sisi klien.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Three.js](https://img.shields.io/badge/Three.js-0.161-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![React Three Fiber](https://img.shields.io/badge/React%20Three%20Fiber-8.15-black)](https://docs.pmnd.rs/react-three-fiber)
[![Drei](https://img.shields.io/badge/drei-9.99-black)](https://github.com/pmndrs/drei)
[![Postprocessing](https://img.shields.io/badge/postprocessing-6.35-8A2BE2)](https://github.com/pmndrs/postprocessing)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-CDN-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

## Informasi Tugas

| Item | Keterangan |
| --- | --- |
| Mata Kuliah | Keamanan Informasi |
| Paralel | K2 |
| Tugas | Aplikasi & Laporan Playfair Cipher |
| Tenggat | 18 September 2026 |
| Bahasa / Stack | JavaScript — React + Vite |

## Fitur

- **Input** — upload file `.txt` (file picker) + key berupa passphrase.
- **Output** — hasil enkripsi/dekripsi bisa disalin atau disimpan sebagai `.txt`.
- **Matriks 5×5** — dibangun dinamis mengikuti key, tampil di layar monitor 3D.
- **Visualisasi bigram** — tiap pasangan huruf dianimasikan sesuai aturannya, dengan play/pause, step maju-mundur, dan slider kecepatan.
- **Mode Encrypt / Decrypt** — arah pergeseran dibalik otomatis.
- **GUI** — ruangan 3D yang bisa dijelajahi, panel HUD dapat digeser, gaya tampilan SOLID/ASCII, efek suara.

## Cara Kerja

- `J` digabung ke `I`; key unik + sisa alfabet → matriks 5×5.
- Pesan dipecah jadi bigram; huruf kembar disisipi `X`, sisa ganjil ditutup `X`.
- Baris sama → geser kanan · kolom sama → geser bawah · selain itu → tukar sudut persegi panjang.
- Dekripsi memakai aturan yang sama dengan arah berlawanan.
- Output akhir berupa teks bersih tanpa spasi.

## Cara Menggunakan

1. **Masuk** — tunggu teks pembuka selesai, lalu klik di mana saja (atau tekan tombol apa pun).
2. **Jelajahi ruangan** dengan keyboard:

| Tombol | Fungsi |
| --- | --- |
| `[W]` / `[↑]` | Maju |
| `[S]` / `[↓]` | Mundur |
| `[A]` / `[←]` | Ke sisi **kiri** |
| `[D]` / `[→]` | Ke sisi **kanan** |

3. **Fokus layar** — klik monitor untuk mendekat ke matriks Playfair; bergerak untuk kembali menjelajah.
4. **Isi Key & Input** — panel *Passphrase / Input*, atau muat teks lewat **Load .txt** (**Clear** untuk mengosongkan).
5. **Pilih mode** — **Encrypt** / **Decrypt**; **SOLID/ASCII** untuk gaya visual; **AUDIO** untuk suara.
6. **Putar animasi** — panel *Bigram Stepper*: ⏮ `◀` Play/Pause `▶` ⏭, slider **Speed**, **Copy**, **Save .txt**.
7. **Tata panel** — panel dan bilah *DIGRAPHS* bisa digeser; tombol `—` menyembunyikan panel, dan pada layar kecil tersedia menu **☰**.

## Setup

**Prasyarat:** Node.js 18+ dan npm, serta koneksi internet (font & Tailwind dimuat via CDN).

```bash
npm install       # install dependency
npm run dev       # jalankan server development
```

Buka URL yang tercetak di terminal (default `http://localhost:5173`).

```bash
npm run build     # build produksi ke folder dist/
npm run preview   # pratinjau hasil build
```

> Suara baru aktif setelah interaksi pertama pengguna, sesuai kebijakan autoplay browser.

## Struktur Proyek

```text
tugas-playfair-kelompok2/
├── public/
│   ├── favicon.svg             # Ikon situs
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── 3d/                 # Objek & scene React Three Fiber
│   │   │   ├── Scene.jsx         # Root scene, lampu, komposisi objek
│   │   │   ├── Room.jsx          # Geometri ruangan bergaya DOS
│   │   │   ├── MonitorScreen.jsx # Layar monitor: matriks & animasi langkah
│   │   │   ├── FloatingTerminal.jsx # Terminal melayang (bisa diseret)
│   │   │   └── Player.jsx        # Pergerakan kamera (keyboard)
│   │   └── ui/                 # Antarmuka overlay HTML
│   │       ├── Intro.jsx         # Layar pembuka
│   │       ├── HUD.jsx           # Panel: input, key, mode, playback
│   │       └── ShatterCanvas.jsx # Transisi efek pecahan kaca
│   ├── constants/scene.js      # Konstanta ukuran & tata letak scene
│   ├── utils/
│   │   ├── Cipher.js           # Logika Playfair (buildGrid, toBigrams, runCipher)
│   │   └── SoundEngine.js      # Sintesis audio Web Audio API
│   ├── App.jsx                 # State utama & orkestrasi alur aplikasi
│   ├── index.css               # Style global, overlay scanline/grain
│   └── main.jsx                # Entry point React
├── index.html                  # Template HTML (font + Tailwind CDN)
├── index_original.html         # Versi awal aplikasi
├── vite.config.js              # Konfigurasi Vite
├── .oxlintrc.json              # Konfigurasi lint
├── .gitignore / .gitattributes # Konfigurasi Git
├── package.json
└── *.cjs                       # Skrip bantu development (extract, fix, refactor, rebuild, restore)
```
