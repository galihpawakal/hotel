import { Hotel } from '@/types/hotel';

export const mockHotels: Hotel[] = [
  { id: '1', name: 'Fairmont Makkah', city: 'Makkah', pricePerNight: 1500, taxPercentage: 0 },
  { id: '2', name: 'Pullman Zamzam Makkah', city: 'Makkah', pricePerNight: 1100, taxPercentage: 0 },
  { id: '3', name: 'Movenpick Makkah', city: 'Makkah', pricePerNight: 1250, taxPercentage: 0 },
  { id: '4', name: 'Anwar Al Madinah Movenpick', city: 'Madinah', pricePerNight: 900, taxPercentage: 0 },
  { id: '5', name: 'Emaar Royal Madinah', city: 'Madinah', pricePerNight: 650, taxPercentage: 0 },
];

export function getHotelsByCity(city: 'Makkah' | 'Madinah'): Hotel[] {
  return mockHotels.filter((hotel) => hotel.city === city);
}

export function getHotelById(id: string): Hotel | undefined {
  return mockHotels.find((hotel) => hotel.id === id);
}