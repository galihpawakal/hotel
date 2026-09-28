'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchForm from '@/components/SearchForm';
import HotelCard from '@/components/HotelCard';
import QuotationForm from '@/components/QuotationForm';
import QuotationSummary from '@/components/QuotationSummary';
import SavedQuotations from '@/components/SavedQuotations';
import { Hotel } from '@/types/hotel';
import { HotelSearchParams } from '@/types/hotel';
import { QuotationBreakdown, QuotationInput, SavedQuotation } from '@/types/quotation';

const SAVED_QUOTATIONS_KEY = 'syafar-tour-saved-quotations';

function isSavedQuotation(value: unknown): value is SavedQuotation {
  if (!value || typeof value !== 'object') return false;
  const quotation = value as SavedQuotation;
  return typeof quotation.id === 'string' &&
    typeof quotation.savedAt === 'string' &&
    typeof quotation.data?.hotelId === 'string' &&
    typeof quotation.data?.hotelName === 'string' &&
    typeof quotation.data?.hargaJualPerPax === 'number';
}

export default function SearchPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<HotelSearchParams | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<HotelSearchParams | null>(null);
  const [initialFormErrors, setInitialFormErrors] = useState<Record<string, string> | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelNameFilter, setHotelNameFilter] = useState('');
  const [minimumHotelPrice, setMinimumHotelPrice] = useState('');
  const [maximumHotelPrice, setMaximumHotelPrice] = useState('');
  const [sortOrder, setSortOrder] = useState<'price-asc' | 'price-desc'>('price-asc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValidationErrors, setSearchValidationErrors] = useState<Record<string, string>>({});
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showQuotation, setShowQuotation] = useState(false);
  const [quotationResult, setQuotationResult] = useState<QuotationBreakdown | null>(null);
  const [savedQuotations, setSavedQuotations] = useState<SavedQuotation[]>([]);
  const [activeSavedQuotationId, setActiveSavedQuotationId] = useState<string | null>(null);
  const [savedQuotationsLoaded, setSavedQuotationsLoaded] = useState(false);
  const [savedQuotationsError, setSavedQuotationsError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_QUOTATIONS_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setSavedQuotations(parsed.filter(isSavedQuotation));
      }
    } catch {
      setSavedQuotationsError('Quotation tersimpan tidak dapat dibaca dari browser ini.');
    } finally {
      setSavedQuotationsLoaded(true);
    }
  }, []);

  const persistSavedQuotations = (quotations: SavedQuotation[]) => {
    try {
      window.localStorage.setItem(SAVED_QUOTATIONS_KEY, JSON.stringify(quotations));
      setSavedQuotations(quotations);
      setSavedQuotationsError(null);
      return true;
    } catch {
      setSavedQuotationsError('Quotation tidak dapat disimpan. Periksa ruang penyimpanan browser.');
      return false;
    }
  };

  const handleSearch = useCallback(async (params: HotelSearchParams) => {
    setSearchParams(params);
    setIsLoading(true);
    setError(null);
    setSearchValidationErrors({});
    setHotels([]);
    setHotelNameFilter('');
    setMinimumHotelPrice('');
    setMaximumHotelPrice('');
    setSortOrder('price-asc');
    setSelectedHotel(null);
    setShowQuotation(false);
    setQuotationResult(null);
    setActiveSavedQuotationId(null);

    try {
      const response = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const payload = await response.json();

      if (response.status === 400 && payload.errors) {
        const apiErrors = payload.errors as Record<string, string>;
        setSearchValidationErrors(apiErrors);
        return apiErrors;
      }
      if (!response.ok) {
        throw new Error(payload.error || 'Gagal mengambil data hotel');
      }
      if (!Array.isArray(payload.data)) {
        throw new Error('Format data hotel tidak valid');
      }

      setHotels(payload.data as Hotel[]);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Gagal memuat data hotel. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (!query.size) return;
    router.replace(window.location.pathname, { scroll: false });

    const params: HotelSearchParams = {
      city: (query.get('city') || '') as HotelSearchParams['city'],
      roomType: (query.get('roomType') || '') as HotelSearchParams['roomType'],
      checkIn: query.get('checkIn') || '',
      checkOut: query.get('checkOut') || '',
      pax: Number(query.get('pax')),
    };
    setInitialFormValues(params);
    void handleSearch(params).then((apiErrors) => {
      if (apiErrors) setInitialFormErrors(apiErrors);
    });
  }, [handleSearch, router]);

  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setQuotationResult(null);
    setActiveSavedQuotationId(null);
    setShowQuotation(true);
  };

  const parsedMinimumPrice = minimumHotelPrice === '' ? null : Number(minimumHotelPrice);
  const parsedMaximumPrice = maximumHotelPrice === '' ? null : Number(maximumHotelPrice);
  const invalidPriceRange = parsedMinimumPrice !== null && parsedMaximumPrice !== null && parsedMinimumPrice > parsedMaximumPrice;
  const visibleHotels = hotels
    .filter((hotel) => hotel.name.toLocaleLowerCase('id-ID').includes(hotelNameFilter.trim().toLocaleLowerCase('id-ID')))
    .filter((hotel) => parsedMinimumPrice === null || hotel.pricePerNight >= parsedMinimumPrice)
    .filter((hotel) => parsedMaximumPrice === null || hotel.pricePerNight <= parsedMaximumPrice)
    .sort((first, second) => sortOrder === 'price-asc'
      ? first.pricePerNight - second.pricePerNight
      : second.pricePerNight - first.pricePerNight);

  const handleCalculate = async (input: QuotationInput) => {
    const response = await fetch('/api/quotation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await response.json();

    if (response.status === 400 && payload.errors) {
      return { errors: payload.errors as Record<string, string> };
    }
    if (!response.ok) {
      return { error: payload.error || 'Gagal menghitung quotation.' };
    }
    if (!payload.data) {
      return { error: 'Respons quotation dari server tidak valid.' };
    }

    setQuotationResult(payload.data as QuotationBreakdown);
    setActiveSavedQuotationId(null);
    return {};
  };

  const handleToggleSavedQuotation = () => {
    if (!quotationResult) return;
    if (activeSavedQuotationId) {
      const nextQuotations = savedQuotations.filter((quotation) => quotation.id !== activeSavedQuotationId);
      if (persistSavedQuotations(nextQuotations)) setActiveSavedQuotationId(null);
      return;
    }

    const id = globalThis.crypto?.randomUUID?.() ?? `quotation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextQuotations = [
      { id, savedAt: new Date().toISOString(), data: quotationResult },
      ...savedQuotations,
    ];
    if (persistSavedQuotations(nextQuotations)) setActiveSavedQuotationId(id);
  };

  const handleOpenSavedQuotation = (quotation: SavedQuotation) => {
    setSelectedHotel(null);
    setSearchParams({
      city: quotation.data.city as HotelSearchParams['city'],
      roomType: quotation.data.roomType as HotelSearchParams['roomType'],
      checkIn: quotation.data.checkIn,
      checkOut: quotation.data.checkOut,
      pax: quotation.data.pax,
    });
    setQuotationResult(quotation.data);
    setActiveSavedQuotationId(quotation.id);
    setShowQuotation(true);
  };

  const handleDeleteSavedQuotation = (id: string) => {
    if (persistSavedQuotations(savedQuotations.filter((quotation) => quotation.id !== id)) && activeSavedQuotationId === id) {
      setActiveSavedQuotationId(null);
    }
  };

  const handleBackToSearch = () => {
    setSelectedHotel(null);
    setShowQuotation(false);
    setQuotationResult(null);
  };

  const handleNewQuotation = () => {
    if (selectedHotel && searchParams) {
      setQuotationResult(null);
      setActiveSavedQuotationId(null);
      setShowQuotation(true);
      return;
    }

    setQuotationResult(null);
    setActiveSavedQuotationId(null);
    setShowQuotation(false);
  };

  if (showQuotation && quotationResult) {
    return (
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <QuotationSummary
            data={quotationResult}
            onNewQuotation={handleNewQuotation}
            isSaved={activeSavedQuotationId !== null}
            onToggleSaved={handleToggleSavedQuotation}
          />
        </div>
      </div>
    );
  }

  if (showQuotation && selectedHotel && searchParams) {
    return (
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <QuotationForm 
            hotel={selectedHotel} 
            searchParams={searchParams} 
            onCalculate={handleCalculate} 
            onBack={handleBackToSearch} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <header className="border-b border-brand-border bg-white text-brand-dark">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold text-brand-primary-dark">SYAFAR TOUR <span aria-hidden="true">/</span> INTERNAL TOOL</p>
            <h1 className="font-sans text-4xl font-semibold leading-tight sm:text-5xl">Hotel Rate Aggregator</h1>
            <p className="mt-2 text-sm text-brand-muted">Pencarian hotel dan penyusunan quotation perjalanan.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <span className="h-2 w-2 rounded-full bg-brand-primary" aria-hidden="true" />
            <span>Mode operasional</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-9 border-y border-brand-border bg-white px-5 py-6 sm:px-7" aria-labelledby="search-heading">
          <div className="mb-6 flex flex-col gap-2 border-b border-brand-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-primary-dark">LANGKAH 01 <span aria-hidden="true">/</span> PENCARIAN</p>
              <h2 id="search-heading" className="mt-1 font-sans text-2xl font-semibold text-brand-dark">Cari hotel</h2>
            </div>
            <p className="text-sm text-brand-muted">Atur kota, tanggal, dan kebutuhan kamar.</p>
          </div>
          <SearchForm
            initialValues={initialFormValues}
            initialErrors={initialFormErrors}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </section>

        {error && (
          <div className="mb-6 flex flex-col gap-3 border-l-4 border-red-700 bg-red-50 px-5 py-4 text-red-900 sm:flex-row sm:items-center sm:justify-between" role="alert" aria-live="assertive">
            <p>{error}</p>
            <button onClick={() => searchParams && handleSearch(searchParams)} className="button-quiet w-fit text-red-900">
              Coba lagi
            </button>
          </div>
        )}

        {savedQuotationsError && (
          <p className="mb-6 border-l-4 border-red-700 bg-red-50 px-5 py-4 text-red-900" role="alert">
            {savedQuotationsError}
          </p>
        )}

        {savedQuotationsLoaded && (
          <div className="mb-9">
            <SavedQuotations
              quotations={savedQuotations}
              onOpen={handleOpenSavedQuotation}
              onDelete={handleDeleteSavedQuotation}
            />
          </div>
        )}

        {searchParams && !isLoading && hotels.length === 0 && !error && Object.keys(searchValidationErrors).length === 0 && (
          <div className="border-y border-brand-border px-5 py-8 text-center text-brand-muted" role="status" aria-live="polite">
            <p className="font-semibold text-brand-dark">Belum ada hotel untuk pencarian ini</p>
            <p className="mt-1 text-sm">Ubah kota atau tanggal, lalu coba cari kembali.</p>
          </div>
        )}

        {hotels.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1 border-b border-brand-border pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-brand-primary-dark">HASIL PENCARIAN</p>
                <h2 className="mt-1 font-sans text-2xl font-semibold text-brand-dark">Hotel di {searchParams?.city}</h2>
              </div>
              <p className="text-sm text-brand-muted" role="status" aria-live="polite">{visibleHotels.length} dari {hotels.length} hotel</p>
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-brand-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="hotelNameFilter" className="form-label">Nama hotel</label>
                <input
                  id="hotelNameFilter"
                  type="search"
                  value={hotelNameFilter}
                  onChange={(event) => setHotelNameFilter(event.target.value)}
                  placeholder="Cari nama hotel"
                  className="form-control"
                />
              </div>
              <div>
                <label htmlFor="minimumHotelPrice" className="form-label">Harga minimum (SAR/malam)</label>
                <input
                  id="minimumHotelPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimumHotelPrice}
                  onChange={(event) => setMinimumHotelPrice(event.target.value)}
                  className="form-control"
                  aria-invalid={invalidPriceRange}
                  aria-describedby={invalidPriceRange ? 'hotel-price-error' : undefined}
                />
              </div>
              <div>
                <label htmlFor="maximumHotelPrice" className="form-label">Harga maksimum (SAR/malam)</label>
                <input
                  id="maximumHotelPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={maximumHotelPrice}
                  onChange={(event) => setMaximumHotelPrice(event.target.value)}
                  className="form-control"
                  aria-invalid={invalidPriceRange}
                  aria-describedby={invalidPriceRange ? 'hotel-price-error' : undefined}
                />
              </div>
              <div>
                <label htmlFor="hotelSortOrder" className="form-label">Urutkan harga</label>
                <select
                  id="hotelSortOrder"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as 'price-asc' | 'price-desc')}
                  className="form-control"
                >
                  <option value="price-asc">Termurah lebih dulu</option>
                  <option value="price-desc">Termahal lebih dulu</option>
                </select>
              </div>
              {invalidPriceRange && (
                <p id="hotel-price-error" className="form-error sm:col-span-2 lg:col-span-4" role="alert">
                  Harga minimum harus kurang dari atau sama dengan harga maksimum.
                </p>
              )}
              <div className="flex items-end sm:col-span-2 lg:col-span-4">
                <button
                  type="button"
                  className="button-quiet"
                  onClick={() => {
                    setHotelNameFilter('');
                    setMinimumHotelPrice('');
                    setMaximumHotelPrice('');
                    setSortOrder('price-asc');
                  }}
                >
                  Reset filter
                </button>
              </div>
            </div>
            {visibleHotels.length > 0 ? (
              <div className="space-y-3">
                {visibleHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  searchParams={searchParams!}
                  onSelect={handleHotelSelect}
                />
                ))}
              </div>
            ) : !invalidPriceRange ? (
              <div className="border-y border-brand-border px-5 py-7 text-center text-brand-muted" role="status">
                <p className="font-semibold text-brand-dark">Tidak ada hotel yang cocok</p>
                <p className="mt-1 text-sm">Ubah nama atau rentang harga filter.</p>
              </div>
            ) : null}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-3 border-y border-brand-border py-6 text-brand-secondary" role="status" aria-live="polite">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-primary-dark border-t-transparent" aria-hidden="true" />
            <p className="font-medium">Mencari hotel...</p>
          </div>
        )}
      </main>
    </div>
  );
}