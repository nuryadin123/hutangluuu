# Cara Membuat APK Android dari Proyek Next.js

Dokumen ini memberikan panduan langkah demi langkah untuk mengubah aplikasi web Next.js Anda menjadi file APK Android yang dapat diinstal, menggunakan [Capacitor](https://capacitorjs.com/).

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstal perangkat lunak berikut di komputer Anda:
1.  [Node.js](https://nodejs.org/en/)
2.  [Android Studio](https://developer.android.com/studio) dengan Android SDK yang sudah terkonfigurasi.

## Langkah-langkah

### Langkah 1: Konfigurasi Proyek Next.js untuk Ekspor Statis

Capacitor bekerja dengan membungkus aset web statis (HTML, CSS, JavaScript). Kita perlu mengkonfigurasi Next.js untuk menghasilkan output ini.

File `next.config.js` Anda telah diperbarui secara otomatis untuk menyertakan `output: 'export'` dan menonaktifkan optimisasi gambar Next.js (yang tidak kompatibel dengan ekspor statis). Ini akan membuat hasil build statis di dalam folder `out/`.

### Langkah 2: Instal dan Inisialisasi Capacitor

1.  **Instal Capacitor CLI (Command Line Interface) & Core:**
    Buka terminal di direktori proyek Anda dan jalankan:
    ```bash
    npm install @capacitor/cli @capacitor/core
    ```

2.  **Inisialisasi Capacitor di Proyek Anda:**
    Jalankan perintah berikut dan ikuti petunjuknya.
    ```bash
    npx cap init
    ```
    - **App Name?** Masukkan nama aplikasi Anda (misal: `DebtFlow`).
    - **Package ID?** Masukkan ID paket unik, biasanya dalam format `com.domain.appname` (misal: `com.debtflow.app`).
    - **Web Asset Directory?** **PENTING:** Saat ditanya direktori web, masukkan `out`.

### Langkah 3: Tambahkan Platform Android

1.  **Instal Paket Android Capacitor:**
    ```bash
    npm install @capacitor/android
    ```

2.  **Tambahkan Android ke Proyek Anda:**
    Perintah ini akan membuat folder `android` di dalam proyek Anda yang berisi proyek Android Studio native.
    ```bash
    npx cap add android
    ```

### Langkah 4: Build dan Sinkronisasi Aplikasi Web Anda

Setiap kali Anda membuat perubahan pada kode Next.js, Anda perlu membangunnya kembali dan menyinkronkan aset web dengan proyek Android.

1.  **Build Aplikasi Next.js:**
    ```bash
    npm run build
    ```

2.  **Sinkronkan dengan Capacitor:**
    Perintah ini akan menyalin aset web dari folder `out` ke dalam proyek Android native Anda.
    ```bash
    npx cap sync
    ```

### Langkah 5: Buka Proyek di Android Studio

Sekarang, buka proyek Android native yang baru saja dibuat di Android Studio.
```bash
npx cap open android
```
Perintah ini akan secara otomatis meluncurkan Android Studio dengan proyek Anda.

### Langkah 6: Buat APK di Android Studio

Setelah proyek terbuka di Android Studio:
1.  Tunggu hingga proses sinkronisasi Gradle selesai (mungkin perlu beberapa saat pada kali pertama).
2.  Dari bilah menu, buka **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
3.  Android Studio akan memulai proses build. Setelah selesai, sebuah notifikasi akan muncul di sudut kanan bawah. Klik pada tautan **"locate"** untuk menemukan file `app-debug.apk` Anda di dalam folder `app/build/outputs/apk/debug/`.

File APK ini sekarang dapat Anda salin ke perangkat Android untuk diinstal dan diuji.
