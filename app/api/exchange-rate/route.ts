import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRate } from '@/lib/exchangeRate';

export async function GET(request: NextRequest) {
  try {
    const rateData = await fetchExchangeRate();
    return NextResponse.json(rateData);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Gagal mengambil kurs otomatis', 
        message: 'Silakan isi kurs manual' 
      },
      { status: 500 }
    );
  }
}