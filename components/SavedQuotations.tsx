'use client';

import { SavedQuotation } from '@/types/quotation';
import { formatCurrency } from '@/lib/quotationCalculator';

interface SavedQuotationsProps {
  quotations: SavedQuotation[];
  onOpen: (quotation: SavedQuotation) => void;
  onDelete: (id: string) => void;
}

export default function SavedQuotations({ quotations, onOpen, onDelete }: SavedQuotationsProps) {
  return (
    <section className="border-y border-brand-border bg-white px-5 py-5 sm:px-7" aria-labelledby="saved-quotations-heading">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-brand-primary-dark">ARSIP LOKAL</p>
          <h2 id="saved-quotations-heading" className="mt-1 font-sans text-xl font-semibold text-brand-dark">Quotation tersimpan</h2>
        </div>
        <p className="text-sm text-brand-muted">{quotations.length}</p>
      </header>

      {quotations.length === 0 ? (
        <p className="mt-4 border-t border-brand-border pt-4 text-sm text-brand-muted">
          Quotation yang disimpan akan muncul di sini.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-brand-border border-t border-brand-border">
          {quotations.map((quotation) => (
            <li key={quotation.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold text-brand-dark">{quotation.data.hotelName} · {quotation.data.city}</p>
                <p className="mt-1 text-sm text-brand-muted">
                  {quotation.data.checkIn} – {quotation.data.checkOut} · {quotation.data.pax} jamaah
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-secondary">
                  {formatCurrency(quotation.data.hargaJualPerPax, 'IDR')} / jamaah
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="button-secondary" onClick={() => onOpen(quotation)}>
                  Buka
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => onDelete(quotation.id)}
                  aria-label={`Hapus quotation ${quotation.data.hotelName}`}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}