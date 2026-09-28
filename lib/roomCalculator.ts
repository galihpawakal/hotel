export const ROOM_CAPACITY: Record<string, number> = {
  Double: 2,
  Triple: 3,
  Quad: 4,
  Quint: 5,
};

export function calculateRooms(pax: number, roomType: keyof typeof ROOM_CAPACITY): number {
  if (pax <= 0) return 0;
  const capacity = ROOM_CAPACITY[roomType] || 2;
  return Math.ceil(pax / capacity);
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diffTime = outDate.getTime() - inDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateTotalHotelSAR(
  rooms: number,
  nights: number,
  pricePerNight: number,
  taxPercentage: number = 0
): number {
  const baseTotal = rooms * nights * pricePerNight;
  return baseTotal * (1 + taxPercentage / 100);
}