'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Hotel } from '@/types/hotel';
import { ExchangeRateResponse, QuotationInput } from '@/types/quotation';
import { formatCurrencyDraft, formatNumberInput, parseCurrencyInput } from '@/lib/currencyInput';

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
}

export default function QuotationForm({ hotel, searchParams, onCalculate, onBack }: QuotationFormProps) {
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

  useEffect(() => {
    loadExchangeRate();
  }, []);

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
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold text-brand-primary-dark">KONVERSI</p>
            <label htmlFor="exchangeRate" className="mt-2 block text-base font-semibold text-brand-dark">
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
        </div>

        <div className="border-t border-brand-dark/15 pt-6">
          <h3 className="font-sans text-xl font-semibold text-brand-dark">Rincian biaya</h3>
          <p className="mt-1 text-sm text-brand-muted">Tax hotel dapat disesuaikan untuk kebutuhan quotation ini.</p>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
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

        <div className="flex flex-col-reverse gap-3 border-t border-brand-dark/15 pt-6 sm:flex-row sm:justify-end">
          <button
            type="submit"
            className="button-primary"
            disabled={isCalculating}
          >
            {isCalculating ? 'Menghitung...' : 'HITUNG QUOTATION'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="button-secondary"
          >
            BATAL
          </button>
        </div>
        {calculationError && (
          <p className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {calculationError}
          </p>
        )}
      </form>
    </div>
  );
}