'use client';

import { QuotationBreakdown } from '@/types/quotation';
import { formatCurrency } from '@/lib/quotationCalculator';

interface QuotationSummaryProps {
  data: QuotationBreakdown;
  onNewQuotation: () => void;
  isSaved: boolean;
  onToggleSaved: () => void;
}

export default function QuotationSummary({ data, onNewQuotation, isSaved, onToggleSaved }: QuotationSummaryProps) {
  const costItems = [
    { label: 'Hotel', detail: `${data.rooms} kamar · ${data.nights} malam`, amount: data.totalHotelIDR },
    { label: 'Visa', detail: `${data.pax} jamaah`, amount: data.totalVisaIDR },
    { label: 'Transport', detail: 'Total perjalanan', amount: data.transportTotalIDR },
    { label: 'Tiket pesawat', detail: `${data.pax} jamaah`, amount: data.totalTicketIDR },
  ];

  return (
    <main className="space-y-8 text-brand-dark">
      <header className="flex flex-col gap-5 border-b border-brand-dark/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-brand-primary-dark">SYAFAR TOUR <span aria-hidden="true">/</span> HASIL PERHITUNGAN</p>
          <h2 className="font-sans text-3xl font-semibold leading-tight">Quotation siap ditinjau</h2>
          <p className="mt-1 text-sm text-brand-muted">Rincian biaya dan harga jual per jamaah</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={onToggleSaved} className="button-secondary w-fit">
            {isSaved ? 'Hapus dari tersimpan' : 'Simpan quotation'}
          </button>
          <button onClick={onNewQuotation} className="button-secondary w-fit">
            Buat quotation baru
          </button>
        </div>
      </header>

      <section className="border-b-4 border-brand-primary bg-brand-secondary px-5 py-7 text-white sm:px-8" aria-label="Harga jual per jamaah">
        <p className="text-sm font-semibold text-brand-primary">HARGA JUAL / JAMAAH</p>
        <p className="mt-2 break-words text-3xl font-semibold leading-tight sm:text-4xl">
          {formatCurrency(data.hargaJualPerPax, 'IDR')}
        </p>
        <p className="mt-2 text-sm text-white/80">Seluruh komponen biaya telah dikonversi ke IDR.</p>
      </section>

      <section className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-brand-dark/15 py-5 sm:grid-cols-4" aria-label="Informasi perjalanan">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-brand-muted">HOTEL</p>
          <p className="mt-1 font-semibold">{data.hotelName}</p>
          <p className="text-sm text-brand-muted">{data.city}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-muted">TANGGAL</p>
          <p className="mt-1 font-semibold">{data.checkIn} – {data.checkOut}</p>
          <p className="text-sm text-brand-muted">{data.nights} malam</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-muted">JAMAAH & KAMAR</p>
          <p className="mt-1 font-semibold">{data.pax} jamaah</p>
          <p className="text-sm text-brand-muted">{data.rooms} kamar · {data.roomType}</p>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <section aria-labelledby="cost-heading">
          <div className="border-b border-brand-dark/15 pb-4">
            <h3 id="cost-heading" className="font-sans text-xl font-semibold">Komponen biaya</h3>
            <p className="mt-1 text-sm text-brand-muted">Semua nominal pada rincian ini dalam IDR.</p>
          </div>
          <div className="divide-y divide-brand-dark/10">
            {costItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-0.5 text-sm text-brand-muted">{item.detail}</p>
                </div>
                <p className="shrink-0 text-right font-semibold">{formatCurrency(item.amount, 'IDR')}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 border-t-2 border-brand-dark py-4">
            <p className="font-semibold">Total biaya paket</p>
            <p className="shrink-0 text-right font-semibold">{formatCurrency(data.totalCostIDR, 'IDR')}</p>
          </div>
        </section>

        <aside className="self-start border-t-2 border-brand-primary bg-brand-tint p-5 sm:p-6" aria-label="Ringkasan harga">
          <h3 className="font-sans text-xl font-semibold">Ringkasan harga</h3>
          <dl className="mt-4 divide-y divide-brand-dark/15 text-sm">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-brand-muted">Biaya per jamaah</dt>
              <dd className="text-right font-semibold">{formatCurrency(data.costPerPaxIDR, 'IDR')}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-brand-muted">Margin per jamaah</dt>
              <dd className="text-right font-semibold">{formatCurrency(data.marginPerPaxIDR, 'IDR')}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-brand-muted">Kurs konversi</dt>
              <dd className="text-right font-semibold">1 SAR = {formatCurrency(data.exchangeRate, 'IDR')}</dd>
            </div>
          </dl>
          <div className="mt-3 border-t border-brand-dark/20 pt-4">
            <p className="text-xs font-semibold text-brand-muted">HARGA JUAL / JAMAAH</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(data.hargaJualPerPax, 'IDR')}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}