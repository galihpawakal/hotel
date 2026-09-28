'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { HotelSearchParams } from '@/types/hotel';
import { addDaysToISODate, getTodayDateInJakarta } from '@/lib/dateUtils';

interface SearchFormProps {
  initialValues?: HotelSearchParams | null;
  initialErrors?: Record<string, string> | null;
  onSearch: (params: HotelSearchParams) => Promise<Record<string, string> | null>;
  isLoading?: boolean;
}

export default function SearchForm({ initialValues, initialErrors, onSearch, isLoading = false }: SearchFormProps) {
  const [formData, setFormData] = useState<HotelSearchParams>({
    city: 'Makkah',
    checkIn: '',
    checkOut: '',
    pax: 1,
    roomType: 'Double',
  });
  const [paxValue, setPaxValue] = useState('1');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
      setPaxValue(String(initialValues.pax));
    }
  }, [initialValues]);

  useEffect(() => {
    if (initialErrors) setErrors(initialErrors);
  }, [initialErrors]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'pax') {
      const digits = value.replace(/\D/g, '');
      const normalized = digits.replace(/^0+(?=\d)/, '');
      setPaxValue(normalized);
      setFormData((prev) => ({ ...prev, pax: normalized ? Number(normalized) : 0 }));
      if (errors.pax) setErrors((prev) => ({ ...prev, pax: '' }));
      return;
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'checkIn' && next.checkOut && next.checkOut <= value) {
        next.checkOut = '';
      }
      return next;
    });
    if (errors[name] || (name === 'checkIn' && errors.checkOut)) {
      setErrors((prev) => ({ ...prev, [name]: '', ...(name === 'checkIn' ? { checkOut: '' } : {}) }));
    }
  };

  const today = getTodayDateInJakarta();
  const minCheckOut = formData.checkIn >= today
    ? addDaysToISODate(formData.checkIn, 1)
    : addDaysToISODate(today, 1);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    const apiErrors = await onSearch(formData);
    if (apiErrors) setErrors(apiErrors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="form-label">
            Kota <span className="text-brand-primary-dark">*</span>
          </label>
          <select
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="form-control"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? 'city-error' : undefined}
          >
            <option value="Makkah">Makkah</option>
            <option value="Madinah">Madinah</option>
          </select>
          {errors.city && <p id="city-error" className="form-error">{errors.city}</p>}
        </div>

        <div>
          <label htmlFor="roomType" className="form-label">
            Tipe Kamar <span className="text-brand-primary-dark">*</span>
          </label>
          <select
            id="roomType"
            name="roomType"
            value={formData.roomType}
            onChange={handleChange}
            className="form-control"
            aria-invalid={Boolean(errors.roomType)}
            aria-describedby={errors.roomType ? 'roomType-error' : undefined}
          >
            <option value="Double">Double (2 orang)</option>
            <option value="Triple">Triple (3 orang)</option>
            <option value="Quad">Quad (4 orang)</option>
            <option value="Quint">Quint (5 orang)</option>
          </select>
          {errors.roomType && <p id="roomType-error" className="form-error">{errors.roomType}</p>}
        </div>

        <div>
          <label htmlFor="checkIn" className="form-label">
            Check-in <span className="text-brand-primary-dark">*</span>
          </label>
          <input
            type="date"
            id="checkIn"
            name="checkIn"
            value={formData.checkIn}
            onChange={handleChange}
            min={today}
            className="form-control"
            aria-invalid={Boolean(errors.checkIn)}
            aria-describedby={errors.checkIn ? 'checkIn-error' : undefined}
          />
          {errors.checkIn && <p id="checkIn-error" className="form-error">{errors.checkIn}</p>}
        </div>

        <div>
          <label htmlFor="checkOut" className="form-label">
            Check-out <span className="text-brand-primary-dark">*</span>
          </label>
          <input
            type="date"
            id="checkOut"
            name="checkOut"
            value={formData.checkOut}
            onChange={handleChange}
            min={minCheckOut}
            className="form-control"
            aria-invalid={Boolean(errors.checkOut)}
            aria-describedby={errors.checkOut ? 'checkOut-error' : undefined}
          />
          {errors.checkOut && <p id="checkOut-error" className="form-error">{errors.checkOut}</p>}
        </div>

        <div>
          <label htmlFor="pax" className="form-label">
            Jumlah Jamaah <span className="text-brand-primary-dark">*</span>
          </label>
          <input
            type="number"
            id="pax"
            name="pax"
            value={paxValue}
            onChange={handleChange}
            min="1"
            className="form-control"
            aria-invalid={Boolean(errors.pax)}
            aria-describedby={errors.pax ? 'pax-error' : undefined}
          />
          {errors.pax && <p id="pax-error" className="form-error">{errors.pax}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="button-primary w-full sm:w-auto"
      >
        {isLoading ? 'Mencari...' : 'CARI HOTEL'}
      </button>
    </form>
  );
}