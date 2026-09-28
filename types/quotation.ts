import { Hotel } from './hotel';

export interface QuotationInput {
  hotel: Hotel;
  pax: number;
  roomType: 'Double' | 'Triple' | 'Quad' | 'Quint';
  checkIn: string;
  checkOut: string;
  hotelTaxPercentage: number;
  exchangeRate: number;
  visaPerPaxSAR: number;
  transportTotalSAR: number;
  ticketPerPaxIDR: number;
  marginPerPaxIDR: number;
}

export interface QuotationBreakdown {
  hotelId: string;
  hotelName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pax: number;
  roomType: string;
  rooms: number;
  pricePerNightSAR: number;
  taxPercentage: number;
  totalHotelSAR: number;
  totalHotelIDR: number;
  totalVisaSAR: number;
  totalVisaIDR: number;
  transportTotalSAR: number;
  transportTotalIDR: number;
  totalSAR: number;
  exchangeRate: number;
  totalSARinIDR: number;
  totalTicketIDR: number;
  totalCostIDR: number;
  costPerPaxIDR: number;
  marginPerPaxIDR: number;
  hargaJualPerPax: number;
}

export interface SavedQuotation {
  id: string;
  savedAt: string;
  data: QuotationBreakdown;
}

export interface ExchangeRateResponse {
  rate: number;
  timestamp: string;
  source: string;
}