# Hotel Rate Aggregator - Syafar Tour

Internal tool untuk mencari harga hotel Makkah/Madinah dan membuat quotation paket umrah/haji.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

## Project Structure

```
fe/
├── app/
│   ├── page.tsx                 # Halaman Search Hotel (main entry)
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles + Tailwind
│   ├── api/
│   │   ├── hotels/route.ts      # Mock Trip.com API
│   │   ├── quotation/route.ts   # Validasi dan kalkulasi quotation
│   │   └── exchange-rate/route.ts # Proxy kurs SAR→IDR
├── components/
│   ├── SearchForm.tsx           # Form pencarian hotel
│   ├── HotelCard.tsx            # Kartu hotel dengan estimasi kamar
│   ├── QuotationForm.tsx        # Form input komponen biaya
│   ├── QuotationSummary.tsx     # Hasil breakdown quotation
│   └── SavedQuotations.tsx      # Arsip quotation lokal
├── lib/
│   ├── mockHotels.ts            # Data dummy 5 hotel
│   ├── roomCalculator.ts        # Logic pembulatan kamar
│   ├── quotationCalculator.ts   # Logic hitung total & harga jual
│   ├── exchangeRate.ts          # Fetch + cache kurs SAR→IDR
│   ├── currencyInput.ts         # Format mata uang id-ID
│   ├── dateUtils.ts             # Batas tanggal Asia/Jakarta
│   └── validation.ts            # Validasi API form & input
├── types/
│   ├── hotel.ts                 # Type definisi Hotel
│   └── quotation.ts             # Type definisi Quotation
└── package.json
```

## Getting Started

### Install Dependencies

```bash
cd fe
npm install
```

### Development

```bash
npm run dev
```

Buka http://localhost:3000

### Build Production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Features

### 1. Search Hotel
- Pilih kota: Makkah / Madinah
- Tanggal check-in & check-out
- Jumlah jamaah
- Tipe kamar: Double / Triple / Quad / Quint

### 2. Hotel Results
- Menampilkan 5 hotel dummy per kota
- Estimasi jumlah kamar (pembulatan ke atas)
- Total biaya hotel preview
- Cari nama hotel, filter rentang harga, dan urutkan harga termurah/termahal
- Tombol "PILIH HOTEL"
- Loading, empty state, dan alert retry ketika API gagal

### 3. Quotation Form
- Kurs SAR→IDR: auto-fetch dari API eksternal (dengan fallback manual)
- Tax hotel (%): terisi dari data hotel dan dapat diubah untuk quotation aktif (0–100%)
- Visa per pax (SAR)
- Transport total (SAR)
- Tiket pesawat per pax (IDR)
- Margin per pax (IDR)

### 4. Quotation Calculation
Logic perhitungan mengikuti standar:
```
totalHotelSAR = jumlahKamar * malam * pricePerNight * (1 + tax%)
totalVisaSAR = jumlahJamaah * visaPerPaxSAR
totalSAR = totalHotelSAR + totalVisaSAR + transportTotalSAR
totalSARinIDR = totalSAR * kurs
totalTiketIDR = jumlahJamaah * tiketPerPaxIDR
totalCostIDR = totalSARinIDR + totalTiketIDR
costPerPaxIDR = totalCostIDR / jumlahJamaah
hargaJualPerPax = costPerPaxIDR + marginPerPaxIDR
```

Quotation dihitung oleh `POST /api/quotation`; hasilnya bisa disimpan, dibuka kembali, atau dihapus dari localStorage browser.

### 6. Validasi
- Pax > 0
- Check-out > Check-in
- Kurs > 0
- Input numerik tidak negatif
- Filter kota: Makkah hanya tampil hotel Makkah

## API Endpoints

### POST /api/hotels
Kirim seluruh parameter pencarian sebagai JSON agar address bar tetap bersih:
```json
{
  "city": "Makkah",
  "roomType": "Double",
  "checkIn": "2026-09-28",
  "checkOut": "2026-09-30",
  "pax": 1
}
```

Respons sukses:
```json
{
  "data": [
    { "id": "1", "name": "Fairmont Makkah", "city": "Makkah", "pricePerNight": 1500, "taxPercentage": 0 }
  ]
}
```

`GET /api/hotels?city=Makkah` masih tersedia untuk kompatibilitas.

### POST /api/quotation
Menerima detail hotel dan biaya quotation dalam JSON. API memvalidasi input, membaca ulang harga hotel berdasarkan ID, menghitung total, lalu mengembalikan breakdown pada properti `data`.

### GET /api/exchange-rate
Response:
```json
{
  "rate": 4200.50,
  "timestamp": "2026-09-27T10:30:00.000Z",
  "source": "open.er-api.com"
}
```

### 5. Error handling saat Mock API gagal

Route `POST /api/hotels` menangani kegagalan Mock API tanpa membuat halaman blank atau crash. Frontend mempertahankan parameter pencarian, menampilkan pesan error yang dapat diakses, dan menyediakan tombol `Coba lagi` untuk mengulangi request terakhir. Respons sukses tanpa hotel tetap ditampilkan sebagai empty state, bukan error server.

Untuk menguji kondisi ini secara lokal, atur environment variable berikut. Keduanya hanya aktif ketika `NODE_ENV` bukan production:

- `MOCK_HOTELS_DELAY_MS`: menunda respons selama nilai dalam milidetik, maksimal 10 detik. Gunakan untuk memeriksa loading state dan tombol pencarian yang nonaktif selama request.
- `MOCK_HOTELS_FAIL=true`: mengembalikan HTTP 503 dengan pesan simulasi kegagalan. Gunakan untuk memeriksa alert error dan aksi retry.

PowerShell contoh:
```powershell
$env:MOCK_HOTELS_DELAY_MS = '1500'
$env:MOCK_HOTELS_FAIL = 'true'
npm run dev
```

Hapus atau ubah variable tersebut lalu restart dev server untuk kembali ke respons normal. Pada Vercel, simulasi ini otomatis tidak aktif karena deployment berjalan dalam mode production.

## 7. Deployment (Vercel)

Live demo: https://hotel-brown-eight.vercel.app/

1. Push ke GitHub
2. Import project di Vercel
3. Deploy otomatis

## 8. Technical Interview Ready

Kode siap untuk perubahan:
1. **Tambah tipe kamar "Quint"** - Tambah entry di `ROOM_CAPACITY` map
2. **Tax hotel 15%** - Ubah field `Tax Hotel (%)` pada form quotation; server memvalidasi nilai 0–100 dan memasukkannya ke total hotel sebelum konversi kurs
3. **Supplier kedua** - Abstraksi `HotelProvider` interface

## 9. Testing

Unit test cases untuk validasi:
- 8 pax Quad → 2 kamar
- 9 pax Quad → 3 kamar
- 5 pax Double → 3 kamar
- Contoh soal: Fairmont Makkah, 8 pax Quad, 4 malam → Rp24.125.000/pax