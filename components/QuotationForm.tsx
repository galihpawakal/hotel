'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Hotel } from '@/types/hotel';
import { ExchangeRateResponse, QuotationBreakdown, QuotationInput } from '@/types/quotation';
import { formatCurrencyDraft, formatNumberInput, parseCurrencyInput } from '@/lib/currencyInput';
import { formatCurrency } from '@/lib/quotationCalculator';

type QuotationValues = Omit<QuotationInput, 'hotel' | 'pax' | 'roomType' | 'checkIn' | 'checkOut'>;
type QuotationAmountField = keyof QuotationValues;

interface QuotationApiResponse {
  errors?: Record<string, string>;
  error?: string;
}

interface QuotationFormProps {
  hotel: Hotel;
  searchParams: {
    pax: number;
    roomType: 'Double' | 'Triple' | 'Quad' | 'Quint';
    checkIn: string;
    checkOut: string;
  };
  onCalculate: (input: QuotationInput) => Promise<QuotationApiResponse>;
  onBack: () => void;
  quotationResult: QuotationBreakdown | null;
  isSaved: boolean;
  onToggleSaved: () => void;
}

export default function QuotationForm({
  hotel,
  searchParams,
  onCalculate,
  onBack,
  quotationResult,
  isSaved,
  onToggleSaved,
}: QuotationFormProps) {
  const [formData, setFormData] = useState<QuotationValues>({
    hotelTaxPercentage: hotel.taxPercentage || 0,
    exchangeRate: 0,
    visaPerPaxSAR: 0,
    transportTotalSAR: 0,
    ticketPerPaxIDR: 0,
    marginPerPaxIDR: 0,
  });
  const [displayValues, setDisplayValues] = useState<Record<QuotationAmountField, string>>({
    hotelTaxPercentage: formatNumberInput(hotel.taxPercentage || 0, true),
    exchangeRate: '',
    visaPerPaxSAR: '',
    transportTotalSAR: '',
    ticketPerPaxIDR: '',
    marginPerPaxIDR: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateSource, setRateSource] = useState<string>('');
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    loadExchangeRate();
  }, []);

  useEffect(() => {
    if (!quotationResult) return;
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [quotationResult]);

  const loadExchangeRate = async () => {
    setIsLoadingRate(true);
    setRateError(null);
    try {
      const response = await fetch('/api/exchange-rate');
      if (!response.ok) throw new Error('Gagal mengambil kurs');
      const data: ExchangeRateResponse = await response.json();
      const roundedRate = Math.round(data.rate * 100) / 100;
      setFormData((prev) => ({ ...prev, exchangeRate: roundedRate }));
      setDisplayValues((prev) => ({ ...prev, exchangeRate: formatNumberInput(roundedRate, true) }));
      setRateSource(`Live kurs dari ${data.source} (${new Date(data.timestamp).toLocaleString('id-ID')})`);
    } catch {
      setRateError('Gagal ambil kurs otomatis, silakan isi manual');
    } finally {
      setIsLoadingRate(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as QuotationAmountField;
    const supportsDecimals = fieldName !== 'ticketPerPaxIDR' && fieldName !== 'marginPerPaxIDR';
    const displayValue = formatCurrencyDraft(value, supportsDecimals);
    const numericValue = parseCurrencyInput(displayValue);
    setDisplayValues((prev) => ({ ...prev, [fieldName]: displayValue }));
    setFormData((prev) => ({ ...prev, [fieldName]: numericValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const input: QuotationInput = {
      hotel,
      pax: searchParams.pax,
      roomType: searchParams.roomType,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      ...formData,
    };
    setErrors({});
    setCalculationError(null);
    setIsCalculating(true);
    try {
      const response = await onCalculate(input);
      if (response.errors) setErrors(response.errors);
      if (response.error) setCalculationError(response.error);
    } catch {
      setCalculationError('Gagal menghubungi API quotation. Silakan coba lagi.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-8 text-brand-dark">
      <div className="flex flex-col gap-5 border-b border-brand-dark/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-brand-primary-dark">SYAFAR TOUR <span aria-hidden="true">/</span> PENAWARAN BARU</p>
          <h2 className="font-sans text-3xl font-semibold leading-tight text-brand-dark">Quotation hotel</h2>
          <p className="mt-1 text-sm text-brand-muted">{hotel.name}</p>
        </div>
        <button
          onClick={onBack}
          className="button-quiet w-fit"
        >
          <span aria-hidden="true">←</span> Kembali ke pencarian
        </button>
      </div>

      <section className="border-l-2 border-brand-primary bg-brand-tint px-5 py-4" aria-label="Informasi hotel">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
          <div><p className="text-brand-muted">Hotel</p><p className="mt-1 font-semibold">{hotel.name}</p></div>
          <div><p className="text-brand-muted">Kota</p><p className="mt-1 font-semibold">{hotel.city}</p></div>
          <div><p className="text-brand-muted">Tipe kamar</p><p className="mt-1 font-semibold">{searchParams.roomType}</p></div>
          <div><p className="text-brand-muted">Jamaah</p><p className="mt-1 font-semibold">{searchParams.pax} orang</p></div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-8 border-t border-brand-dark/15 pt-7">
        <div className="sticky top-0 z-30 -mx-4 border-b border-brand-dark/15 bg-brand-light/95 px-4 py-3 shadow-[0_4px_12px_rgba(39,39,39,0.08)] backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onBack}
              className="button-secondary w-full sm:w-auto"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="button-primary w-full flex-1"
              disabled={isCalculating}
            >
              {isCalculating ? 'Menghitung...' : 'HITUNG QUOTATION'}
            </button>
          </div>
        </div>

        {quotationResult && (
          <section ref={resultRef} className="scroll-mt-28 border-y border-brand-border bg-white" aria-labelledby="quotation-result-heading" aria-live="polite">
            <div className="border-b-4 border-brand-primary bg-brand-secondary px-5 py-6 text-white sm:px-7">
              <p className="text-xs font-semibold tracking-wide text-brand-primary">HASIL QUOTATION</p>
              <h3 id="quotation-result-heading" className="mt-1 text-xl font-semibold">Harga jual per jamaah</h3>
              <p className="mt-2 break-words text-3xl font-semibold leading-tight sm:text-4xl">
                {formatCurrency(quotationResult.hargaJualPerPax, 'IDR')}
              </p>
              <p className="mt-2 text-sm text-white/80">Hasil terbaru dari nilai input yang dikirim.</p>
            </div>
            <div className="grid gap-6 px-5 py-5 sm:px-7 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex items-center justify-between gap-4 border-b border-brand-dark/15 pb-3">
                  <h4 className="font-semibold">Rincian biaya</h4>
                  <p className="text-sm text-brand-muted">1 SAR = {formatCurrency(quotationResult.exchangeRate, 'IDR')}</p>
                </div>
                <dl className="divide-y divide-brand-dark/10 text-sm">
                  <div className="flex justify-between gap-4 py-3"><dt className="text-brand-muted">Hotel ({quotationResult.rooms} kamar, {quotationResult.nights} malam)</dt><dd className="font-semibold">{formatCurrency(quotationResult.totalHotelIDR, 'IDR')}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-brand-muted">Visa ({quotationResult.pax} jamaah)</dt><dd className="font-semibold">{formatCurrency(quotationResult.totalVisaIDR, 'IDR')}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-brand-muted">Transport</dt><dd className="font-semibold">{formatCurrency(quotationResult.transportTotalIDR, 'IDR')}</dd></div>
                  <div className="flex justify-between gap-4 border-t-2 border-brand-dark py-3"><dt className="font-semibold">Total biaya paket</dt><dd className="font-semibold">{formatCurrency(quotationResult.totalCostIDR, 'IDR')}</dd></div>
                </dl>
              </div>
              <aside className="self-start border-t-2 border-brand-primary bg-brand-tint p-5" aria-label="Ringkasan quotation">
                <dl className="divide-y divide-brand-dark/15 text-sm">
                  <div className="flex justify-between gap-4 py-3"><dt className="text-brand-muted">Biaya per jamaah</dt><dd className="text-right font-semibold">{formatCurrency(quotationResult.costPerPaxIDR, 'IDR')}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-brand-muted">Margin per jamaah</dt><dd className="text-right font-semibold">{formatCurrency(quotationResult.marginPerPaxIDR, 'IDR')}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-brand-muted">Tax hotel</dt><dd className="text-right font-semibold">{quotationResult.taxPercentage}%</dd></div>
                </dl>
                <button type="button" onClick={onToggleSaved} className="button-secondary mt-4 w-full">
                  {isSaved ? 'Hapus dari tersimpan' : 'Simpan quotation'}
                </button>
              </aside>
            </div>
          </section>
        )}

        <section aria-labelledby="exchange-rate-heading" className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold text-brand-primary-dark">KONVERSI</p>
            <label id="exchange-rate-heading" htmlFor="exchangeRate" className="mt-2 block text-base font-semibold text-brand-dark">
              Kurs SAR <span aria-hidden="true">→</span> IDR <span className="text-brand-primary-dark">*</span>
            </label>
            <p className="mt-1 text-sm leading-5 text-brand-muted">Semua biaya pada hasil quotation dihitung dan ditampilkan dalam IDR.</p>
          </div>
          <div>
            <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              id="exchangeRate"
              name="exchangeRate"
              value={displayValues.exchangeRate}
              onChange={handleChange}
              className="form-control text-lg font-semibold"
              aria-invalid={Boolean(errors.exchangeRate)}
              aria-describedby={errors.exchangeRate ? 'exchangeRate-error' : undefined}
              placeholder={isLoadingRate ? 'Memuat kurs...' : 'Masukkan kurs'}
            />
              {isLoadingRate && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">Memuat...</div>}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              {rateSource && !rateError && <p className="text-xs leading-5 text-brand-muted">{rateSource}</p>}
              {rateError && <p className="border-l-2 border-amber-600 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="alert">{rateError}</p>}
              {errors.exchangeRate && <p id="exchangeRate-error" className="form-error">{errors.exchangeRate}</p>}
              <button
                type="button"
                onClick={loadExchangeRate}
                disabled={isLoadingRate}
                className="button-quiet ml-auto disabled:cursor-wait disabled:opacity-50"
              >
                {isLoadingRate ? 'Memuat kurs...' : '↻ Refresh kurs'}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-5" aria-labelledby="sar-cost-heading">
          <div className="border-t border-brand-dark/15 pt-5">
            <h3 id="sar-cost-heading" className="text-xs font-semibold tracking-wide text-brand-primary-dark">BIAYA (SAR)</h3>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <div>
            <label htmlFor="hotelTaxPercentage" className="form-label">
              Tax Hotel (%)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="hotelTaxPercentage"
              name="hotelTaxPercentage"
              value={displayValues.hotelTaxPercentage}
              onChange={handleChange}
              className="form-control"
              aria-invalid={Boolean(errors.hotelTaxPercentage)}
              aria-describedby={errors.hotelTaxPercentage ? 'hotelTaxPercentage-error' : undefined}
            />
            {errors.hotelTaxPercentage && <p id="hotelTaxPercentage-error" className="form-error">{errors.hotelTaxPercentage}</p>}
          </div>

          <div>
            <label htmlFor="visaPerPaxSAR" className="form-label">
              Visa per Pax (SAR)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="visaPerPaxSAR"
              name="visaPerPaxSAR"
              value={displayValues.visaPerPaxSAR}
              onChange={handleChange}
              className="form-control"
              aria-invalid={Boolean(errors.visaPerPaxSAR)}
              aria-describedby={errors.visaPerPaxSAR ? 'visaPerPaxSAR-error' : undefined}
            />
            {errors.visaPerPaxSAR && <p id="visaPerPaxSAR-error" className="form-error">{errors.visaPerPaxSAR}</p>}
          </div>

          <div>
            <label htmlFor="transportTotalSAR" className="form-label">
              Transport Total (SAR)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="transportTotalSAR"
              name="transportTotalSAR"
              value={displayValues.transportTotalSAR}
              onChange={handleChange}
              className="form-control"
              aria-invalid={Boolean(errors.transportTotalSAR)}
              aria-describedby={errors.transportTotalSAR ? 'transportTotalSAR-error' : undefined}
            />
            {errors.transportTotalSAR && <p id="transportTotalSAR-error" className="form-error">{errors.transportTotalSAR}</p>}
          </div>
          </div>
        </section>

        <section className="space-y-5" aria-labelledby="idr-cost-heading">
          <div className="border-t border-brand-dark/15 pt-5">
            <h3 id="idr-cost-heading" className="text-xs font-semibold tracking-wide text-brand-primary-dark">BIAYA (IDR)</h3>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div>
            <label htmlFor="ticketPerPaxIDR" className="form-label">
              Tiket Pesawat per Pax (IDR)
            </label>
            <input
              type="text"
              inputMode="numeric"
              id="ticketPerPaxIDR"
              name="ticketPerPaxIDR"
              value={displayValues.ticketPerPaxIDR}
              onChange={handleChange}
              className="form-control"
              aria-invalid={Boolean(errors.ticketPerPaxIDR)}
              aria-describedby={errors.ticketPerPaxIDR ? 'ticketPerPaxIDR-error' : undefined}
            />
            {errors.ticketPerPaxIDR && <p id="ticketPerPaxIDR-error" className="form-error">{errors.ticketPerPaxIDR}</p>}
          </div>

          <div>
            <label htmlFor="marginPerPaxIDR" className="form-label">
              Margin per Pax (IDR)
            </label>
            <input
              type="text"
              inputMode="numeric"
              id="marginPerPaxIDR"
              name="marginPerPaxIDR"
              value={displayValues.marginPerPaxIDR}
              onChange={handleChange}
              className="form-control"
              aria-invalid={Boolean(errors.marginPerPaxIDR)}
              aria-describedby={errors.marginPerPaxIDR ? 'marginPerPaxIDR-error' : undefined}
            />
            {errors.marginPerPaxIDR && <p id="marginPerPaxIDR-error" className="form-error">{errors.marginPerPaxIDR}</p>}
          </div>
          </div>
        </section>

        {calculationError && (
          <p className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {calculationError}
          </p>
        )}
      </form>
    </div>
  );
}