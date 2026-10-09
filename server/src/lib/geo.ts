export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return haversineDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
}

// Minimum distance from a point to a polyline in meters
export function minDistanceToPolyline(
  lat: number,
  lng: number,
  polyline: [number, number][]
): number {
  if (polyline.length === 0) return Infinity;
  let minDist = Infinity;
  for (let i = 0; i < polyline.length; i++) {
    const dist = haversineDistanceMeters(lat, lng, polyline[i][0], polyline[i][1]);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}
