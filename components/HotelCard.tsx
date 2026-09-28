'use client';

import { Hotel } from '@/types/hotel';
import { calculateRooms, calculateNights, calculateTotalHotelSAR } from '@/lib/roomCalculator';
import { formatNumber } from '@/lib/quotationCalculator';

interface HotelCardProps {
  hotel: Hotel;
  searchParams: {
    pax: number;
    roomType: 'Double' | 'Triple' | 'Quad' | 'Quint';
    checkIn: string;
    checkOut: string;
  };
  onSelect: (hotel: Hotel) => void;
}

export default function HotelCard({ hotel, searchParams, onSelect }: HotelCardProps) {
  const rooms = calculateRooms(searchParams.pax, searchParams.roomType);
  const nights = calculateNights(searchParams.checkIn, searchParams.checkOut);
  const totalHotelSAR = calculateTotalHotelSAR(rooms, nights, hotel.pricePerNight, hotel.taxPercentage || 0);
  const perPaxHotel = totalHotelSAR / searchParams.pax;

  return (
    <article className="border border-brand-border bg-white p-5 transition-colors hover:border-brand-primary-dark sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-sans text-xl font-semibold text-brand-dark">{hotel.name}</h3>
          <p className="mt-1 text-sm text-brand-muted">{hotel.city}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-brand-dark sm:text-2xl">
            SAR {formatNumber(hotel.pricePerNight)}
            <span className="text-sm font-normal text-brand-muted">/room/malam</span>
          </p>
          {hotel.taxPercentage && hotel.taxPercentage > 0 && (
            <p className="mt-1 text-sm text-brand-muted">Termasuk tax {hotel.taxPercentage}%</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-brand-border pt-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-semibold text-brand-muted">EST. KAMAR</p>
          <p className="mt-1 font-semibold text-brand-dark">{rooms} kamar</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-muted">DURASI</p>
          <p className="mt-1 font-semibold text-brand-dark">{nights} malam</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-muted">TOTAL HOTEL</p>
          <p className="mt-1 font-semibold text-brand-dark">SAR {formatNumber(totalHotelSAR)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-muted">PER JAMAAH</p>
          <p className="mt-1 font-semibold text-brand-dark">SAR {formatNumber(Math.round(perPaxHotel))}</p>
        </div>
      </div>

      <button
        onClick={() => onSelect(hotel)}
        className="button-primary mt-5 w-full sm:w-auto"
      >
        PILIH HOTEL
      </button>
    </article>
  );
}