export interface ExchangeRateResponse {
  rate: number;
  timestamp: string;
  source: string;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let cachedRate: ExchangeRateResponse | null = null;
let cacheTimestamp = 0;

export async function fetchExchangeRate(): Promise<ExchangeRateResponse> {
  const now = Date.now();
  
  if (cachedRate && now - cacheTimestamp < CACHE_DURATION) {
    return cachedRate;
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/SAR', {
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }
    
    const data = await response.json();
    
    if (data.result === 'success' && data.rates && data.rates.IDR) {
      const rate = data.rates.IDR;
      cachedRate = {
        rate,
        timestamp: new Date().toISOString(),
        source: 'open.er-api.com',
      };
      cacheTimestamp = now;
      return cachedRate;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    if (cachedRate) {
      return cachedRate;
    }
    throw error;
  }
}

export function getCachedRate(): ExchangeRateResponse | null {
  return cachedRate;
}

export function clearCache(): void {
  cachedRate = null;
  cacheTimestamp = 0;
}