import { HotelSearchParams } from '@/types/hotel';
import { QuotationInput } from '@/types/quotation';
import { getTodayDateInJakarta, isValidISODate } from './dateUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateSearchParams(params: HotelSearchParams): ValidationResult {
  const errors: Record<string, string> = {};

  if (!params.city || (params.city !== 'Makkah' && params.city !== 'Madinah')) {
    errors.city = 'Kota harus dipilih (Makkah atau Madinah)';
  }

  if (!params.checkIn) {
    errors.checkIn = 'Tanggal check-in wajib diisi';
  }

  if (!params.checkOut) {
    errors.checkOut = 'Tanggal check-out wajib diisi';
  }

  const validCheckIn = isValidISODate(params.checkIn);
  const validCheckOut = isValidISODate(params.checkOut);

  if (params.checkIn && !validCheckIn) {
    errors.checkIn = 'Format tanggal check-in tidak valid';
  }

  if (params.checkOut && !validCheckOut) {
    errors.checkOut = 'Format tanggal check-out tidak valid';
  }

  const today = getTodayDateInJakarta();
  if (validCheckIn && params.checkIn < today) {
    errors.checkIn = 'Tanggal check-in yang sudah lewat tidak dapat dipilih';
  }
  if (validCheckOut && params.checkOut < today) {
    errors.checkOut = 'Tanggal check-out yang sudah lewat tidak dapat dipilih';
  }
  if (validCheckIn && validCheckOut && params.checkOut <= params.checkIn) {
    errors.checkOut = 'Check-out harus setelah check-in';
  }

  if (!Number.isInteger(params.pax) || params.pax <= 0) {
    errors.pax = 'Jumlah jamaah harus berupa bilangan bulat lebih dari 0';
  }

  if (!params.roomType || !['Double', 'Triple', 'Quad', 'Quint'].includes(params.roomType)) {
    errors.roomType = 'Tipe kamar tidak valid';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateQuotationInput(input: QuotationInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (
    !input.hotel ||
    typeof input.hotel.name !== 'string' ||
    typeof input.hotel.city !== 'string' ||
    !Number.isFinite(input.hotel.pricePerNight) ||
    input.hotel.pricePerNight < 0
  ) {
    errors.hotel = 'Hotel harus dipilih';
  }

  if (!Number.isInteger(input.pax) || input.pax <= 0) {
    errors.pax = 'Jumlah jamaah harus lebih dari 0';
  }

  if (!Number.isFinite(input.exchangeRate) || input.exchangeRate <= 0) {
    errors.exchangeRate = 'Kurs SAR ke IDR harus diisi dan lebih dari 0';
  }

  if (!Number.isFinite(input.hotelTaxPercentage) || input.hotelTaxPercentage < 0 || input.hotelTaxPercentage > 100) {
    errors.hotelTaxPercentage = 'Tax hotel harus berupa persentase antara 0 dan 100';
  }

  if (!Number.isFinite(input.visaPerPaxSAR) || input.visaPerPaxSAR < 0) {
    errors.visaPerPaxSAR = 'Visa per pax tidak boleh negatif';
  }

  if (!Number.isFinite(input.transportTotalSAR) || input.transportTotalSAR < 0) {
    errors.transportTotalSAR = 'Transport total tidak boleh negatif';
  }

  if (!Number.isFinite(input.ticketPerPaxIDR) || input.ticketPerPaxIDR < 0) {
    errors.ticketPerPaxIDR = 'Tiket per pax tidak boleh negatif';
  }

  if (!Number.isFinite(input.marginPerPaxIDR) || input.marginPerPaxIDR < 0) {
    errors.marginPerPaxIDR = 'Margin per pax tidak boleh negatif';
  }

  if (!['Double', 'Triple', 'Quad', 'Quint'].includes(input.roomType)) {
    errors.roomType = 'Tipe kamar tidak valid';
  }

  const validCheckIn = isValidISODate(input.checkIn);
  const validCheckOut = isValidISODate(input.checkOut);
  const today = getTodayDateInJakarta();

  if (!validCheckIn) {
    errors.checkIn = 'Tanggal check-in tidak valid';
  } else if (input.checkIn < today) {
    errors.checkIn = 'Tanggal check-in yang sudah lewat tidak dapat dipilih';
  }

  if (!validCheckOut) {
    errors.checkOut = 'Tanggal check-out tidak valid';
  } else if (input.checkOut < today) {
    errors.checkOut = 'Tanggal check-out yang sudah lewat tidak dapat dipilih';
  } else if (validCheckIn && input.checkOut <= input.checkIn) {
    errors.checkOut = 'Check-out harus setelah check-in';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateNumericInput(value: string | number, fieldName: string): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return `${fieldName} harus berupa angka`;
  }
  if (num < 0) {
    return `${fieldName} tidak boleh negatif`;
  }
  return null;
}