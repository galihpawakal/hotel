import { NextRequest, NextResponse } from 'next/server';
import { getHotelsByCity } from '@/lib/mockHotels';
import { Hotel } from '@/types/hotel';
import { HotelSearchParams } from '@/types/hotel';
import { validateSearchParams } from '@/lib/validation';

async function simulateMockApiConditions(): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === 'production') return null;

  const configuredDelay = Number(process.env.MOCK_HOTELS_DELAY_MS || 0);
  const delay = Number.isFinite(configuredDelay) ? Math.min(Math.max(configuredDelay, 0), 10000) : 0;
  if (delay > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }

  if (process.env.MOCK_HOTELS_FAIL === 'true') {
    return NextResponse.json(
      { error: 'Simulasi kegagalan Mock API hotel. Silakan coba lagi.' },
      { status: 503 }
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city') as 'Makkah' | 'Madinah' | null;

  if (!city || (city !== 'Makkah' && city !== 'Madinah')) {
    return NextResponse.json(
      { error: 'Parameter city harus Makkah atau Madinah' },
      { status: 400 }
    );
  }

  const simulatedResponse = await simulateMockApiConditions();
  if (simulatedResponse) return simulatedResponse;

  const hotels = getHotelsByCity(city);

  return NextResponse.json({
    data: hotels,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body pencarian tidak valid' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body pencarian tidak valid' }, { status: 400 });
  }

  const params = body as HotelSearchParams;
  const validation = validateSearchParams(params);
  if (!validation.isValid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const simulatedResponse = await simulateMockApiConditions();
  if (simulatedResponse) return simulatedResponse;

  const hotels = getHotelsByCity(params.city);
  return NextResponse.json({ data: hotels });
}