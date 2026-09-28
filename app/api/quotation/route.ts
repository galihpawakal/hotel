import { NextRequest, NextResponse } from 'next/server';
import { calculateQuotation } from '@/lib/quotationCalculator';
import { getHotelById } from '@/lib/mockHotels';
import { validateQuotationInput } from '@/lib/validation';
import { QuotationInput } from '@/types/quotation';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body quotation tidak valid' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body quotation tidak valid' }, { status: 400 });
  }

  const input = body as QuotationInput;
  const hotel = input.hotel && typeof input.hotel.id === 'string'
    ? getHotelById(input.hotel.id)
    : undefined;
  if (!hotel) {
    return NextResponse.json({ errors: { hotel: 'Hotel tidak ditemukan' } }, { status: 400 });
  }

  const authoritativeInput = {
    ...input,
    hotel: { ...hotel, taxPercentage: input.hotelTaxPercentage },
  };
  const validation = validateQuotationInput(authoritativeInput);
  if (!validation.isValid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  return NextResponse.json({ data: calculateQuotation(authoritativeInput) });
}