export interface Hotel {
  id: string;
  name: string;
  city: string;
  pricePerNight: number;
  taxPercentage?: number;
}

export interface HotelSearchParams {
  city: 'Makkah' | 'Madinah';
  checkIn: string;
  checkOut: string;
  pax: number;
  roomType: 'Double' | 'Triple' | 'Quad' | 'Quint';
}

export interface HotelSearchResult {
  data: Hotel[];
}