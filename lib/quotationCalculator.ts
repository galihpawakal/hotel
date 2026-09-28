import { QuotationInput, QuotationBreakdown } from '@/types/quotation';
import { calculateRooms, calculateNights, calculateTotalHotelSAR } from './roomCalculator';

export function calculateQuotation(input: QuotationInput): QuotationBreakdown {
  const rooms = calculateRooms(input.pax, input.roomType);
  const nights = calculateNights(input.checkIn, input.checkOut);
  const taxPercentage = input.hotelTaxPercentage;

  const totalHotelSAR = calculateTotalHotelSAR(rooms, nights, input.hotel.pricePerNight, taxPercentage);
  const totalHotelIDR = Math.round(totalHotelSAR * input.exchangeRate);
  const totalVisaSAR = input.pax * input.visaPerPaxSAR;
  const totalVisaIDR = Math.round(totalVisaSAR * input.exchangeRate);
  const transportTotalIDR = Math.round(input.transportTotalSAR * input.exchangeRate);
  const totalSAR = totalHotelSAR + totalVisaSAR + input.transportTotalSAR;
  const totalSARinIDR = totalHotelIDR + totalVisaIDR + transportTotalIDR;
  const totalTicketIDR = Math.round(input.pax * input.ticketPerPaxIDR);
  const totalCostIDR = totalSARinIDR + totalTicketIDR;
  const costPerPaxIDR = Math.round(totalCostIDR / input.pax);
  const marginPerPaxIDR = Math.round(input.marginPerPaxIDR);
  const hargaJualPerPax = costPerPaxIDR + marginPerPaxIDR;

  return {
    hotelId: input.hotel.id,
    hotelName: input.hotel.name,
    city: input.hotel.city,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    pax: input.pax,
    roomType: input.roomType,
    rooms,
    pricePerNightSAR: input.hotel.pricePerNight,
    taxPercentage,
    totalHotelSAR,
    totalHotelIDR,
    totalVisaSAR,
    totalVisaIDR,
    transportTotalSAR: input.transportTotalSAR,
    transportTotalIDR,
    totalSAR,
    exchangeRate: input.exchangeRate,
    totalSARinIDR,
    totalTicketIDR,
    totalCostIDR,
    costPerPaxIDR,
    marginPerPaxIDR,
    hargaJualPerPax,
  };
}

export function formatCurrency(amount: number, currency: 'SAR' | 'IDR' = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}